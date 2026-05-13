import { I } from "../components/Icons.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { Stat } from "../components/ui/Stat.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";

const TONE_BY_STATUS = {
  Enviando: "accent",
  Completada: "info",
  Programada: "warn",
  Pausada: "danger",
};

export function CampaignDetailModal({ campaign, onClose }) {
  return (
    <ModalShell
      title={campaign.name}
      subtitle={<span><span className="mono">{campaign.id}</span> · {campaign.type}</span>}
      width={620}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cerrar</Button>
          <Button variant="primary" icon={<I.download size={12} />}>Descargar reporte</Button>
        </>
      )}
    >
      <div className="grid gap-3">
        <div className="flex gap-2">
          <Badge tone={TONE_BY_STATUS[campaign.status] || "neutral"}>
            <span style={{ width: 6, height: 6, background: "currentColor", display: "inline-block" }} />
            {campaign.status}
          </Badge>
          <Badge tone="neutral">{campaign.type}</Badge>
          <Badge tone="neutral">@{campaign.owner}</Badge>
        </div>

        <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
          <Stat label="Destinatarios" value={campaign.total.toLocaleString("es-PE")} />
          <Stat label="Enviados" value={campaign.sent.toLocaleString("es-PE")} />
          <Stat label="Fallidos" value={campaign.fail} />
          <Stat label="Progreso" value={`${campaign.progress}%`} />
        </div>

        <div
          className="grid gap-2 text-[13px]"
          style={{ padding: "12px 14px", background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          <DetailRow k="Programada" v={campaign.scheduled} />
          <DetailRow k="Tipo de mensaje" v={campaign.type} />
          <DetailRow k="Operador responsable" v={<span className="mono">{campaign.owner}</span>} last />
        </div>
      </div>
    </ModalShell>
  );
}

function DetailRow({ k, v, last }) {
  return (
    <div
      className="flex justify-between"
      style={{ paddingBottom: last ? 0 : 8, borderBottom: last ? "none" : "1px dashed var(--border)" }}
    >
      <span className="text-muted">{k}</span>
      <span>{v}</span>
    </div>
  );
}
