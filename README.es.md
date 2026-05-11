# Trigra Chatbot WSP

> 🇪🇸 **Español** · [🇬🇧 English](README.md)

Plataforma para gestionar campañas masivas de WhatsApp con múltiples sesiones (Baileys), control de operadores, contactos, plantillas y reportes.

```
app-chatbot/
├── frontend/   ← React + Vite + Tailwind   (panel web)
└── backend/    ← Fastify + Postgres + Redis (pendiente)
```

## Estado actual

| Módulo | Estado |
|---|---|
| Frontend | ✅ Funcional con datos mock — ver [`frontend/README.es.md`](frontend/README.es.md) |
| Backend | ⏳ Pendiente |
| Despliegue | ⏳ Firebase Hosting (frontend) + VPS (backend) |

## Cómo arrancar el frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Más detalles, arquitectura y diagramas en [`frontend/README.es.md`](frontend/README.es.md).

## Licencia

[MIT](LICENSE) © Gerardo González
