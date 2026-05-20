# Trigra Chatbot WSP

> 🇬🇧 **English** · [🇪🇸 Español](README.es.md)

Platform for managing bulk WhatsApp campaigns with multiple sessions (Baileys), operator control, contacts, templates and reports.

```
app-chatbot/
├── frontend/   ← React + Vite + Tailwind         (web panel)
└── backend/    ← Fastify + Prisma + BullMQ + IO  (REST API + queues + realtime)
```

## Current status

| Module | Status |
|---|---|
| Frontend | ✅ Working with mock data — see [`frontend/README.md`](frontend/README.md) |
| Backend | ✅ Scaffolded with REST API + queues — see [`backend/README.md`](backend/README.md) |
| Baileys (WhatsApp) | ⏳ Module structure ready, real connection pending |
| Frontend ↔ Backend | ⏳ Wiring pending — both run in isolation today |
| Deployment | ⏳ Firebase Hosting (frontend) + VPS (backend) |

## Running locally

**Frontend** (mock data, no backend needed):

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

**Backend** (requires Docker for Postgres + Redis):

```bash
cd backend
cp .env.example .env
docker compose up -d
npm install
npm run prisma:migrate
npm run db:seed
npm run dev          # http://localhost:3001
```

More details, architecture and diagrams in each module's README.

## License

[MIT](LICENSE) © Gerardo González
