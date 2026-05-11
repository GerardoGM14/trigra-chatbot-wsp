# Trigra Chatbot WSP

> 🇬🇧 **English** · [🇪🇸 Español](README.es.md)

Platform for managing bulk WhatsApp campaigns with multiple sessions (Baileys), operator control, contacts, templates and reports.

```
app-chatbot/
├── frontend/   ← React + Vite + Tailwind   (web panel)
└── backend/    ← Fastify + Postgres + Redis (pending)
```

## Current status

| Module | Status |
|---|---|
| Frontend | ✅ Working with mock data — see [`frontend/README.md`](frontend/README.md) |
| Backend | ⏳ Pending |
| Deployment | ⏳ Firebase Hosting (frontend) + VPS (backend) |

## Running the frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

More details, architecture and diagrams in [`frontend/README.md`](frontend/README.md).

## License

[MIT](LICENSE) © Gerardo González
