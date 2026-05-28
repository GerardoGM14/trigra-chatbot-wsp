# Backend — WSP Control

> 🇬🇧 **English** · [🇪🇸 Español](README.es.md)

REST API + WebSockets + send queue for the WSP Control platform. It currently runs with seed data and a stub worker; once Baileys is plugged in, this same server handles real WhatsApp sessions.

> This README covers **only the backend**. The frontend is documented in its own folder.

---

## Stack

| Layer | Tech | Why |
|---|---|---|
| Runtime | **Node.js 22 LTS** | Supported until 2027, native ESM |
| HTTP | **Fastify 5** | ~2× faster than Express, built-in schemas, mature plugins |
| Language | **TypeScript 5** | Strong API types + Prisma auto-generated client |
| ORM | **Prisma 6** | Migrations, TS types, query builder with autocomplete |
| DB | **PostgreSQL 17** | Arrays, JSON, FTS, real transactions |
| Realtime | **Socket.IO 4** | WebSockets + fallback, rooms per session/campaign |
| Queues | **BullMQ 5 + Redis 7** | Rate limit, retries, delays, scheduled jobs |
| Auth | **JWT + bcrypt** | Signed tokens, hashed passwords |
| Validation | **Zod 3** | Runtime schemas + inferred TS types |
| Logger | **Pino 9** | Structured JSON, fast |
| WhatsApp | **Baileys** | Multi-session WhatsApp Web (QR via Socket.IO, send via BullMQ worker) |

---

## Structure

```
backend/
├── docker-compose.yml       ← Postgres + Redis for local dev
├── .env.example             ← required vars documented
├── prisma/
│   ├── schema.prisma        ← User/Session/Group/Campaign/... models
│   └── seed.ts              ← initial data (= same as frontend mock)
└── src/
    ├── server.ts            ← entrypoint (listen + Socket.IO + workers)
    ├── app.ts               ← buildApp() — Fastify + plugins + routes
    ├── config/
    │   └── env.ts           ← loads + validates .env with Zod
    ├── lib/
    │   ├── prisma.ts        ← Prisma Client singleton
    │   ├── redis.ts         ← Redis connections (general + BullMQ)
    │   └── errors.ts        ← typed HttpError + helpers (Unauthorized, ...)
    ├── plugins/
    │   ├── jwt.ts           ← @fastify/jwt + `authenticate` decorator
    │   └── errorHandler.ts  ← converts errors to consistent JSON
    ├── modules/             ← ONE module per domain
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
    │   └── io.ts            ← Socket.IO + reusable emitters
    ├── queues/
    │   ├── sendQueue.ts     ← BullMQ SendJob queue
    │   └── workers.ts       ← processor with rate limit
    └── baileys/
        └── index.ts         ← scaffolded (not connected yet)
```

---

## Deployment diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  VPS (Ubuntu LTS)                           │
│                                                              │
│  Nginx :443 ──┬── /health, /auth, /api → Fastify :3001      │
│               └── /socket.io           → Socket.IO :3001    │
│                                                              │
│  Node 22 (PM2)                                               │
│   ├─ Fastify HTTP                                            │
│   ├─ Socket.IO (same HTTP server)                            │
│   ├─ BullMQ workers                                          │
│   └─ Baileys (1 WSP socket per session)                      │
│                                                              │
│  PostgreSQL 17                                               │
│  Redis 7                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## HTTP request diagram

```
Frontend (Firebase)
        │ POST /api/campaigns
        ▼
Nginx (TLS, reverse proxy)
        │
        ▼
Fastify
  ├─ rate-limit       (300 req/min per IP)
  ├─ cors             (Firebase origin)
  ├─ authenticate     (JWT verify → req.user)
  └─ campaigns route
         │
         ├─ Zod validate body
         ├─ Prisma → INSERT campaign + groups
         └─ (future) sendQueue.add(...)  → BullMQ → Baileys
                                  │
                                  └─ Socket.IO emit progress
                                              │
                                              ▼
                                        Frontend (live update)
```

---

## Main models (Prisma)

```
User ─< SessionAssignment >─ BaileysSession ─< Campaign
   │                                              │
   └─< Campaign (owner)                           ├─< SendJob
                                                  └─< CampaignGroup >─ ContactGroup ─< Contact
Template ──< Campaign (snapshot)

ActivityLog (audit)
AccountPolicy (singleton for global config)
```

Details:
- **Internal IDs**: `cuid()` (short, sortable, k-safe)
- **Public IDs**: `slug` field (e.g. `camp_8821`) — visible in UI and logs
- **Prisma enums** match frontend values: `UserStatus = Activo|Suspendido|Invitado`, `CampaignStatus = Borrador|Programada|...`
- **Soft references** in `ActivityLog.target` (string, not FK) — logs survive if the resource gets deleted.

---

## Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/health` | Healthcheck for PM2/Nginx | public |
| POST | `/auth/login` | Returns JWT | public |
| POST | `/auth/forgot` | Request password reset | public |
| GET | `/auth/me` | Current user data | JWT |
| GET / POST / PATCH / DELETE | `/api/users` | Users CRUD | JWT (admin/sup) |
| GET / POST / PATCH / DELETE | `/api/groups` | Groups CRUD | JWT |
| GET / POST / DELETE | `/api/contacts` | Paginated list + filters | JWT |
| GET / POST / PATCH / DELETE | `/api/templates` | Templates CRUD | JWT |
| GET / POST / DELETE | `/api/campaigns` | Campaigns CRUD | JWT |
| POST | `/api/campaigns/:id/{pause,resume,launch,archive}` | Status transitions | JWT |
| GET | `/api/activity` | Audit feed | JWT |
| GET / POST | `/api/sessions` | List + create | JWT |
| POST | `/api/sessions/:id/{assign,exclusive,restart}` | Session actions | JWT |

All error responses use `{ code, message, details? }`.

---

## Environment variables

Copy `.env.example` to `.env` and fill it in. The server fails fast if any variable is missing or has the wrong type:

```bash
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

DATABASE_URL=postgresql://wsp_user:wsp_password@localhost:5432/wsp_control
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=wsp                   # isolates keys if Redis is shared with other apps

JWT_SECRET=<min 32 chars>          # generate with: openssl rand -hex 32
JWT_EXPIRES_IN=8h

UPLOAD_DIR=./uploads
BAILEYS_AUTH_DIR=./baileys-auth

SEND_RATE_PER_MINUTE=60
SEND_PAUSE_MIN_SECONDS=2
SEND_PAUSE_MAX_SECONDS=6
```

---

## Running locally

```bash
cd backend
cp .env.example .env

# 1. Boot Postgres + Redis via Docker
docker compose up -d

# 2. Install dependencies
npm install

# 3. Generate the Prisma client and apply migrations
npm run prisma:generate
npm run prisma:migrate

# 4. Load initial data (same as the frontend mock)
npm run db:seed

# 5. Start the server in watch mode
npm run dev      # http://localhost:3001
```

Verify:

```bash
curl http://localhost:3001/health
# { "ok": true, "service": "wsp-control-backend", ... }

curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"demo1234"}'
# { "token": "...", "user": { ... } }
```

### Useful scripts

```bash
npm run dev               # watch mode with tsx
npm run build             # compile TS → dist/
npm run start             # run the production build
npm run typecheck         # validate types without compiling
npm run lint              # ESLint
npm run prisma:studio     # web GUI to inspect the DB
npm run db:reset          # wipe the DB and recreate from migrations + seed
```

---

## VPS deployment

In production, replace Docker with native installs — more efficient when the VPS hosts multiple apps:

```bash
# As root on Ubuntu 24.04 LTS
apt update && apt install -y postgresql-17 redis-server nodejs

# Dedicated DB for this app (other apps get their own)
sudo -u postgres psql -c "CREATE USER wsp_user WITH PASSWORD 'XXX';"
sudo -u postgres psql -c "CREATE DATABASE wsp_control OWNER wsp_user;"

# Deploy
cd /var/www/wsp-control-backend
npm ci --production
npx prisma migrate deploy
pm2 start ecosystem.config.js
pm2 save
```

Apps coexist sharing Postgres (one database per app) and Redis (each app uses its own `REDIS_PREFIX`). Nginx routes by subdomain to each Node process on its internal port.

---

## Baileys integration

The `src/baileys/` module connects each `BaileysSession` row in Postgres to a
live WhatsApp socket via the `baileys` package.

### Lifecycle

```
POST /api/sessions
       │
       ├─► DB row created (status = Reconectando)
       └─► baileys.startSession(slug)
                 │
                 ├─ load creds from BAILEYS_AUTH_DIR/<slug>/  (if any)
                 ├─ open WhatsApp socket
                 ├─ on QR  → emit `session:<slug>`            { type:"qr", qr:<dataUrl> }
                 ├─ on open → status = Conectado, persist phone
                 └─ on close → reconnect or logout (depending on cause)
```

### Sending messages

```
Frontend launches a campaign
       │
       └─► sendQueue.add({ sendJobId, sessionId, phone, body })  (BullMQ)
                  │
                  └─► worker resolves session → baileys.sendMessage(slug, phone, body)
                              │
                              ├─ SendJob → Enviado
                              ├─ Campaign.sent ++
                              └─ Socket.IO `campaign:<slug>` → frontend live update
```

### Persistence

- **Credentials**: `BAILEYS_AUTH_DIR/<slug>/` (excluded from git). One folder
  per session, holds `creds.json` and pre-keys. Reboots are safe — the next
  start reconnects without QR.
- **Auto-resume on boot**: `resumeAllSessions()` runs in `server.ts` after the
  HTTP listener is up. It picks every session with status `Conectado` or
  `Reconectando` and re-opens its socket.
- **Disconnect path**: `DELETE /api/sessions/:id` calls `unlinkSession()`
  which logs out + removes the auth folder, so the next time the slug is used
  WhatsApp will issue a fresh QR.

### Rate limit

The BullMQ worker uses a global limiter (`SEND_RATE_PER_MINUTE` env var,
default 60) to throttle outgoing messages. Sharing one limit across all
sessions is intentional: it protects the account ecosystem from spikes when
multiple sessions send in parallel.

### Important — Baileys is unofficial

Baileys reverse-engineers the WhatsApp Web protocol. Meta does **not**
endorse it. If they detect heavy automated patterns they may ban the number.
Mitigations:
- Use a dedicated phone number (not your personal one)
- Keep `SEND_RATE_PER_MINUTE` conservative (default 60 is already aggressive)
- Insert random pauses between messages (`SEND_PAUSE_MIN/MAX_SECONDS`)
- For production with real customers, migrate to the official WhatsApp Cloud API.

---

## License

[MIT](../LICENSE) © Gerardo González
