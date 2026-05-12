import { I } from "../Icons.jsx";

// Nav links per role + breadcrumb labels per route. Keeping these in a plain
// data file (not JSX) lets the Sidebar and Topbar stay slim.

export const ADMIN_NAV = [
  { to: "/a", end: true, l: "Resumen", i: <I.dash size={14} /> },
  { to: "/a/users", l: "Usuarios", i: <I.users size={14} /> },
  { to: "/a/activity", l: "Actividad", i: <I.activity size={14} /> },
  { to: "/a/settings", l: "Configuración", i: <I.settings size={14} /> },
];

export const USER_NAV = [
  { to: "/u", end: true, l: "Mis sesiones", i: <I.link size={14} /> },
  { to: "/u/campaigns", l: "Campañas", i: <I.send size={14} /> },
  { to: "/u/contacts", l: "Contactos", i: <I.contact size={14} /> },
  { to: "/u/templates", l: "Plantillas", i: <I.tpl size={14} /> },
  { to: "/u/schedule", l: "Calendario", i: <I.cal size={14} /> },
  { to: "/u/reports", l: "Reportes", i: <I.report size={14} /> },
];

export const ROUTE_LABELS = {
  "/a": "Resumen",
  "/a/users": "Usuarios",
  "/a/activity": "Actividad",
  "/a/settings": "Configuración",
  "/u": "Mis sesiones",
  "/u/campaigns": "Campañas",
  "/u/contacts": "Contactos",
  "/u/templates": "Plantillas",
  "/u/schedule": "Calendario",
  "/u/reports": "Reportes",
};
