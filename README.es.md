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
| Frontend | ✅ Funcional con datos mock — ver [`frontend/README.es.md`](frontend/README.es.md) |
| Backend | ✅ Scaffold con API REST + colas — ver [`backend/README.es.md`](backend/README.es.md) |
| Baileys (WhatsApp) | ⏳ Estructura lista, conexión real pendiente |
| Frontend ↔ Backend | ⏳ Integración pendiente — hoy corren por separado |
| Despliegue | ⏳ Firebase Hosting (frontend) + VPS (backend) |

## Cómo arrancar en local

**Frontend** (con datos mock, no necesita backend):

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

**Backend** (requiere Docker para Postgres + Redis):

```bash
cd backend
cp .env.example .env
docker compose up -d
npm install
npm run prisma:migrate
npm run db:seed
npm run dev          # http://localhost:3001
```

Más detalles, arquitectura y diagramas en el README de cada módulo.

## Licencia

[MIT](LICENSE) © Gerardo González
