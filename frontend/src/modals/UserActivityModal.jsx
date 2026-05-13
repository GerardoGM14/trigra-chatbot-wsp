import { I } from "../components/Icons.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";
import { ACTIVITY } from "../lib/data.js";

// Bitácora per user. If the mock activity log doesn't have entries for this
// user, fall back to the latest 5 so demo users still see something.

export function UserActivityModal({ user, onClose }) {
  const rows = ACTIVITY.filter((a) => a.user === user.email.split("@")[0] || a.user === user.id);
  const visible = rows.length > 0 ? rows : ACTIVITY.slice(0, 5);
  return (
    <ModalShell
      title={`Bitácora · ${user.name}`}
      subtitle={`Últimas ${visible.length} acciones registradas`}
      width={680}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cerrar</Button>
          <Button variant="primary" icon={<I.download size={12} />}>Exportar CSV</Button>
        </>
      )}
    >
      <div style={{ border: "1px solid var(--border)" }}>
        {visible.map((a, i) => (
          <div
            key={i}
            className="grid items-center"
            style={{
              gridTemplateColumns: "90px 1fr 80px",
              gap: 12,
              padding: "10px 14px",
              borderTop: i > 0 ? "1px solid var(--border)" : "none",
            }}
          >
            <span className="mono text-[11px] text-muted">{a.t}</span>
            <div className="text-[13px] flex gap-2 items-baseline">
              <span className="mono text-[11px] text-ink-2">{a.action}</span>
              <span className="text-muted text-xs">{a.detail}</span>
            </div>
            <Badge
              tone={a.level === "err" ? "danger" : a.level === "warn" ? "warn" : a.level === "info" ? "info" : "neutral"}
            >
              {a.level.toUpperCase()}
            </Badge>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}
