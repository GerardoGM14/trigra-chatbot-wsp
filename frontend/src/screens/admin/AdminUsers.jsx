import { useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Table } from "../../components/ui/Table.jsx";
import { Avatar } from "../../components/ui/Avatar.jsx";
import { Menu } from "../../components/overlays/Menu.jsx";
import { I } from "../../components/Icons.jsx";
import { useToast } from "../../lib/toast.jsx";
import { USERS } from "../../lib/data.js";
import {
  CreateUserModal,
  EditUserModal,
  UserActivityModal,
  AssignUserSessionsModal,
  FiltersModal,
  ConfirmModal,
} from "../../modals";

const PAGE_SIZE = 5;
const FILTER_FIELDS = [
  {
    key: "status",
    label: "Estado",
    type: "select",
    options: [
      { value: "Activo", label: "Activo" },
      { value: "Suspendido", label: "Suspendido" },
      { value: "Invitado", label: "Invitado" },
    ],
  },
  {
    key: "sort",
    label: "Orden",
    type: "select",
    options: [{ value: "sent", label: "Más mensajes enviados primero" }],
  },
];

export function AdminUsers() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("Todos");
  const [users, setUsers] = useState(USERS);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);

  // Modal selectors. Keeping each in its own state lets multiple coexist (e.g.
  // confirm-on-top-of-edit, even though we don't use that today).
  const [showCreate, setShowCreate] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewingActivity, setViewingActivity] = useState(null);
  const [assigningSessions, setAssigningSessions] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const filtered = users
    .filter((u) => role === "Todos" || u.role === role)
    .filter((u) => !filters.status || u.status === filters.status)
    .filter((u) => u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (filters.sort === "sent" ? b.sent - a.sent : 0));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const exportCsv = () => {
    const header = ["id", "nombre", "correo", "rol", "estado", "campañas", "mensajes"];
    const rows = filtered.map((u) => [u.id, u.name, u.email, u.role, u.status, u.campaigns, u.sent]);
    downloadCsv([header, ...rows], `usuarios_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.ok(`Exportados ${filtered.length} usuarios a CSV.`);
  };

  const saveEdit = (next) => {
    setUsers((list) => list.map((x) => (x.id === next.id ? next : x)));
    toast.ok(`Cambios guardados en ${next.name}.`);
  };
  const toggleSuspend = (u) => {
    setUsers((list) =>
      list.map((x) => (x.id === u.id ? { ...x, status: x.status === "Suspendido" ? "Activo" : "Suspendido" } : x)),
    );
    toast.ok(`${u.name} ${u.status === "Suspendido" ? "reactivado" : "suspendido"}.`);
  };
  const removeUser = (u) => {
    setUsers((list) => list.filter((x) => x.id !== u.id));
    toast.warn(`Usuario ${u.name} eliminado.`);
  };

  return (
    <div className="grid gap-4">
      <Header onCreate={() => setShowCreate(true)} />

      <Toolbar
        q={q}
        setQ={setQ}
        role={role}
        setRole={setRole}
        activeFilterCount={activeFilterCount}
        onFilters={() => setFiltersOpen(true)}
        onExport={exportCsv}
      />

      <Table
        columns={buildColumns({
          onEdit: setEditing,
          onResetPassword: (u) => toast.ok(`Nueva contraseña temporal enviada a ${u.email}.`),
          onAssignSessions: setAssigningSessions,
          onViewActivity: setViewingActivity,
          onSuspend: (u) => setConfirm({ kind: "suspend", user: u }),
          onDelete: (u) => setConfirm({ kind: "delete", user: u }),
        })}
        rows={pageRows}
      />

      <Pagination
        page={safePage}
        totalPages={totalPages}
        visible={pageRows.length}
        filteredTotal={filtered.length}
        total={users.length}
        onPage={setPage}
      />

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
      {editing && <EditUserModal user={editing} onClose={() => setEditing(null)} onSave={saveEdit} />}
      {viewingActivity && (
        <UserActivityModal user={viewingActivity} onClose={() => setViewingActivity(null)} />
      )}
      {assigningSessions && (
        <AssignUserSessionsModal
          user={assigningSessions}
          onClose={() => setAssigningSessions(null)}
          onSave={(ids) => toast.ok(`Asignadas ${ids.length} sesiones a ${assigningSessions.name}.`)}
        />
      )}
      {filtersOpen && (
        <FiltersModal
          initial={filters}
          onClose={() => setFiltersOpen(false)}
          onApply={setFilters}
          fields={FILTER_FIELDS}
        />
      )}
      {confirm && (
        <ConfirmModal
          title={confirmTitle(confirm)}
          message={confirmMessage(confirm)}
          confirmLabel={confirmLabel(confirm)}
          tone={confirm.kind === "delete" ? "danger" : "primary"}
          onClose={() => setConfirm(null)}
          onConfirm={() => (confirm.kind === "delete" ? removeUser(confirm.user) : toggleSuspend(confirm.user))}
        />
      )}
    </div>
  );
}

function Header({ onCreate }) {
  return (
    <div className="flex justify-between items-end gap-5">
      <div>
        <h2 className="m-0 text-[22px] font-semibold" style={{ letterSpacing: "-0.02em" }}>Usuarios</h2>
        <p className="mt-1 mb-0 text-muted text-[13px]">
          Crea cuentas, asigna roles y supervisa la actividad de cada operador.
        </p>
      </div>
      <Button variant="accent" icon={<I.plus size={14} />} onClick={onCreate}>Nuevo usuario</Button>
    </div>
  );
}

function Toolbar({ q, setQ, role, setRole, activeFilterCount, onFilters, onExport }) {
  return (
    <div className="flex gap-2.5 items-center">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nombre o correo…"
        icon={<I.search size={14} />}
        style={{ flex: 1, maxWidth: 380 }}
      />
      <div className="flex bg-surface" style={{ border: "1px solid var(--border-strong)" }}>
        {["Todos", "Supervisor", "Operador"].map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className="text-xs font-medium cursor-pointer"
            style={{
              padding: "7px 14px",
              border: "none",
              borderLeft: r !== "Todos" ? "1px solid var(--border)" : "none",
              background: role === r ? "var(--ink)" : "transparent",
              color: role === r ? "#fff" : "var(--ink)",
            }}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="flex-1" />
      <Button variant="ghost" size="md" icon={<I.filter size={14} />} onClick={onFilters}>
        Filtros{activeFilterCount > 0 && ` (${activeFilterCount})`}
      </Button>
      <Button variant="ghost" size="md" icon={<I.download size={14} />} onClick={onExport}>
        Exportar CSV
      </Button>
    </div>
  );
}

function Pagination({ page, totalPages, visible, filteredTotal, total, onPage }) {
  return (
    <div className="flex justify-between text-xs text-muted">
      <span>
        Mostrando {visible} de {filteredTotal} usuarios
        {total !== filteredTotal && ` (filtrados de ${total})`}
      </span>
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          ‹ Anterior
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <Button
            key={p}
            size="sm"
            variant={p === page ? "default" : "ghost"}
            active={p === page}
            onClick={() => onPage(p)}
          >
            {p}
          </Button>
        ))}
        <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Siguiente ›
        </Button>
      </div>
    </div>
  );
}

function buildColumns({ onEdit, onResetPassword, onAssignSessions, onViewActivity, onSuspend, onDelete }) {
  return [
    {
      label: "Usuario",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={r.name} />
          <div>
            <div className="text-[13px] font-medium">{r.name}</div>
            <div className="mono text-[11px] text-muted">{r.email}</div>
          </div>
        </div>
      ),
    },
    { label: "Rol", render: (r) => <Badge tone={r.role === "Supervisor" ? "accent" : "neutral"}>{r.role}</Badge> },
    {
      label: "Estado",
      render: (r) => (
        <Badge tone={r.status === "Activo" ? "info" : r.status === "Suspendido" ? "danger" : "warn"}>
          <span style={{ width: 6, height: 6, background: "currentColor", display: "inline-block" }} />
          {r.status}
        </Badge>
      ),
    },
    { label: "Campañas", align: "right", render: (r) => <span className="mono">{r.campaigns}</span> },
    { label: "Mensajes enviados", align: "right", render: (r) => <span className="mono">{r.sent.toLocaleString("es-PE")}</span> },
    { label: "Última actividad", render: (r) => <span className="text-xs text-muted">{r.lastSeen}</span> },
    {
      label: "",
      align: "right",
      render: (r) => (
        <Menu
          items={[
            { label: "Editar usuario", icon: <I.edit size={12} />, onClick: () => onEdit(r) },
            { label: "Restablecer contraseña", icon: <I.refresh size={12} />, onClick: () => onResetPassword(r) },
            { label: "Asignar sesiones", icon: <I.link size={12} />, onClick: () => onAssignSessions(r) },
            { label: "Ver actividad", icon: <I.report size={12} />, onClick: () => onViewActivity(r) },
            { divider: true },
            {
              label: r.status === "Suspendido" ? "Reactivar" : "Suspender",
              icon: <I.x size={12} />,
              onClick: () => onSuspend(r),
            },
            { label: "Eliminar usuario", icon: <I.trash size={12} />, onClick: () => onDelete(r), danger: true },
          ]}
        />
      ),
    },
  ];
}

function confirmTitle(c) {
  if (c.kind === "delete") return "Eliminar usuario";
  return c.user.status === "Suspendido" ? "Reactivar usuario" : "Suspender usuario";
}
function confirmMessage(c) {
  if (c.kind === "delete") return `Vas a eliminar a ${c.user.name}. Esta acción no se puede deshacer.`;
  return c.user.status === "Suspendido"
    ? `${c.user.name} podrá iniciar sesión y enviar campañas de nuevo.`
    : `${c.user.name} no podrá iniciar sesión hasta que lo reactives.`;
}
function confirmLabel(c) {
  if (c.kind === "delete") return "Eliminar";
  return c.user.status === "Suspendido" ? "Reactivar" : "Suspender";
}

function downloadCsv(rows, filename) {
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
