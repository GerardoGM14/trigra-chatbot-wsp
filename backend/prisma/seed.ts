// Seed con los mismos datos que el frontend tiene en `frontend/src/lib/data.js`.
// Cuando el frontend conecte al backend, las pantallas se verán idénticas a
// como están ahora con mocks — sirve como verificación visual de integración.
//
// Idempotente: usa `upsert` por slug/username/email así puedes correrlo varias
// veces sin duplicar. Password por defecto para todos los usuarios mock: "demo1234".

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("→ seeding database");

  const passwordHash = await bcrypt.hash("demo1234", 10);

  // ============ USERS ============
  const users = [
    { username: "admin",     name: "Sergio Admin",    email: "admin@empresa.pe",    role: "Administrador" as const, status: "Activo" as const },
    { username: "maria.q",   name: "María Quispe",    email: "maria.q@empresa.pe",  role: "Operador" as const,      status: "Activo" as const },
    { username: "c.mendoza", name: "Carlos Mendoza",  email: "c.mendoza@empresa.pe", role: "Operador" as const,      status: "Activo" as const },
    { username: "lucia.r",   name: "Lucía Ramírez",   email: "lucia.r@empresa.pe",  role: "Supervisor" as const,    status: "Activo" as const },
    { username: "a.flores",  name: "Andrés Flores",   email: "a.flores@empresa.pe", role: "Operador" as const,      status: "Suspendido" as const },
    { username: "r.salas",   name: "Renato Salas",    email: "r.salas@empresa.pe",  role: "Operador" as const,      status: "Activo" as const },
    { username: "d.pacheco", name: "Diana Pacheco",   email: "d.pacheco@empresa.pe", role: "Operador" as const,     status: "Invitado" as const },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { name: u.name, email: u.email, role: u.role, status: u.status },
      create: { ...u, passwordHash },
    });
  }
  console.log(`  · ${users.length} users`);

  // ============ BAILEYS SESSIONS ============
  const sessions = [
    { slug: "session_01", phoneNumber: "+51999412220", status: "Conectado" as const, quality: "Alta", platform: "Android" },
    { slug: "session_02", phoneNumber: "+51998220118", status: "Conectado" as const, quality: "Alta", platform: "Android" },
    { slug: "session_03", phoneNumber: "+51944901412", status: "Reconectando" as const, quality: "—", platform: "iOS" },
  ];

  for (const s of sessions) {
    await prisma.baileysSession.upsert({
      where: { slug: s.slug },
      update: { status: s.status, quality: s.quality, platform: s.platform },
      create: { ...s, connectedAt: new Date() },
    });
  }
  console.log(`  · ${sessions.length} sessions`);

  // Asignaciones operador↔sesión (igual que en AdminSettings mock).
  const assignments: Array<[string, string]> = [
    ["session_01", "maria.q"],
    ["session_01", "r.salas"],
    ["session_02", "c.mendoza"],
    ["session_03", "lucia.r"],
    ["session_03", "a.flores"],
  ];
  for (const [sessionSlug, username] of assignments) {
    const session = await prisma.baileysSession.findUnique({ where: { slug: sessionSlug } });
    const user = await prisma.user.findUnique({ where: { username } });
    if (!session || !user) continue;
    await prisma.sessionAssignment.upsert({
      where: { sessionId_userId: { sessionId: session.id, userId: user.id } },
      update: {},
      create: { sessionId: session.id, userId: user.id },
    });
  }
  console.log(`  · ${assignments.length} session assignments`);

  // ============ GROUPS ============
  const groups = [
    { slug: "grp_clientes_a", name: "Clientes A — Lima",   tag: "Clientes" },
    { slug: "grp_vip",        name: "Clientes VIP",         tag: "VIP" },
    { slug: "grp_leads_mayo", name: "Leads Mayo 2026",      tag: "Leads" },
    { slug: "grp_inactivos",  name: "Inactivos 90+ días",   tag: "Reactivación" },
    { slug: "grp_norte",      name: "Provincias Norte",     tag: "Geográfico" },
    { slug: "grp_sur",        name: "Provincias Sur",       tag: "Geográfico" },
    { slug: "grp_test",       name: "Pruebas internas",     tag: "Test" },
  ];
  for (const g of groups) {
    await prisma.contactGroup.upsert({
      where: { slug: g.slug },
      update: { name: g.name, tag: g.tag },
      create: g,
    });
  }
  console.log(`  · ${groups.length} groups`);

  // Contactos preview para el grupo "Clientes A".
  const clientesA = await prisma.contactGroup.findUnique({ where: { slug: "grp_clientes_a" } });
  if (clientesA) {
    const contacts = [
      { phone: "+51998412003", name: "Juan Pérez",      tags: ["VIP", "Lima"] },
      { phone: "+51987220118", name: "Ana Torres",      tags: ["Lima"] },
      { phone: "+51944002991", name: "Pedro Salinas",   tags: ["Lima", "B2B"] },
      { phone: "+51921887442", name: "Rocío Mendieta",  tags: ["Lima"] },
      { phone: "+51933109220", name: "Luis Mamani",     tags: ["Lima"] },
      { phone: "+51901552010", name: "Cecilia Vargas",  tags: ["Lima", "VIP"] },
    ];
    for (const c of contacts) {
      await prisma.contact.upsert({
        where: { groupId_phone: { groupId: clientesA.id, phone: c.phone } },
        update: { name: c.name, tags: c.tags },
        create: { ...c, groupId: clientesA.id },
      });
    }
    console.log(`  · ${contacts.length} contacts in grp_clientes_a`);
  }

  // ============ TEMPLATES ============
  const templates = [
    { slug: "tpl_horarios",   name: "Lista horarios atención", type: "Lista" as const,   body: "Hola {{nombre}}, ¿en qué podemos ayudarte?", usedCount: 412 },
    { slug: "tpl_bienvenida", name: "Bienvenida + Catálogo",   type: "Media" as const,   body: "¡Bienvenido a Empresa S.A.C., {{nombre}}!", usedCount: 127 },
    { slug: "tpl_nps",        name: "Encuesta NPS",            type: "Botones" as const, body: "¿Recomendarías nuestro servicio?", usedCount: 892 },
    { slug: "tpl_pago",       name: "Recordatorio de pago",    type: "Texto" as const,   body: "{{nombre}}, tu pago de {{monto}} vence el {{fecha}}.", usedCount: 1408 },
  ];
  for (const t of templates) {
    await prisma.template.upsert({
      where: { slug: t.slug },
      update: { name: t.name, type: t.type, body: t.body, usedCount: t.usedCount },
      create: t,
    });
  }
  console.log(`  · ${templates.length} templates`);

  // ============ CAMPAIGNS ============
  const lucia = await prisma.user.findUnique({ where: { username: "lucia.r" } });
  const maria = await prisma.user.findUnique({ where: { username: "maria.q" } });
  const carlos = await prisma.user.findUnique({ where: { username: "c.mendoza" } });
  const renato = await prisma.user.findUnique({ where: { username: "r.salas" } });

  const campaigns = [
    { slug: "camp_8821", name: "Promo Mayo — Clientes A",  status: "Enviando" as const,   type: "Lista" as const,     total: 3420, sent: 2120, failed: 14, progress: 62,  ownerId: lucia?.id },
    { slug: "camp_8820", name: "Recordatorio cita médica", status: "Completada" as const, type: "Imagen" as const,    total: 812,  sent: 801,  failed: 11, progress: 100, ownerId: renato?.id },
    { slug: "camp_8819", name: "Encuesta NPS Abril",       status: "Programada" as const, type: "Lista" as const,     total: 5210, sent: 0,    failed: 0,  progress: 0,   ownerId: lucia?.id },
    { slug: "camp_8818", name: "Catálogo Q2 — PDF",        status: "Programada" as const, type: "Documento" as const, total: 1204, sent: 0,    failed: 0,  progress: 0,   ownerId: maria?.id },
    { slug: "camp_8817", name: "Reactivación inactivos",   status: "Borrador" as const,   type: "Texto" as const,     total: 0,    sent: 0,    failed: 0,  progress: 0,   ownerId: carlos?.id },
    { slug: "camp_8816", name: "Bienvenida nuevos leads",  status: "Pausada" as const,    type: "Video" as const,     total: 2100, sent: 798,  failed: 6,  progress: 38,  ownerId: renato?.id },
    { slug: "camp_8815", name: "Confirmación entrega",     status: "Completada" as const, type: "Texto" as const,     total: 430,  sent: 429,  failed: 1,  progress: 100, ownerId: maria?.id },
  ];

  for (const c of campaigns) {
    if (!c.ownerId) continue;
    await prisma.campaign.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name, status: c.status, type: c.type,
        total: c.total, sent: c.sent, failed: c.failed, progress: c.progress,
      },
      create: { ...c, ownerId: c.ownerId, body: "Cuerpo de mensaje del mock" },
    });
  }
  console.log(`  · ${campaigns.length} campaigns`);

  // ============ ACTIVITY LOG ============
  const today = new Date();
  const log = [
    { offsetMin: 0,   userSlug: "lucia.r",   action: "campaign.send",     target: "camp_8821",       detail: "3.420 destinatarios · plantilla 'Promo Mayo'", level: "ok" as const },
    { offsetMin: 2,   userSlug: "maria.q",   action: "contact.import",    target: "grp_clientes_a",  detail: "1.204 números importados (CSV)",               level: "ok" as const },
    { offsetMin: 11,  userSlug: "c.mendoza", action: "campaign.draft",    target: "camp_8822",       detail: "Borrador creado · 0 destinatarios",            level: "info" as const },
    { offsetMin: 14,  userSlug: null,        action: "baileys.reconnect", target: "session_03",      detail: "Reconexión automática · 2.4s",                 level: "warn" as const },
    { offsetMin: 22,  userSlug: "maria.q",   action: "template.update",   target: "tpl_horarios",    detail: "Lista cliceable · 5 opciones",                 level: "ok" as const },
    { offsetMin: 34,  userSlug: "r.salas",   action: "campaign.send",     target: "camp_8820",       detail: "812 destinatarios · medios + texto",           level: "ok" as const },
    { offsetMin: 47,  userSlug: "admin",     action: "user.create",       target: "d.pacheco",       detail: "Diana Pacheco · rol Operador",                 level: "info" as const },
    { offsetMin: 61,  userSlug: "lucia.r",   action: "group.create",      target: "grp_vip",         detail: "Grupo 'Clientes VIP' · 318 contactos",         level: "ok" as const },
    { offsetMin: 80,  userSlug: "a.flores",  action: "auth.failed",       target: null,              detail: "Contraseña incorrecta · 3er intento",          level: "err" as const },
    { offsetMin: 94,  userSlug: null,        action: "baileys.qr",        target: "session_01",      detail: "Sesión vinculada — +51 999 ··· 412",           level: "info" as const },
  ];

  // Borramos los logs anteriores y recreamos (idempotente sin upsert porque no
  // hay clave natural para distinguirlos).
  await prisma.activityLog.deleteMany({});
  for (const entry of log) {
    const user = entry.userSlug
      ? await prisma.user.findUnique({ where: { username: entry.userSlug } })
      : null;
    await prisma.activityLog.create({
      data: {
        action: entry.action,
        target: entry.target,
        detail: entry.detail,
        level: entry.level,
        userId: user?.id ?? null,
        createdAt: new Date(today.getTime() - entry.offsetMin * 60 * 1000),
      },
    });
  }
  console.log(`  · ${log.length} activity entries`);

  // ============ ACCOUNT POLICY (singleton) ============
  const existing = await prisma.accountPolicy.findFirst();
  if (!existing) {
    await prisma.accountPolicy.create({ data: {} });
    console.log("  · account policy initialized");
  }

  console.log("✓ seed complete");
}

main()
  .catch((e) => {
    console.error("✗ seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
