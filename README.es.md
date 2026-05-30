# Trigra Chatbot WSP

> 🇪🇸 **Español** · [🇬🇧 English](README.md)

Plataforma para gestionar campañas masivas de WhatsApp con múltiples sesiones (Baileys), control de operadores, contactos, plantillas y reportes.

```
app-chatbot/
├── frontend/   ← React + Vite + Tailwind         (panel web)
└── backend/    ← Fastify + Prisma + BullMQ + IO  (API REST + colas + tiempo real)
```

## Estado actual

| Módulo | Estado |
|---|---|
| Frontend | ✅ Conectado al backend — ver [`frontend/README.es.md`](frontend/README.es.md) |
| Backend | ✅ API REST + colas + tiempo real — ver [`backend/README.es.md`](backend/README.es.md) |
| Frontend ↔ Backend | ✅ Integrado con TanStack Query + Socket.IO |
| Baileys (WhatsApp) | ✅ Conectado — QR vía Socket.IO, envío real desde worker BullMQ |
| Bot auto-respuesta | ✅ Flows de menús + handoff a humano · bandeja para operadores |
| Firebase Hosting | ✅ Configurado — `cd frontend && npm run deploy` |
| Despliegue VPS | ⏳ Pendiente |

## Cómo arrancar en local

Necesitas **ambos** procesos corriendo. Arranca el backend primero:

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env
docker compose up -d            # Postgres + Redis
npm install
npm run prisma:migrate          # crea las tablas
npm run db:seed                 # carga datos de prueba
npm run dev                     # http://localhost:3001
```

Luego el frontend:

```bash
# Terminal 2 — frontend
cd frontend
cp .env.example .env.local      # luego rellena Firebase + VITE_API_URL
npm install
npm run dev                     # http://localhost:5173
```

Abre `http://localhost:5173` e inicia sesión con:

- **admin / demo1234** → vista de administrador
- **maria.q / demo1234** → vista de operador

(Cualquier usuario del seed funciona con la contraseña `demo1234`.)

Más detalles, arquitectura y diagramas en el README de cada módulo.

## Licencia

[MIT](LICENSE) © Gerardo González
