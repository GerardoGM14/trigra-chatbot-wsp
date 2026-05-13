import { I } from "../components/Icons.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";

// Deterministic preview of 12 recipients derived from the campaign id, so the
// same campaign always shows the same numbers. Caller gets a "Exportar" CTA
// for the full list once the backend is wired.

export function RecipientsModal({ campaign, onClose }) {
  const seed = parseInt(campaign.id.replace(/\D/g, ""), 10) || 0;
  const sample = Array.from({ length: 12 }, (_, i) => {
    const base = String(900000000 + ((seed * 7919 + i * 1009) % 99999999)).slice(0, 9);
    return `+51 ${base.slice(0, 3)} ${base.slice(3, 6)} ${base.slice(6)}`;
  });
  return (
    <ModalShell
      title={`Destinatarios · ${campaign.name}`}
      subtitle={`${campaign.total.toLocaleString("es-PE")} contactos · vista parcial`}
      width={520}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cerrar</Button>
          <Button variant="primary" icon={<I.download size={12} />}>Exportar lista</Button>
        </>
      )}
    >
      <div style={{ border: "1px solid var(--border)" }}>
        {sample.map((p, i) => (
          <div
            key={i}
            className="grid items-center"
            style={{
              gridTemplateColumns: "1fr 100px",
              padding: "10px 14px",
              borderTop: i > 0 ? "1px solid var(--border)" : "none",
            }}
          >
            <span className="mono text-[13px]">{p}</span>
            <Badge tone="info">
              <span style={{ width: 6, height: 6, background: "currentColor", display: "inline-block" }} />
              Válido
            </Badge>
          </div>
        ))}
      </div>
      <div className="text-xs text-muted mt-2">
        Mostrando 12 de {campaign.total.toLocaleString("es-PE")} destinatarios. Descarga el CSV para verlos todos.
      </div>
    </ModalShell>
  );
}
