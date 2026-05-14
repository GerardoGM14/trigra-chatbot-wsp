import { Button } from "../components/ui/Button.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";

// Generic yes/no confirmation. `tone="danger"` paints the confirm button red
// so destructive actions read as such.

export function ConfirmModal({ title, message, confirmLabel = "Confirmar", tone = "primary", onClose, onConfirm }) {
  return (
    <ModalShell
      title={title}
      width={460}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button
            variant={tone === "danger" ? "primary" : tone}
            onClick={() => { onConfirm?.(); close(); }}
            style={tone === "danger" ? { background: "var(--danger)", borderColor: "var(--danger)", color: "#fff" } : undefined}
          >
            {confirmLabel}
          </Button>
        </>
      )}
    >
      <div className="text-[13px]" style={{ lineHeight: 1.55, color: "var(--ink-2)" }}>
        {message}
      </div>
    </ModalShell>
  );
}
