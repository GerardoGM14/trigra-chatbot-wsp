# Frontend — WSP Control

> 🇬🇧 **English** · [🇪🇸 Español](README.es.md)

Web panel for managing bulk WhatsApp campaigns via Baileys: sessions, contacts, templates, scheduling, reports and audit log. Two roles (Administrator and Operator) live on the same Shell.

> This README covers **only the frontend**. The backend will be documented in its own folder when it lands.

---

## Stack

| Layer | Tech | Why |
|---|---|---|
| Build / dev server | **Vite** | Instant boot, frictionless HMR, small production build |
| UI | **React 19** | Function components + hooks, no classes, no TypeScript in this phase |
| Styles | **Tailwind CSS v3** + CSS variables | Utilities + semantic tokens (`--bg`, `--accent`, ...) that swap with the theme |
| Routing | **react-router v7** | Nested routes + per-role guards + query params for sub-views |
| Data | Mock in `lib/data.js` | While there's no backend; same shape as the future API |
| Animations | CSS keyframes in `index.css` | No library, `anim-*` classes applied via className |
| Lint | ESLint 9 (flat config) | `react-hooks/*` enabled, including `react-hooks/purity` |

### Minimal dependencies

```jsonc
// frontend/package.json (excerpt)
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

## Structure

```
frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx                  ← router + root providers
│   ├── main.jsx                 ← React bootstrap
│   ├── index.css                ← CSS tokens + keyframes + reset
│   │
│   ├── components/
│   │   ├── Icons.jsx            ← `I.*` SVG icon map
│   │   ├── Logo.jsx
│   │   ├── ThemePicker.jsx      ← floating theme switcher
│   │   ├── ui/                  ← 14 primitives (Button, Input, …)
│   │   ├── overlays/            ← Overlay + ModalShell + Menu
│   │   └── shell/               ← Shell + Sidebar + Topbar + RouteProgressBar
│   │
│   ├── modals/                  ← 23 modals (1 per file)
│   ├── screens/
│   │   ├── auth/LoginScreen.jsx
│   │   ├── admin/               ← Overview, Users, Activity, Settings
│   │   ├── user/                ← Sessions, Campaigns, Compose, …
│   │   │   └── compose/         ← sub-components of the compose flow
│   │   └── shared/FakeQR.jsx    ← shared mock QR
│   │
│   ├── hooks/
│   │   └── useTheme.js          ← persists the active theme in localStorage
│   └── lib/
│       ├── auth.jsx             ← AuthContext + useAuth
│       ├── toast.jsx            ← ToastProvider + useToast
│       ├── themes.js            ← 5 palettes (arena, niebla, carbón, papel, lino)
│       ├── data.js              ← mock users / campaigns / etc.
│       └── ids.js               ← short generators (newCampaignId, …)
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

### Naming convention

- `PascalCase.jsx` → files that export a primary component
- `camelCase.js` → utilities, data, hooks
- `camelCase.jsx` → auxiliary files with JSX that aren't a primary component
- `kebab-case` for folders

---

## Architecture — high-level diagram

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
                       │             │               │    bell, profile)│  │ + anim   │
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

### Routing flow (react-router)

```
/                       → redirects to /login or /a|/u based on AuthContext
/login                  → LoginScreen (no Shell)
/a                      → Shell + AdminOverview     (guard: role=admin)
/a/users                → Shell + AdminUsers
/a/activity             → Shell + AdminActivity
/a/settings             → Shell + AdminSettings
/u                      → Shell + UserSessions      (guard: role=user)
/u/campaigns            → Shell + CampaignsRoute    (list or compose based on ?compose=1)
/u/campaigns?compose=1  → Shell + UserCompose
/u/contacts             → Shell + UserContacts
/u/templates            → Shell + UserTemplates
/u/schedule             → Shell + UserSchedule
/u/reports              → Shell + UserReports
```

`RequireRole` wraps each branch: no session → `/login`; wrong role → the right role's home.

---

## Theme system

5 palettes defined in `lib/themes.js`, each mapping the same set of CSS variables onto `:root`:

```
arena    warm cream         terracotta accent  #C24A22
niebla   cold gray          deep blue accent   #1F3F8F
carbón   dark mode          amber accent       #E2853A
papel    pure white         ink accent         #0A0A09
lino     light beige        wine purple accent #6B2B7A
```

Tailwind consumes these variables via semantic colors:

```js
// tailwind.config.js
colors: {
  bg: "var(--bg)",
  accent: "var(--accent)",
  // ...
}
```

Result: switching the active theme (via `<ThemePicker>`) rewrites the CSS vars on `:root` and **the whole app re-skins without re-rendering components**. The active theme persists in `localStorage`.

```
ThemePicker  ──► setTheme()  ──►  useTheme() hook
                                       │
                                       ├──► localStorage.setItem(...)
                                       └──► applyTheme() ─► document.documentElement.style.setProperty(...)
                                                                       │
                                                                       └──► CSS vars updated → components re-skin
```

---

## Components and dependencies

### Layers

```
┌─────────────────────────────────────────────────┐
│  screens/* (admin, user, auth, shared)          │  ← screen logic
└─────────────────────────────────────────────────┘
           │
           ├──► modals/*               ← 23 reusable modals
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
│  hooks/useTheme       lib/auth · toast          │  ← contexts + global state
│  lib/themes · data · ids                        │  ← data + utilities
└─────────────────────────────────────────────────┘
```

Dependencies **always** point downward: a primitive never imports a screen.

### Summary

| Layer | Files | Max lines | Purpose |
|---|---|---|---|
| Root | `App.jsx`, `main.jsx` | <100 | Router + providers |
| Shell | `components/shell/*` | <200 | Layout + navigation + progress bar |
| UI primitives | `components/ui/*` | <80 each | Button, Input, Table, Avatar, … |
| Overlays | `components/overlays/*` | <130 | Modal portal + dropdown |
| Modals | `modals/*` (23) | <300 each | Each concrete action |
| Screens | `screens/*` (12) | <320 each | View per route |
| Global state | `lib/auth.jsx`, `lib/toast.jsx` | <110 | Context + hook |
| Data | `lib/data.js`, `lib/ids.js`, `lib/themes.js` | <90 | Constants |

---

## Applied patterns

### Modals via portal

Every modal renders in `document.body` via `createPortal`. The centered backdrop (X and Y) covers **the whole** viewport — sidebar and topbar included — regardless of which subtree of the tree opens the modal.

```
[ Any screen ]
        │
        └──► <NewGroupModal onClose=... onCreate=...>
                    │
                    └──► <ModalShell ...>          ←── title + body + footer
                                │
                                └──► <Overlay>     ←── portal to document.body
                                          │
                                          ▼
                            document.body
                            └─ <div fixed inset-0 dim-bg>
                               └─ <div modal content>
```

### Global toasts

`<ToastProvider>` wraps the app and exposes `useToast()` to any component. Notifications render in another portal to `document.body`, bottom-center, with auto-dismiss at 3.2s.

```
useToast().toast.ok("Saved") ──► ToastContext.push ──► ToastViewport (portal)
                                                                  │
                                                                  └─ render <ToastItem> auto-dismiss
```

### Mock auth

`<AuthProvider>` keeps `{ user: { role, name, label } }` in memory. When the backend lands, only `login()` changes: today it does `setUser({...})` with hardcoded data, tomorrow it'll `fetch("/auth/login")` and store the JWT.

```
LoginScreen.onLogin(role) ──► auth.login(role) ──► setUser({...}) ──► navigate("/a"|"/u")
                                                       │
                                                       ▼
                                            RequireRole resolves the guard
```

### Route progress bar

Single component mounted in the Shell. It reacts to `useLocation()` and fires an 800ms animation on `pathname` change. Two stacked bars sharing `var(--accent)`:

- **Trail** (30% opacity, 450ms) — faint trail crossing almost full width
- **Head** (100% opacity, 650ms) — bright head chasing the trail

```
<NavLink to="/a/users"> click
        │
        ▼
useLocation().pathname changes
        │
        ▼
<RouteProgressBar /> useEffect catches the change
        │
        ├──► trail: 0% → 100% in 450ms  (fast cubic-bezier)
        └──► head:  0% → 100% in 650ms  (chasing cubic-bezier)
                        │
                        └──► fade-out 150ms → reset
```

---

## Mock data

`lib/data.js` exports the constants that feed the screens: `USERS`, `ACTIVITY`, `CAMPAIGNS`, `GROUPS`, `TEMPLATES`, `CONTACTS_PREVIEW`, `HOURLY`, `ALL_OPERATORS`.

When the backend exists, **the object shape doesn't change** — the constants will simply be replaced by hooks like `useCampaigns()` that call the API.

---

## Running locally

```bash
cd frontend
npm install
npm run dev          # Vite at http://localhost:5173
npm run build        # production build → frontend/dist/
npm run preview      # serve the build locally
npm run lint         # ESLint
```

### Environment variables (once the backend lands)

```bash
# frontend/.env.local
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
```

---

## Planned deployment

```
┌──────────────────────────────────────────────┐
│           Firebase Hosting                   │
│  (frontend static build: frontend/dist/)     │
└──────────────────────┬───────────────────────┘
                       │ HTTPS  →  fetch / WebSocket
                       ▼
┌──────────────────────────────────────────────┐
│              VPS (Ubuntu LTS)                │
│  Nginx → Node (Fastify) → Postgres + Redis   │
│         (with Baileys + BullMQ)              │
└──────────────────────────────────────────────┘
```

The frontend is 100% static and backend-agnostic; any API matching the shape of `lib/data.js` plugs right in.
