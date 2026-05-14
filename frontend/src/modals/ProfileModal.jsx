import { I } from "../components/Icons.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Avatar } from "../components/ui/Avatar.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";

// Topbar avatar → profile + quick logout. Backend will hydrate the stats
// (last login, assigned sessions, etc.) — for now they're placeholders.

export function ProfileModal({ user, onClose, onLogout }) {
  return (
    <ModalShell
      title="Mi cuenta"
      subtitle={user.label}
      width={420}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cerrar</Button>
          <Button variant="primary" icon={<I.logout size={12} />} onClick={() => { onLogout(); close(); }}>
            Cerrar sesión
          </Button>
        </>
      )}
    >
      <div className="grid gap-4">
        <div
          className="flex items-center gap-3"
          style={{ padding: "14px 16px", border: "1px solid var(--border)", background: "var(--surface-2)" }}
        >
          <Avatar name={user.name} size={42} />
          <div>
            <div className="text-sm font-semibold">{user.name}</div>
            <div className="text-xs text-muted">{user.label}</div>
          </div>
        </div>
        <div className="grid gap-2 text-[13px]">
          <InfoRow k="Autenticación 2FA" v={<Badge tone="info">Activa</Badge>} />
          <InfoRow k="Última conexión" v={<span className="mono text-xs">hoy 09:42</span>} />
          <InfoRow k="Sesiones asignadas" v={<span className="mono text-xs">3</span>} />
        </div>
      </div>
    </ModalShell>
  );
}

function InfoRow({ k, v }) {
  return (
    <div
      className="flex justify-between items-center"
      style={{ padding: "10px 12px", border: "1px solid var(--border)" }}
    >
      <span className="text-muted">{k}</span>
      {v}
    </div>
  );
}
