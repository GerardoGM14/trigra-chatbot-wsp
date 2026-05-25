import { useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Table } from "../../components/ui/Table.jsx";
import { Avatar } from "../../components/ui/Avatar.jsx";
import { Menu } from "../../components/overlays/Menu.jsx";
import { I } from "../../components/Icons.jsx";
import { useUsers, useUpdateUser, useDeleteUser } from "../../hooks/api/useUsers.js";
import { useMutationError } from "../../hooks/useMutationFeedback.js";
import { useToast } from "../../lib/toast.jsx";
import { timeAgo } from "../../lib/format.js";
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
];

export function AdminUsers() {
  const { toast } = useToast();
  const onMutationError = useMutationError("Ocurrió un error.");

  const usersQuery = useUsers();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("Todos");
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewingActivity, setViewingActivity] = useState(null);
  const [assigningSessions, setAssigningSessions] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const users = usersQuery.data ?? [];
  const filtered = users
    .filter((u) => roleFilter === "Todos" || u.role === roleFilter)
    .filter((u) => !filters.status || u.status === filters.status)
    .filter(
      (u) =>
        u.name.toLowerCase().includes(q.toLowerCase()) ||
        u.email.toLowerCase().includes(q.toLowerCase()) ||
        u.username.toLowerCase().includes(q.toLowerCase()),
    );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const exportCsv = () => {
    const header = ["id", "username", "nombre", "correo", "rol", "estado", "lastSeen"];
    const rows = filtered.map((u) => [u.id, u.username, u.name, u.email, u.role, u.status, u.lastSeen ?? ""]);
    downloadCsv([header, ...rows], `usuarios_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.ok(`Exportados ${filtered.length} usuarios a CSV.`);
  };

  const saveEdit = (next) =>
    updateMutation.mutate(
      { id: next.id, name: next.name, email: next.email, role: next.role, status: next.status },
      {
        onSuccess: () => toast.ok(`Cambios guardados en ${next.name}.`),
        onError: onMutationError,
      },
    );

  const toggleSuspend = (u) => {
    const newStatus = u.status === "Suspendido" ? "Activo" : "Suspendido";
    updateMutation.mutate(
      { id: u.id, status: newStatus },
      {
        onSuccess: () => toast.ok(`${u.name} ${newStatus === "Activo" ? "reactivado" : "suspendido"}.`),
        onError: onMutationError,
      },
    );
  };

  const removeUser = (u) =>
    deleteMutation.mutate(u.id, {
      onSuccess: () => toast.warn(`Usuario ${u.name} eliminado.`),
      onError: onMutationError,
    });

  return (
    <div className="grid gap-4">
      <Header onCreate={() => setShowCreate(true)} />

      <Toolbar
        q={q}
        setQ={setQ}
        role={roleFilter}
        setRole={setRoleFilter}
        activeFilterCount={activeFilterCount}
        onFilters={() => setFiltersOpen(true)}
        onExport={exportCsv}
      />

      {usersQuery.isLoading ? (
        <LoadingPanel label="Cargando usuarios…" />
      ) : usersQuery.isError ? (
        <ErrorPanel onRetry={() => usersQuery.refetch()} />
      ) : (
        <>
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
        </>
      )}

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
        placeholder="Buscar por nombre, usuario o correo…"
        icon={<I.search size={14} />}
        style={{ flex: 1, maxWidth: 380 }}
      />
      <div className="flex bg-surface" style={{ border: "1px solid var(--border-strong)" }}>
        {["Todos", "Administrador", "Supervisor", "Operador"].map((r) => (
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
    { label: "@", render: (r) => <span className="mono text-xs">{r.username}</span> },
    { label: "Rol", render: (r) => <Badge tone={r.role === "Administrador" || r.role === "Supervisor" ? "accent" : "neutral"}>{r.role}</Badge> },
    {
      label: "Estado",
      render: (r) => (
        <Badge tone={r.status === "Activo" ? "info" : r.status === "Suspendido" ? "danger" : "warn"}>
          <span style={{ width: 6, height: 6, background: "currentColor", display: "inline-block" }} />
          {r.status}
        </Badge>
      ),
    },
    { label: "Última actividad", render: (r) => <span className="text-xs text-muted">{timeAgo(r.lastSeen)}</span> },
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

function LoadingPanel({ label }) {
  return (
    <div
      className="bg-surface text-muted text-[13px] text-center"
      style={{ padding: "32px 20px", border: "1px solid var(--border)" }}
    >
      {label}
    </div>
  );
}
function ErrorPanel({ onRetry }) {
  return (
    <div
      className="bg-surface text-center"
      style={{ padding: "32px 20px", border: "1px solid var(--border)" }}
    >
      <div className="text-[13px] text-danger">No se pudo cargar la información del servidor.</div>
      <div className="mt-3">
        <Button size="sm" variant="ghost" onClick={onRetry}>Reintentar</Button>
      </div>
    </div>
  );
}
