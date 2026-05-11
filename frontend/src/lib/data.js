// ============ MOCK DATA ============
// Static fixtures that stand in for the future backend. Screens import these
// directly; when the API lands, swap these for fetch calls behind the same shape.

export const USERS = [
  { id: "u_001", name: "María Quispe",   email: "maria.q@empresa.pe",   role: "Operador",   status: "Activo",     lastSeen: "hace 4 min",  campaigns: 18, sent: 12480, created: "2026-02-14" },
  { id: "u_002", name: "Carlos Mendoza", email: "c.mendoza@empresa.pe", role: "Operador",   status: "Activo",     lastSeen: "hace 1 h",    campaigns: 9,  sent: 6321,  created: "2026-03-02" },
  { id: "u_003", name: "Lucía Ramírez",  email: "lucia.r@empresa.pe",   role: "Supervisor", status: "Activo",     lastSeen: "hace 12 min", campaigns: 42, sent: 38119, created: "2025-11-20" },
  { id: "u_004", name: "Andrés Flores",  email: "a.flores@empresa.pe",  role: "Operador",   status: "Suspendido", lastSeen: "hace 6 días", campaigns: 3,  sent: 412,   created: "2026-01-08" },
  { id: "u_005", name: "Renato Salas",   email: "r.salas@empresa.pe",   role: "Operador",   status: "Activo",     lastSeen: "hace 30 min", campaigns: 14, sent: 9802,  created: "2026-03-15" },
  { id: "u_006", name: "Diana Pacheco",  email: "d.pacheco@empresa.pe", role: "Operador",   status: "Invitado",   lastSeen: "—",           campaigns: 0,  sent: 0,     created: "2026-05-09" },
];

export const ACTIVITY = [
  { t: "14:32:08", user: "lucia.r",   action: "campaign.send",     target: "camp_8821",       detail: "3.420 destinatarios · plantilla 'Promo Mayo'", level: "ok" },
  { t: "14:30:12", user: "maria.q",   action: "contact.import",    target: "grp_clientes_a",  detail: "1.204 números importados (CSV)",               level: "ok" },
  { t: "14:21:55", user: "c.mendoza", action: "campaign.draft",    target: "camp_8822",       detail: "Borrador creado · 0 destinatarios",            level: "info" },
  { t: "14:18:03", user: "system",    action: "baileys.reconnect", target: "session_03",      detail: "Reconexión automática · 2.4s",                 level: "warn" },
  { t: "14:09:41", user: "maria.q",   action: "template.update",   target: "tpl_lista_horarios", detail: "Lista cliceable · 5 opciones",              level: "ok" },
  { t: "13:58:17", user: "r.salas",   action: "campaign.send",     target: "camp_8820",       detail: "812 destinatarios · medios + texto",           level: "ok" },
  { t: "13:45:22", user: "admin",     action: "user.create",       target: "u_006",           detail: "Diana Pacheco · rol Operador",                 level: "info" },
  { t: "13:31:09", user: "lucia.r",   action: "group.create",      target: "grp_vip",         detail: "Grupo 'Clientes VIP' · 318 contactos",         level: "ok" },
  { t: "13:12:44", user: "a.flores",  action: "auth.failed",       target: "—",               detail: "Contraseña incorrecta · 3er intento",          level: "err" },
  { t: "12:58:31", user: "system",    action: "baileys.qr",        target: "session_01",      detail: "Sesión vinculada — +51 999 ··· 412",           level: "info" },
];

export const CAMPAIGNS = [
  { id: "camp_8821", name: "Promo Mayo — Clientes A",  status: "Enviando",   progress: 62,  total: 3420, sent: 2120, fail: 14, type: "Lista cliceable", scheduled: "Hoy 14:30",    owner: "lucia.r" },
  { id: "camp_8820", name: "Recordatorio cita médica", status: "Completada", progress: 100, total: 812,  sent: 801,  fail: 11, type: "Texto + Imagen",   scheduled: "Hoy 13:58",    owner: "r.salas" },
  { id: "camp_8819", name: "Encuesta NPS Abril",       status: "Programada", progress: 0,   total: 5210, sent: 0,    fail: 0,  type: "Lista cliceable", scheduled: "Mañana 09:00", owner: "lucia.r" },
  { id: "camp_8818", name: "Catálogo Q2 — PDF",        status: "Programada", progress: 0,   total: 1204, sent: 0,    fail: 0,  type: "Documento",        scheduled: "Sáb 10:00",    owner: "maria.q" },
  { id: "camp_8817", name: "Reactivación inactivos",   status: "Borrador",   progress: 0,   total: 0,    sent: 0,    fail: 0,  type: "—",                scheduled: "—",            owner: "c.mendoza" },
  { id: "camp_8816", name: "Bienvenida nuevos leads",  status: "Pausada",    progress: 38,  total: 2100, sent: 798,  fail: 6,  type: "Texto + Video",    scheduled: "Ayer 16:00",   owner: "r.salas" },
  { id: "camp_8815", name: "Confirmación entrega",     status: "Completada", progress: 100, total: 430,  sent: 429,  fail: 1,  type: "Texto",            scheduled: "Ayer 11:20",   owner: "maria.q" },
];

export const GROUPS = [
  { id: "grp_clientes_a", name: "Clientes A — Lima",   count: 1204, tag: "Clientes",     updated: "hoy 14:30" },
  { id: "grp_vip",        name: "Clientes VIP",         count: 318,  tag: "VIP",          updated: "hoy 13:31" },
  { id: "grp_leads_mayo", name: "Leads Mayo 2026",      count: 2843, tag: "Leads",        updated: "ayer" },
  { id: "grp_inactivos",  name: "Inactivos 90+ días",   count: 5210, tag: "Reactivación", updated: "hace 2 d" },
  { id: "grp_norte",      name: "Provincias Norte",     count: 927,  tag: "Geográfico",   updated: "hace 3 d" },
  { id: "grp_sur",        name: "Provincias Sur",       count: 1102, tag: "Geográfico",   updated: "hace 3 d" },
  { id: "grp_test",       name: "Pruebas internas",     count: 12,   tag: "Test",         updated: "hace 1 sem" },
];

export const TEMPLATES = [
  { id: "tpl_horarios",   name: "Lista horarios atención", type: "Lista cliceable",   items: 5, used: 412 },
  { id: "tpl_bienvenida", name: "Bienvenida + Catálogo",   type: "Texto + Documento", items: 2, used: 127 },
  { id: "tpl_nps",        name: "Encuesta NPS",            type: "Botones rápidos",   items: 3, used: 892 },
  { id: "tpl_pago",       name: "Recordatorio de pago",    type: "Texto",             items: 1, used: 1408 },
];

export const CONTACTS_PREVIEW = [
  { phone: "+51 998 412 003", name: "Juan Pérez",     group: "Clientes A — Lima", tags: ["VIP", "Lima"] },
  { phone: "+51 987 220 118", name: "Ana Torres",     group: "Clientes A — Lima", tags: ["Lima"] },
  { phone: "+51 944 002 991", name: "Pedro Salinas",  group: "Clientes A — Lima", tags: ["Lima", "B2B"] },
  { phone: "+51 921 887 442", name: "Rocío Mendieta", group: "Clientes A — Lima", tags: ["Lima"] },
  { phone: "+51 933 109 220", name: "Luis Mamani",    group: "Clientes A — Lima", tags: ["Lima"] },
  { phone: "+51 901 552 010", name: "Cecilia Vargas", group: "Clientes A — Lima", tags: ["Lima", "VIP"] },
];

// 24h activity sparkline values (relative)
export const HOURLY = [12, 8, 4, 2, 2, 3, 9, 28, 62, 84, 71, 55, 48, 52, 61, 73, 82, 91, 76, 58, 42, 30, 22, 16];

export const ALL_OPERATORS = [
  { u: "maria.q",   name: "María Quispe",   role: "Operador",   campaigns: 24 },
  { u: "r.salas",   name: "Renzo Salas",    role: "Operador",   campaigns: 18 },
  { u: "c.mendoza", name: "Carlos Mendoza", role: "Supervisor", campaigns: 42 },
  { u: "lucia.r",   name: "Lucía Ramírez",  role: "Operador",   campaigns: 11 },
  { u: "a.flores",  name: "Andrés Flores",  role: "Operador",   campaigns: 7 },
  { u: "j.bravo",   name: "Julia Bravo",    role: "Operador",   campaigns: 3 },
];
