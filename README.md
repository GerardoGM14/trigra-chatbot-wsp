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
| Frontend | ✅ Live against backend — see [`frontend/README.md`](frontend/README.md) |
| Backend | ✅ REST API + queues + realtime — see [`backend/README.md`](backend/README.md) |
| Frontend ↔ Backend | ✅ Wired up via TanStack Query + Socket.IO |
| Baileys (WhatsApp) | ✅ Connected — QR via Socket.IO, real send through BullMQ worker |
| Auto-reply bot | ✅ Menu flows + handoff to human · inbox UI for operators |
| Firebase Hosting | ✅ Configured — `cd frontend && npm run deploy` |
| VPS deployment | ⏳ Pending |

## Running locally

You need **both** processes running. Start the backend first:

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env
docker compose up -d            # Postgres + Redis
npm install
npm run prisma:migrate          # creates tables
npm run db:seed                 # loads demo data
npm run dev                     # http://localhost:3001
```

Then the frontend:

```bash
# Terminal 2 — frontend
cd frontend
cp .env.example .env.local      # then fill in Firebase + VITE_API_URL
npm install
npm run dev                     # http://localhost:5173
```

Open `http://localhost:5173` and log in with:

- **admin / demo1234** → administrator view
- **maria.q / demo1234** → operator view

(Any user from the seed works with password `demo1234`.)

More details, architecture and diagrams in each module's README.

## License

[MIT](LICENSE) © Gerardo González
