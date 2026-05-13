import { I } from "../components/Icons.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";
import { ALL_OPERATORS } from "../lib/data.js";

const STATUS_BY_TONE = {
  accent: "Activa",
  info: "Recurrente",
};

export function EventDetailModal({ event, day, onClose, onReschedule }) {
  const statusLabel = STATUS_BY_TONE[event.tone] || "Programada";
  return (
    <ModalShell
      title={event.n}
      subtitle={`Mayo ${String(day).padStart(2, "0")}, 2026 · ${event.t}`}
      width={460}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cerrar</Button>
          <Button variant="primary" icon={<I.cal size={12} />} onClick={() => { onReschedule?.(); close(); }}>
            Reprogramar
          </Button>
        </>
      )}
    >
      <div className="grid gap-3">
        <div className="flex gap-2">
          <Badge tone={event.tone === "accent" ? "accent" : event.tone === "info" ? "info" : "warn"}>
            <span style={{ width: 6, height: 6, background: "currentColor", display: "inline-block" }} />
            {statusLabel}
          </Badge>
          <Badge tone="neutral">@{ALL_OPERATORS[0].u}</Badge>
        </div>
        <div
          className="grid gap-2 text-[13px]"
          style={{ padding: "12px 14px", background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          <div
            className="flex justify-between"
            style={{ paddingBottom: 8, borderBottom: "1px dashed var(--border)" }}
          >
            <span className="text-muted">Inicio</span>
            <span className="mono">Mayo {String(day).padStart(2, "0")} · {event.t}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Estimación</span>
            <span>~ 45 min</span>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
