# Backend — WSP Control

> 🇪🇸 **Español** · [🇬🇧 English](README.md)

API REST + WebSockets + cola de envíos para la plataforma WSP Control. Hoy corre con datos seed y un worker stub; cuando se conecte Baileys, este mismo servidor maneja las sesiones reales de WhatsApp.

> Este README cubre **solo el backend**. El frontend se documenta en su propia carpeta.

---

## Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Runtime | **Node.js 22 LTS** | Soporte hasta 2027, ESM nativo |
| HTTP | **Fastify 5** | ~2× más rápido que Express, schemas integrados, plugins maduros |
| Lenguaje | **TypeScript 5** | Tipos fuertes en API + Prisma client autogenerado |
| ORM | **Prisma 6** | Migrations, tipos TS, query builder con autocompletado |
| DB | **PostgreSQL 17** | Arrays, JSON, FTS, transacciones reales |
| Realtime | **Socket.IO 4** | WebSockets + fallback, rooms por sesión/campaña |
| Colas | **BullMQ 5 + Redis 7** | Rate limit, reintentos, delays, jobs programados |
| Auth | **JWT + bcrypt** | Tokens firmados, contraseñas hasheadas |
| Validación | **Zod 3** | Schemas en runtime + tipos TS inferidos |
| Logger | **Pino 9** | Estructurado en JSON, rápido |
| WhatsApp | **Baileys** | Multi-sesión WhatsApp Web (QR vía Socket.IO, envío vía worker BullMQ) |

---

## Estructura

```
backend/
├── docker-compose.yml       ← Postgres + Redis para dev local
├── .env.example             ← variables obligatorias documentadas
├── prisma/
│   ├── schema.prisma        ← modelos User/Session/Group/Campaign/...
│   └── seed.ts              ← datos iniciales (= mismos que el frontend mock)
└── src/
    ├── server.ts            ← entrypoint (listen + Socket.IO + workers)
    ├── app.ts               ← buildApp() — Fastify + plugins + rutas
    ├── config/
    │   └── env.ts           ← carga + valida .env con Zod
    ├── lib/
    │   ├── prisma.ts        ← singleton del Prisma Client
    │   ├── redis.ts         ← conexiones Redis (general + BullMQ)
    │   └── errors.ts        ← HttpError tipado + helpers (Unauthorized, ...)
    ├── plugins/
    │   ├── jwt.ts           ← @fastify/jwt + decorator `authenticate`
    │   └── errorHandler.ts  ← convierte errores a JSON consistente
    ├── modules/             ← UN módulo por dominio
    │   ├── health/
    │   ├── auth/            ← schemas + service + routes
    │   ├── users/
    │   ├── groups/
    │   ├── contacts/
    │   ├── templates/
    │   ├── campaigns/
    │   ├── activity/
    │   └── sessions/
    ├── realtime/
    │   └── io.ts            ← Socket.IO + emitters reusables
    ├── queues/
    │   ├── sendQueue.ts     ← cola BullMQ de SendJobs
    │   └── workers.ts       ← procesador con rate limit
    └── baileys/
        └── index.ts         ← estructura preparada (sin conectar aún)
```

---

## Diagrama de despliegue

```
┌─────────────────────────────────────────────────────────────┐
│                  VPS (Ubuntu LTS)                           │
│                                                              │
│  Nginx :443 ──┬── /health, /auth, /api → Fastify :3001      │
│               └── /socket.io           → Socket.IO :3001    │
│                                                              │
│  Node 22 (PM2)                                               │
│   ├─ Fastify HTTP                                            │
│   ├─ Socket.IO (mismo HTTP server)                           │
│   ├─ BullMQ workers                                          │
│   └─ Baileys (1 socket WSP por sesión)                       │
│                                                              │
│  PostgreSQL 17                                               │
│  Redis 7                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Diagrama de petición HTTP

```
Frontend (Firebase)
        │ POST /api/campaigns
        ▼
Nginx (TLS, reverse proxy)
        │
        ▼
Fastify
  ├─ rate-limit       (300 req/min por IP)
  ├─ cors             (origin Firebase)
  ├─ authenticate     (JWT verify → req.user)
  └─ campaigns route
         │
         ├─ Zod validate body
         ├─ Prisma → INSERT campaign + groups
         └─ (futuro) sendQueue.add(...)  → BullMQ → Baileys
                                  │
                                  └─ Socket.IO emit progress
                                              │
                                              ▼
                                        Frontend (live update)
```

---

## Modelos principales (Prisma)

```
User ─< SessionAssignment >─ BaileysSession ─< Campaign
   │                                              │
   └─< Campaign (owner)                           ├─< SendJob
                                                  └─< CampaignGroup >─ ContactGroup ─< Contact
Template ──< Campaign (snapshot)

ActivityLog (auditoría)
AccountPolicy (singleton de config global)
```

Detalles:
- **IDs internos**: `cuid()` (cortos, ordenables, k-safe)
- **IDs públicos**: campo `slug` (ej. `camp_8821`) — visible en UI y logs
- **Enums Prisma** ↔ valores en el frontend: `UserStatus = Activo|Suspendido|Invitado`, `CampaignStatus = Borrador|Programada|Enviando|Pausada|Completada|Archivada`, etc.
- **Soft references** en `ActivityLog.target` (string, no FK) — los registros sobreviven si el recurso se borra.

---

## Endpoints

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/health` | Healthcheck para PM2/Nginx | público |
| POST | `/auth/login` | Devuelve JWT | público |
| POST | `/auth/forgot` | Solicita recuperación | público |
| GET | `/auth/me` | Datos del usuario actual | JWT |
| GET / POST / PATCH / DELETE | `/api/users` | CRUD usuarios | JWT (admin/sup) |
| GET / POST / PATCH / DELETE | `/api/groups` | CRUD grupos | JWT |
| GET / POST / DELETE | `/api/contacts` | Listado paginado + filtros | JWT |
| GET / POST / PATCH / DELETE | `/api/templates` | CRUD plantillas | JWT |
| GET / POST / DELETE | `/api/campaigns` | CRUD campañas | JWT |
| POST | `/api/campaigns/:id/{pause,resume,launch,archive}` | Transiciones de estado | JWT |
| GET | `/api/activity` | Feed de auditoría | JWT |
| GET / POST | `/api/sessions` | Listado + creación | JWT |
| POST | `/api/sessions/:id/{assign,exclusive,restart}` | Acciones de sesión | JWT |

Todas las respuestas de error usan el formato `{ code, message, details? }`.

---

## Variables de entorno

Copia `.env.example` a `.env` y rellena. El servidor falla rápido si falta o tiene tipo equivocado alguna variable:

```bash
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

DATABASE_URL=postgresql://wsp_user:wsp_password@localhost:5432/wsp_control
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=wsp                   # aísla claves si Redis se comparte con otras apps

JWT_SECRET=<min 32 chars>          # genera con: openssl rand -hex 32
JWT_EXPIRES_IN=8h

UPLOAD_DIR=./uploads
BAILEYS_AUTH_DIR=./baileys-auth

SEND_RATE_PER_MINUTE=60
SEND_PAUSE_MIN_SECONDS=2
SEND_PAUSE_MAX_SECONDS=6
```

---

## Cómo arrancar (desarrollo local)

```bash
cd backend
cp .env.example .env

# 1. Levanta Postgres + Redis con Docker
docker compose up -d

# 2. Instala dependencias
npm install

# 3. Genera el cliente Prisma y aplica migrations
npm run prisma:generate
npm run prisma:migrate

# 4. Carga datos iniciales (mismos que el frontend mock)
npm run db:seed

# 5. Arranca el server en watch mode
npm run dev      # http://localhost:3001
```

Verifica:

```bash
curl http://localhost:3001/health
# { "ok": true, "service": "wsp-control-backend", ... }

curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"demo1234"}'
# { "token": "...", "user": { ... } }
```

### Scripts útiles

```bash
npm run dev               # arranca en modo watch con tsx
npm run build             # compila TS → dist/
npm run start             # corre el build de producción
npm run typecheck         # valida tipos sin compilar
npm run lint              # ESLint
npm run prisma:studio     # GUI web para inspeccionar la DB
npm run db:reset          # tira la DB y la recrea desde migrations + seed
```

---

## Despliegue en VPS

En producción cambia Docker por instalaciones nativas — más eficiente cuando la VPS aloja varias apps:

```bash
# Como root en Ubuntu 24.04 LTS
apt update && apt install -y postgresql-17 redis-server nodejs

# DB dedicada para esta app (otras apps tendrán su propia DB)
sudo -u postgres psql -c "CREATE USER wsp_user WITH PASSWORD 'XXX';"
sudo -u postgres psql -c "CREATE DATABASE wsp_control OWNER wsp_user;"

# Deploy
cd /var/www/wsp-control-backend
npm ci --production
npx prisma migrate deploy
pm2 start ecosystem.config.js
pm2 save
```

Las apps coexisten compartiendo Postgres (una database por app) y Redis (cada app usa su `REDIS_PREFIX`). Nginx enruta por subdominio a cada proceso Node en su puerto interno.

---

## Integración Baileys

El módulo `src/baileys/` conecta cada fila `BaileysSession` de Postgres a un
socket WhatsApp en vivo vía el paquete `baileys`.

### Ciclo de vida

```
POST /api/sessions
       │
       ├─► Fila DB creada (status = Reconectando)
       └─► baileys.startSession(slug)
                 │
                 ├─ carga creds de BAILEYS_AUTH_DIR/<slug>/  (si existen)
                 ├─ abre socket WhatsApp
                 ├─ on QR  → emite `session:<slug>`           { type:"qr", qr:<dataUrl> }
                 ├─ on open → status = Conectado, persiste número
                 └─ on close → reconecta o logout (según causa)
```

### Envío de mensajes

```
Frontend lanza una campaña
       │
       └─► sendQueue.add({ sendJobId, sessionId, phone, body })  (BullMQ)
                  │
                  └─► worker resuelve sesión → baileys.sendMessage(slug, phone, body)
                              │
                              ├─ SendJob → Enviado
                              ├─ Campaign.sent ++
                              └─ Socket.IO `campaign:<slug>` → frontend actualiza en vivo
```

### Persistencia

- **Credenciales**: `BAILEYS_AUTH_DIR/<slug>/` (excluido de git). Una carpeta
  por sesión, guarda `creds.json` y pre-keys. Los reinicios son seguros — el
  siguiente arranque reconecta sin pedir QR.
- **Auto-resume al arrancar**: `resumeAllSessions()` corre en `server.ts`
  tras levantar el listener HTTP. Toma cada sesión con estado `Conectado` o
  `Reconectando` y reabre su socket.
- **Desconexión limpia**: `DELETE /api/sessions/:id` llama a `unlinkSession()`
  que hace logout + borra la carpeta de auth; la próxima vez que el slug se
  use, WhatsApp emitirá un QR fresco.

### Rate limit

El worker BullMQ usa un limiter global (`SEND_RATE_PER_MINUTE`, default 60)
para controlar los envíos. Compartir un solo límite entre todas las sesiones
es intencional: protege el conjunto de cuentas de picos cuando varias sesiones
envían en paralelo.

### Importante — Baileys es no oficial

Baileys hace reverse-engineering del protocolo de WhatsApp Web. Meta **no**
lo endorsa. Si detecta patrones automatizados pesados puede banear el número.
Mitigaciones:
- Usa un número dedicado (no tu personal)
- Mantén `SEND_RATE_PER_MINUTE` conservador (60 ya es agresivo)
- Inserta pausas aleatorias entre mensajes (`SEND_PAUSE_MIN/MAX_SECONDS`)
- Para producción con clientes reales, migra a WhatsApp Cloud API oficial.

---

## Licencia

[MIT](../LICENSE) © Gerardo González
