import { useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Table } from "../../components/ui/Table.jsx";
import { Progress } from "../../components/ui/Progress.jsx";
import { Menu } from "../../components/overlays/Menu.jsx";
import { I } from "../../components/Icons.jsx";
import {
  useCampaigns,
  useDeleteCampaign,
  useCampaignAction,
  useCreateCampaign,
} from "../../hooks/api/useCampaigns.js";
import { useMutationError } from "../../hooks/useMutationFeedback.js";
import { useToast } from "../../lib/toast.jsx";
import { num } from "../../lib/format.js";
import {
  PickTemplateModal,
  ConfirmModal,
  RescheduleCampaignModal,
  CampaignDetailModal,
  RecipientsModal,
} from "../../modals";

const TABS = ["Todas", "Enviando", "Programada", "Borrador", "Completada", "Pausada"];

const STATUS_TONE = {
  Enviando: "accent",
  Completada: "info",
  Programada: "warn",
  Pausada: "danger",
};

// Genera un id corto fuera del render para evitar el lint react-hooks/purity.
function makeShortId(prefix) {
  return `${prefix}_${Date.now().toString().slice(-5)}`;
}

export function UserCampaigns({ onCompose }) {
  const { toast } = useToast();
  const onMutationError = useMutationError();

  const [tab, setTab] = useState("Todas");
  const [q, setQ] = useState("");

  const campaignsQuery = useCampaigns(tab === "Todas" ? {} : { status: tab });
  const deleteMutation = useDeleteCampaign();
  const actionMutation = useCampaignAction();
  const duplicateMutation = useCreateCampaign();

  const [pickTpl, setPickTpl] = useState(false);
  const [detail, setDetail] = useState(null);
  const [reschedule, setReschedule] = useState(null);
  const [recipients, setRecipients] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const campaigns = campaignsQuery.data ?? [];
  const filtered = campaigns.filter(
    (c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.slug?.includes(q.toLowerCase()),
  );

  const runAction = (id, action, label) =>
    actionMutation.mutate(
      { id, action },
      {
        onSuccess: () => toast.ok(label),
        onError: onMutationError,
      },
    );

  const duplicateCampaign = (c) => {
    duplicateMutation.mutate(
      {
        slug: makeShortId("camp"),
        name: `${c.name} (copia)`,
        type: c.type,
        body: c.body ?? "Cuerpo del mensaje",
        ownerId: c.ownerId,
        groupIds: [],
      },
      {
        onSuccess: () => toast.ok(`Duplicada como "${c.name} (copia)".`),
        onError: onMutationError,
      },
    );
  };

  const downloadReport = (c) => {
    const csv = `campaña,id,enviados,fallidos,total\n${c.name},${c.slug},${c.sent},${c.failed ?? 0},${c.total}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_${c.slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.ok(`Reporte de ${c.slug} descargado.`);
  };

  return (
    <div className="grid gap-4">
      <Header onCompose={onCompose} onPickTemplate={() => setPickTpl(true)} />
      <Tabs q={q} setQ={setQ} tab={tab} setTab={setTab} />

      {campaignsQuery.isLoading ? (
        <Skeleton label="Cargando campañas…" />
      ) : campaignsQuery.isError ? (
        <ErrorPanel onRetry={() => campaignsQuery.refetch()} />
      ) : (
        <Table
          columns={buildColumns({
            onPause: (c) => runAction(c.id, "pause", `Campaña "${c.name}" pausada.`),
            onResume: (c) => runAction(c.id, "resume", `Campaña "${c.name}" reanudada.`),
            onDetail: setDetail,
            onDuplicate: duplicateCampaign,
            onEdit: onCompose,
            onReschedule: setReschedule,
            onLaunch: (c) => setConfirm({ kind: "launch", campaign: c }),
            onReport: downloadReport,
            onRecipients: setRecipients,
            onArchive: (c) => setConfirm({ kind: "archive", campaign: c }),
            onDelete: (c) => setConfirm({ kind: "delete", campaign: c }),
          })}
          rows={filtered}
        />
      )}

      {pickTpl && (
        <PickTemplateModal
          onClose={() => setPickTpl(false)}
          onPick={(t) => { toast.ok(`Plantilla "${t.name}" seleccionada.`); onCompose(); }}
        />
      )}
      {detail && <CampaignDetailModal campaign={normalizeForDetail(detail)} onClose={() => setDetail(null)} />}
      {reschedule && (
        <RescheduleCampaignModal
          campaign={reschedule}
          onClose={() => setReschedule(null)}
          onSave={(when) => {
            toast.ok(`Reprogramada para ${when}.`);
            // TODO: cuando el backend exponga /api/campaigns/:id/reschedule lo conectamos.
          }}
        />
      )}
      {recipients && <RecipientsModal campaign={normalizeForDetail(recipients)} onClose={() => setRecipients(null)} />}
      {confirm && (
        <ConfirmModal
          title={confirmTitle(confirm)}
          message={confirmMessage(confirm)}
          confirmLabel={confirmLabel(confirm)}
          tone={confirm.kind === "delete" ? "danger" : "primary"}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            if (confirm.kind === "delete") {
              deleteMutation.mutate(confirm.campaign.id, {
                onSuccess: () => toast.warn("Campaña eliminada."),
                onError: onMutationError,
              });
            } else if (confirm.kind === "archive") {
              runAction(confirm.campaign.id, "archive", "Campaña archivada.");
            } else {
              runAction(confirm.campaign.id, "launch", `Campaña "${confirm.campaign.name}" lanzada.`);
            }
          }}
        />
      )}
    </div>
  );
}

// Algunos modales esperan el shape del mock antiguo. Adaptamos.
function normalizeForDetail(c) {
  return {
    id: c.slug ?? c.id,
    name: c.name,
    type: c.type,
    status: c.status,
    total: c.total,
    sent: c.sent,
    fail: c.failed ?? 0,
    progress: c.progress,
    scheduled: c.scheduledAt ? new Date(c.scheduledAt).toLocaleString("es-PE") : "—",
    owner: c.owner?.username ?? "—",
  };
}

function Header({ onCompose, onPickTemplate }) {
  return (
    <div className="flex justify-between items-end">
      <div>
        <h2 className="m-0 text-[22px] font-semibold" style={{ letterSpacing: "-0.02em" }}>Mis campañas</h2>
        <p className="mt-1 mb-0 text-muted text-[13px]">
          Envíos masivos creados por ti. Programa, pausa o duplica desde cada fila.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" icon={<I.tpl size={14} />} onClick={onPickTemplate}>Desde plantilla</Button>
        <Button variant="accent" icon={<I.plus size={14} />} onClick={onCompose}>Nueva campaña</Button>
      </div>
    </div>
  );
}

function Tabs({ q, setQ, tab, setTab }) {
  return (
    <div className="flex gap-2.5 items-center">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar campañas…"
        icon={<I.search size={14} />}
        style={{ flex: 1, maxWidth: 340 }}
      />
      <div className="flex bg-surface" style={{ border: "1px solid var(--border-strong)" }}>
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="text-xs font-medium cursor-pointer"
            style={{
              padding: "7px 12px",
              border: "none",
              borderLeft: i > 0 ? "1px solid var(--border)" : "none",
              background: tab === t ? "var(--ink)" : "transparent",
              color: tab === t ? "#fff" : "var(--ink)",
            }}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

function buildColumns(h) {
  return [
    {
      label: "Campaña",
      render: (r) => (
        <div>
          <div className="text-[13px] font-medium">{r.name}</div>
          <div className="mono text-[11px] text-muted mt-0.5">{r.slug ?? r.id} · {r.type}</div>
        </div>
      ),
    },
    {
      label: "Estado",
      render: (r) => (
        <Badge tone={STATUS_TONE[r.status] || "neutral"}>
          <span style={{ width: 6, height: 6, background: "currentColor", display: "inline-block" }} />
          {r.status}
        </Badge>
      ),
    },
    {
      label: "Progreso",
      render: (r) => (
        <div style={{ width: 200 }}>
          <Progress value={r.sent} total={r.total || 1} tone={r.status === "Enviando" ? "accent" : "ink"} />
          <div className="mono text-[11px] text-muted mt-1">
            {num(r.sent)} / {num(r.total)}
          </div>
        </div>
      ),
    },
    {
      label: "Fallidos",
      align: "right",
      render: (r) => (
        <span className="mono" style={{ color: (r.failed ?? 0) > 0 ? "var(--danger)" : "var(--muted)" }}>
          {r.failed ?? 0}
        </span>
      ),
    },
    {
      label: "Programación",
      render: (r) => (
        <span className="text-xs">{r.scheduledAt ? new Date(r.scheduledAt).toLocaleString("es-PE") : "—"}</span>
      ),
    },
    { label: "Operador", render: (r) => <span className="mono text-xs">{r.owner?.username ?? "—"}</span> },
    {
      label: "",
      align: "right",
      nowrap: true,
      render: (r) => <RowActions row={r} h={h} />,
    },
  ];
}

function RowActions({ row: r, h }) {
  return (
    <div className="flex gap-1 justify-end">
      {r.status === "Enviando" && (
        <Button size="sm" variant="ghost" icon={<I.pause size={12} />} onClick={() => h.onPause(r)}>Pausar</Button>
      )}
      {r.status === "Pausada" && (
        <Button size="sm" variant="ghost" icon={<I.play size={12} />} onClick={() => h.onResume(r)}>Reanudar</Button>
      )}
      <Menu items={buildMenuItems(r, h)} />
    </div>
  );
}

function buildMenuItems(r, h) {
  return [
    { label: "Ver detalle", icon: <I.doc size={12} />, onClick: () => h.onDetail(r) },
    { label: "Duplicar campaña", icon: <I.list size={12} />, onClick: () => h.onDuplicate(r) },
    {
      label: "Editar borrador",
      icon: <I.edit size={12} />,
      onClick: h.onEdit,
      hint: r.status !== "Borrador" ? "sólo borrador" : undefined,
    },
    { label: "Reprogramar envío", icon: <I.cal size={12} />, onClick: () => h.onReschedule(r) },
    { divider: true },
    ...(r.status === "Programada"
      ? [{ label: "Lanzar ahora", icon: <I.send size={12} />, onClick: () => h.onLaunch(r) }]
      : []),
    { label: "Exportar reporte", icon: <I.download size={12} />, onClick: () => h.onReport(r) },
    { label: "Ver destinatarios", icon: <I.contact size={12} />, onClick: () => h.onRecipients(r) },
    { divider: true },
    { label: "Archivar", icon: <I.doc size={12} />, onClick: () => h.onArchive(r) },
    { label: "Eliminar campaña", icon: <I.trash size={12} />, onClick: () => h.onDelete(r), danger: true },
  ];
}

function confirmTitle(c) {
  if (c.kind === "delete") return "Eliminar campaña";
  if (c.kind === "archive") return "Archivar campaña";
  return "Lanzar campaña ahora";
}
function confirmMessage(c) {
  if (c.kind === "delete") return `Vas a eliminar "${c.campaign.name}". Esta acción no se puede deshacer.`;
  if (c.kind === "archive") return `"${c.campaign.name}" pasará al archivo y dejará de aparecer en la lista.`;
  return `Vas a lanzar "${c.campaign.name}" ahora mismo a ${num(c.campaign.total)} destinatarios.`;
}
function confirmLabel(c) {
  if (c.kind === "delete") return "Eliminar";
  if (c.kind === "archive") return "Archivar";
  return "Lanzar ahora";
}

function Skeleton({ label }) {
  return (
    <div className="bg-surface text-muted text-[13px] text-center" style={{ padding: 32, border: "1px solid var(--border)" }}>
      {label}
    </div>
  );
}
function ErrorPanel({ onRetry }) {
  return (
    <div className="bg-surface text-center" style={{ padding: 32, border: "1px solid var(--border)" }}>
      <div className="text-[13px] text-danger">No se pudieron cargar las campañas.</div>
      <div className="mt-3">
        <Button size="sm" variant="ghost" onClick={onRetry}>Reintentar</Button>
      </div>
    </div>
  );
}
