import { useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Table } from "../../components/ui/Table.jsx";
import { Progress } from "../../components/ui/Progress.jsx";
import { Menu } from "../../components/overlays/Menu.jsx";
import { I } from "../../components/Icons.jsx";
import { useToast } from "../../lib/toast.jsx";
import { CAMPAIGNS } from "../../lib/data.js";
import { newCampaignId } from "../../lib/ids.js";
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

export function UserCampaigns({ onCompose }) {
  const { toast } = useToast();
  const [tab, setTab] = useState("Todas");
  const [q, setQ] = useState("");
  const [campaigns, setCampaigns] = useState(CAMPAIGNS);

  const [pickTpl, setPickTpl] = useState(false);
  const [detail, setDetail] = useState(null);
  const [reschedule, setReschedule] = useState(null);
  const [recipients, setRecipients] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const filtered = campaigns
    .filter((c) => tab === "Todas" || c.status === tab)
    .filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.id.includes(q.toLowerCase()));

  const setStatus = (id, status) =>
    setCampaigns((list) => list.map((c) => (c.id === id ? { ...c, status } : c)));
  const removeCampaign = (id) => setCampaigns((list) => list.filter((c) => c.id !== id));
  const duplicateCampaign = (c) => {
    const copy = {
      ...c,
      id: newCampaignId(),
      name: `${c.name} (copia)`,
      status: "Borrador",
      progress: 0,
      sent: 0,
      fail: 0,
    };
    setCampaigns((list) => [copy, ...list]);
    toast.ok(`Duplicada como "${copy.name}".`);
  };
  const downloadReport = (c) => {
    const csv = `campaña,id,enviados,fallidos,total\n${c.name},${c.id},${c.sent},${c.fail},${c.total}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_${c.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.ok(`Reporte de ${c.id} descargado.`);
  };

  return (
    <div className="grid gap-4">
      <Header onCompose={onCompose} onPickTemplate={() => setPickTpl(true)} />
      <Tabs q={q} setQ={setQ} tab={tab} setTab={setTab} />
      <Table
        columns={buildColumns({
          onPause: (c) => { setStatus(c.id, "Pausada"); toast.warn(`Campaña "${c.name}" pausada.`); },
          onResume: (c) => { setStatus(c.id, "Enviando"); toast.ok(`Campaña "${c.name}" reanudada.`); },
          onDetail: setDetail,
          onDuplicate: duplicateCampaign,
          onEdit: onCompose,
          onReschedule: setReschedule,
          onLaunch: (c) => setConfirm({ kind: "launch", campaign: c }),
          onReport: downloadReport,
          onRecipients: setRecipients,
          onArchive: (c) => setConfirm({ kind: "archive", campaign: c }),
          onDelete: (c) => setConfirm({ kind: "delete", campaign: c }),
          setStatus,
          toast,
        })}
        rows={filtered}
      />

      {pickTpl && (
        <PickTemplateModal
          onClose={() => setPickTpl(false)}
          onPick={(t) => { toast.ok(`Plantilla "${t.name}" seleccionada. Abriendo editor…`); onCompose(); }}
        />
      )}
      {detail && <CampaignDetailModal campaign={detail} onClose={() => setDetail(null)} />}
      {reschedule && (
        <RescheduleCampaignModal
          campaign={reschedule}
          onClose={() => setReschedule(null)}
          onSave={(when) => {
            setCampaigns((list) => list.map((c) => (c.id === reschedule.id ? { ...c, scheduled: when } : c)));
            toast.ok(`Reprogramada para ${when}.`);
          }}
        />
      )}
      {recipients && <RecipientsModal campaign={recipients} onClose={() => setRecipients(null)} />}
      {confirm && (
        <ConfirmModal
          title={confirmTitle(confirm)}
          message={confirmMessage(confirm)}
          confirmLabel={confirmLabel(confirm)}
          tone={confirm.kind === "delete" ? "danger" : "primary"}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            if (confirm.kind === "delete") { removeCampaign(confirm.campaign.id); toast.warn("Campaña eliminada."); }
            else if (confirm.kind === "archive") { removeCampaign(confirm.campaign.id); toast.ok("Campaña archivada."); }
            else { setStatus(confirm.campaign.id, "Enviando"); toast.ok(`Campaña "${confirm.campaign.name}" lanzada.`); }
          }}
        />
      )}
    </div>
  );
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
          <div className="mono text-[11px] text-muted mt-0.5">{r.id} · {r.type}</div>
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
            {r.sent.toLocaleString("es-PE")} / {r.total.toLocaleString("es-PE")}
          </div>
        </div>
      ),
    },
    {
      label: "Fallidos",
      align: "right",
      render: (r) => (
        <span className="mono" style={{ color: r.fail > 0 ? "var(--danger)" : "var(--muted)" }}>
          {r.fail}
        </span>
      ),
    },
    { label: "Programación", render: (r) => <span className="text-xs">{r.scheduled}</span> },
    { label: "Operador", render: (r) => <span className="mono text-xs">{r.owner}</span> },
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
    ...(r.status === "Enviando"
      ? [{ label: "Pausar envío", icon: <I.pause size={12} />, onClick: () => { h.setStatus(r.id, "Pausada"); h.toast.warn(`Pausada ${r.id}`); } }]
      : []),
    ...(r.status === "Pausada"
      ? [{ label: "Reanudar envío", icon: <I.play size={12} />, onClick: () => { h.setStatus(r.id, "Enviando"); h.toast.ok(`Reanudada ${r.id}`); } }]
      : []),
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
  return `Vas a lanzar "${c.campaign.name}" ahora mismo a ${c.campaign.total.toLocaleString("es-PE")} destinatarios.`;
}
function confirmLabel(c) {
  if (c.kind === "delete") return "Eliminar";
  if (c.kind === "archive") return "Archivar";
  return "Lanzar ahora";
}
