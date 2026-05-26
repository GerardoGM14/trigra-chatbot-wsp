# Frontend — WSP Control

> 🇪🇸 **Español** · [🇬🇧 English](README.md)

Panel web para gestionar campañas masivas de WhatsApp vía Baileys: sesiones, contactos, plantillas, programación, reportes y auditoría. Convive con dos roles (Administrador y Operador) sobre el mismo Shell.

> Este README cubre **solo el frontend**. El backend se documenta en su propia carpeta cuando se monte.

---

## Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Build / dev server | **Vite** | Arranque instantáneo, HMR sin fricción, build de producción pequeño |
| UI | **React 19** | Componentes funcionales + hooks, sin clases ni TypeScript en esta fase |
| Estilos | **Tailwind CSS v3** + CSS variables | Utilidades + tokens semánticos (`--bg`, `--accent`, etc.) que cambian con el tema |
| Routing | **react-router v7** | Rutas anidadas + guards por rol + query params para sub-vistas |
| Datos | Mock en `lib/data.js` | Mientras no hay backend; mismo shape que el API futuro |
| Animaciones | CSS keyframes en `index.css` | Sin librería, las clases `anim-*` se aplican vía className |
| Lint | ESLint 9 (flat config) | `react-hooks/*` activado, incluido `react-hooks/purity` |

### Dependencias mínimas

```jsonc
// frontend/package.json (extracto)
{
  "dependencies": {
    "react": "^19",
    "react-dom": "^19",
    "react-router-dom": "^7"
  },
  "devDependencies": {
    "vite": "^8",
    "@vitejs/plugin-react": "^5",
    "tailwindcss": "^3",
    "postcss": "^8",
    "autoprefixer": "^10",
    "eslint": "^9"
  }
}
```

---

## Estructura

```
frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx                  ← router + providers raíz
│   ├── main.jsx                 ← bootstrap React
│   ├── index.css                ← tokens CSS + keyframes + reset
│   │
│   ├── components/
│   │   ├── Icons.jsx            ← mapa `I.*` de iconos SVG
│   │   ├── Logo.jsx
│   │   ├── ThemePicker.jsx      ← switcher flotante de tema
│   │   ├── ui/                  ← 14 primitivas (Button, Input, …)
│   │   ├── overlays/            ← Overlay + ModalShell + Menu
│   │   └── shell/               ← Shell + Sidebar + Topbar + RouteProgressBar
│   │
│   ├── modals/                  ← 23 modales (1 por archivo)
│   ├── screens/
│   │   ├── auth/LoginScreen.jsx
│   │   ├── admin/               ← Overview, Users, Activity, Settings
│   │   ├── user/                ← Sessions, Campaigns, Compose, …
│   │   │   └── compose/         ← sub-componentes del flujo de composición
│   │   └── shared/FakeQR.jsx    ← QR mock reutilizado
│   │
│   ├── hooks/
│   │   └── useTheme.js          ← persiste el tema activo en localStorage
│   └── lib/
│       ├── auth.jsx             ← AuthContext + useAuth
│       ├── toast.jsx            ← ToastProvider + useToast
│       ├── themes.js            ← 5 paletas (arena, niebla, carbón, papel, lino)
│       ├── data.js              ← mock de usuarios / campañas / etc.
│       └── ids.js               ← generadores cortos (newCampaignId, …)
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

### Convención de nombres

- `PascalCase.jsx` → archivos que exportan un componente principal
- `camelCase.js` → utilidades, datos, hooks
- `camelCase.jsx` → archivos auxiliares con JSX que no son componente principal
- `kebab-case` para carpetas

---

## Arquitectura — diagrama de alto nivel

```
                          ┌──────────────────────────────────┐
                          │            <App />               │
                          │  ┌────────────────────────────┐  │
                          │  │   <AuthProvider>           │  │
                          │  │   <ToastProvider>          │  │
                          │  │   <BrowserRouter>          │  │
                          │  │     <Routes />             │  │
                          │  │   </BrowserRouter>         │  │
                          │  │   </ToastProvider>         │  │
                          │  │   </AuthProvider>          │  │
                          │  │   <ThemePicker />          │  │
                          │  └────────────────────────────┘  │
                          └──────────┬───────────────────────┘
                                     │
            ┌────────────────────────┴────────────────────────┐
            │                                                  │
       ┌────▼─────┐                                  ┌─────────▼──────────┐
       │ /login   │                                  │  RequireRole       │
       │          │                                  │  ─ admin / user ─  │
       │ LoginSc. │                                  │     <Shell />      │
       └──────────┘                                  └─────────┬──────────┘
                                                               │
                              ┌────────────────────────────────┼────────────────┐
                              │                                │                │
                       ┌──────▼──────┐               ┌─────────▼────────┐  ┌────▼─────┐
                       │  Sidebar    │               │   Topbar         │  │ RouteBody│
                       │  (NavLinks) │               │   (search,       │  │ <Outlet/>│
                       │             │               │    bell, perfil) │  │ + anim   │
                       └─────────────┘               └──────────────────┘  └────┬─────┘
                                                                                │
                                                              ┌─────────────────┼─────────────────┐
                                                              │                                   │
                                                       ┌──────▼───────┐                  ┌────────▼────────┐
                                                       │  /a/*        │                  │   /u/*          │
                                                       │  AdminOver-  │                  │   UserSessions  │
                                                       │  view, Users,│                  │   Campaigns,    │
                                                       │  Activity,   │                  │   Compose,      │
                                                       │  Settings    │                  │   Contacts,     │
                                                       │              │                  │   Templates,    │
                                                       │              │                  │   Schedule,     │
                                                       │              │                  │   Reports       │
                                                       └──────────────┘                  └─────────────────┘
```

### Flujo de routing (react-router)

```
/                       → redirige a /login o a /a|/u según AuthContext
/login                  → LoginScreen (sin Shell)
/a                      → Shell + AdminOverview     (guard: rol=admin)
/a/users                → Shell + AdminUsers
/a/activity             → Shell + AdminActivity
/a/settings             → Shell + AdminSettings
/u                      → Shell + UserSessions      (guard: rol=user)
/u/campaigns            → Shell + CampaignsRoute    (lista o compose según ?compose=1)
/u/campaigns?compose=1  → Shell + UserCompose
/u/contacts             → Shell + UserContacts
/u/templates            → Shell + UserTemplates
/u/schedule             → Shell + UserSchedule
/u/reports              → Shell + UserReports
```

`RequireRole` envuelve cada rama: si no hay sesión → `/login`; si el rol no coincide → home del rol correcto.

---

## Sistema de temas

5 paletas definidas en `lib/themes.js`, cada una mapea el mismo set de CSS variables sobre `:root`:

```
arena    crema cálido       acento terracota   #C24A22
niebla   gris frío          acento azul        #1F3F8F
carbón   modo oscuro        acento ámbar       #E2853A
papel    blanco puro        acento tinta       #0A0A09
lino     beige claro        acento morado vino #6B2B7A
```

Tailwind consume estas variables vía colores semánticos:

```js
// tailwind.config.js
colors: {
  bg: "var(--bg)",
  accent: "var(--accent)",
  // ...
}
```

Resultado: cambiar el tema activo (vía `<ThemePicker>`) reescribe los CSS vars en `:root` y **toda la app se re-skinea sin re-renderizar componentes**. El tema activo se persiste en `localStorage`.

```
ThemePicker  ──► setTheme()  ──►  useTheme() hook
                                       │
                                       ├──► localStorage.setItem(...)
                                       └──► applyTheme() ─► document.documentElement.style.setProperty(...)
                                                                       │
                                                                       └──► CSS vars actualizadas → componentes re-skin
```

---

## Componentes y dependencias

### Capas

```
┌─────────────────────────────────────────────────┐
│  screens/* (admin, user, auth, shared)          │  ← lógica de pantalla
└─────────────────────────────────────────────────┘
           │
           ├──► modals/*               ← 23 modales reutilizables
           ├──► components/shell/      ← Shell, Sidebar, Topbar
           │
           ▼
┌─────────────────────────────────────────────────┐
│  components/overlays/                           │  ← Overlay, ModalShell, Menu
│  components/ui/                                 │  ← Button, Input, Panel, …
│  components/Icons.jsx · Logo.jsx · ThemePicker  │
└─────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────┐
│  hooks/useTheme       lib/auth · toast          │  ← contextos + estado global
│  lib/themes · data · ids                        │  ← datos + utilidades
└─────────────────────────────────────────────────┘
```

Las dependencias **siempre** van hacia abajo: una primitiva nunca importa una pantalla.

### Tabla resumen

| Capa | Archivos | Líneas máx. | Función |
|---|---|---|---|
| App raíz | `App.jsx`, `main.jsx` | <100 | Router + providers |
| Shell | `components/shell/*` | <200 | Layout + navegación + progress bar |
| UI primitivas | `components/ui/*` | <80 c/u | Button, Input, Table, Avatar, … |
| Overlays | `components/overlays/*` | <130 | Modal portal + dropdown |
| Modales | `modals/*` (23) | <300 c/u | Cada acción concreta |
| Pantallas | `screens/*` (12) | <320 c/u | Vista por ruta |
| Estado global | `lib/auth.jsx`, `lib/toast.jsx` | <110 | Context + hook |
| Datos | `lib/data.js`, `lib/ids.js`, `lib/themes.js` | <90 | Constantes |

---

## Patrones aplicados

### Modales con portal

Todos los modales se renderizan en `document.body` vía `createPortal`. El backdrop centrado (X e Y) cubre **todo** el viewport — sidebar y topbar incluidos — sin importar desde qué subtree del árbol se invoque el modal.

```
[ Pantalla cualquiera ]
        │
        └──► <NewGroupModal onClose=... onCreate=...>
                    │
                    └──► <ModalShell ...>          ←── título + body + footer
                                │
                                └──► <Overlay>     ←── portal a document.body
                                          │
                                          ▼
                            document.body
                            └─ <div fixed inset-0 dim-bg>
                               └─ <div modal content>
```

### Toasts globales

`<ToastProvider>` envuelve la app y expone `useToast()` a cualquier componente. Las notificaciones se renderizan en otro portal al `document.body`, abajo-centro, con auto-dismiss en 3.2s.

```
useToast().toast.ok("Guardado") ──► ToastContext.push ──► ToastViewport (portal)
                                                                  │
                                                                  └─ render <ToastItem> auto-dismiss
```

### Auth mock

`<AuthProvider>` mantiene `{ user: { role, name, label } }` en memoria. Cuando aterrice el backend solo cambia el `login()`: hoy hace `setUser({...})` con datos hardcoded, mañana hará `fetch("/auth/login")` y guardará el JWT.

```
LoginScreen.onLogin(role) ──► auth.login(role) ──► setUser({...}) ──► navigate("/a"|"/u")
                                                       │
                                                       ▼
                                            RequireRole resuelve guard
```

### Route progress bar

Componente único montado en el Shell. Reacciona a `useLocation()` y dispara una animación de 800ms al cambiar el `pathname`. Dos barras superpuestas que comparten `var(--accent)`:

- **Trail** (30% opacidad, 450ms) — rastro tenue que cruza casi completo
- **Head** (100% opacidad, 650ms) — cabeza brillante que persigue al rastro

```
<NavLink to="/a/users"> click
        │
        ▼
useLocation().pathname cambia
        │
        ▼
<RouteProgressBar /> useEffect detecta el cambio
        │
        ├──► trail: 0% → 100% en 450ms  (cubic-bezier rápido)
        └──► head:  0% → 100% en 650ms  (cubic-bezier persigue)
                        │
                        └──► fade-out 150ms → reset
```

---

## Comunicación con el backend

El frontend habla con el backend Fastify a través de un cliente HTTP minimalista
(`lib/apiClient.js`) y un set de hooks de TanStack Query (`hooks/api/*`).

```
Componente
   │
   └─► useUsers() / useCampaigns() / …      (hooks/api)
              │
              └─► api.get/post/patch/delete  (lib/apiClient.js)
                       │
                       ├─ adjuntar JWT (Bearer)
                       ├─ parsear JSON / lanzar ApiError
                       └─► VITE_API_URL + /api/...   (Fastify)
```

### Hooks de API disponibles

```js
// hooks/api/useUsers.js     → useUsers, useUser, useCreateUser, useUpdateUser, useDeleteUser
// hooks/api/useGroups.js    → useGroups, useCreateGroup, useUpdateGroup, useDeleteGroup
// hooks/api/useContacts.js  → useContacts, useCreateContact, useDeleteContact
// hooks/api/useTemplates.js → useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate
// hooks/api/useCampaigns.js → useCampaigns, useCampaign, useCreateCampaign, useDeleteCampaign, useCampaignAction
// hooks/api/useActivity.js  → useActivity
// hooks/api/useSessions.js  → useSessions, useAssignSession, useSessionExclusive, useRestartSession, useDeleteSession
```

### Tiempo real (Socket.IO)

`useRealtimeUpdates()` se monta en el subárbol autenticado y escucha eventos
`session:*` y `campaign:*` del backend para invalidar las queries y refrescar
la UI en vivo.

### Auth

`lib/auth.jsx` mantiene al `user` en contexto y persiste el JWT en
`localStorage`. Al recargar la página, `/auth/me` valida el token contra el
backend; si caducó (`401`), el cliente HTTP dispara `auth:expired` y el
contexto limpia la sesión.

---

## Cómo arrancar

```bash
cd frontend
npm install
npm run dev          # arranca Vite en http://localhost:5173
npm run build        # build de producción → frontend/dist/
npm run preview      # sirve el build localmente
npm run lint         # ESLint
```

### Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores. **`.env.local` está git-ignored** — guarda allí tus claves reales.

```bash
# frontend/.env.local

# Backend (cuando se conecte)
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001

# Firebase (Hosting + Analytics)
# Sácalos de Firebase Console → Project Settings → Web app SDK.
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=    # opcional, solo si activaste Analytics
```

Las claves Firebase Web son **públicas por diseño** — viajan en el JS que se entrega al navegador. La protección viene de los "Authorized domains" y las reglas de seguridad, no del secreto de la clave.

---

## Despliegue — Firebase Hosting

El frontend está configurado para desplegarse a Firebase Hosting desde la raíz del repo.

### Setup inicial (una sola vez)

```bash
# Instala el CLI globalmente
npm install -g firebase-tools

# Autentica (abre el navegador)
firebase login
```

### Desplegar

```bash
cd frontend
npm run deploy
```

El script:
1. Corre `vite build` → genera `frontend/dist/`
2. Llama a `firebase deploy --only hosting` desde la raíz del repo, donde vive `firebase.json`
3. Sube `dist/` a Firebase Hosting

El sitio aterriza en `https://trigra-chatbot-wsp.web.app` (y en un dominio propio cuando configures uno).

### Canal de preview

Para una URL temporal (útil para compartir avances sin tocar producción):

```bash
npm run deploy:preview
# Devuelve una URL única tipo https://trigra-chatbot-wsp--preview-xyz.web.app
```

### Arquitectura

```
┌──────────────────────────────────────────────┐
│           Firebase Hosting                   │
│  (frontend build estático: frontend/dist/)   │
│  + Firebase Analytics (solo en producción)   │
└──────────────────────┬───────────────────────┘
                       │ HTTPS  →  fetch / WebSocket
                       ▼
┌──────────────────────────────────────────────┐
│              VPS (Ubuntu LTS)                │
│  Nginx → Node (Fastify) → Postgres + Redis   │
│         (con Baileys + BullMQ)               │
└──────────────────────────────────────────────┘
```

El frontend es 100% estático y agnóstico al backend; cualquier API que respete el shape de `lib/data.js` lo enchufa.

### Firebase Analytics

Analytics se inicializa **solo en producción** (`MODE === "production"`) y **solo si el navegador lo soporta** (algunos bloqueadores de privacidad deshabilitan gtag). Los page_view se disparan en cada cambio de ruta vía el hook `useAnalytics()`. Para tracking de eventos custom, importa `trackEvent` desde `lib/firebase.js`:

```js
import { trackEvent } from "./lib/firebase.js";
trackEvent("campaign_launched", { id: campaign.id });
```
