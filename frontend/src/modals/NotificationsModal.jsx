import { Button } from "../components/ui/Button.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";

// Topbar bell. Currently feeds from a static list; with the backend, the list
// will come from /notifications and the "marcar como leídas" will POST.
const NOTIFICATIONS = [
  { id: 1, t: "hace 2 min", title: "Campaña Promo Mayo terminó", body: "3.420 destinatarios · 14 fallidos", tone: "ok" },
  { id: 2, t: "hace 14 min", title: "Sesión #3 reconectada", body: "+51 944 ··· 412 volvió a estar disponible.", tone: "info" },
  { id: 3, t: "hace 1 h", title: "Intento de acceso fallido", body: "Usuario a.flores · 3er intento bloqueado.", tone: "warn" },
  { id: 4, t: "hoy 09:00", title: "Recordatorio: Encuesta NPS programada", body: "Inicia mañana a las 09:00.", tone: "info" },
];

const TONE_DOT = {
  ok: "#1A6B45",
  warn: "var(--warn)",
  danger: "var(--danger)",
  info: "var(--info)",
};

export function NotificationsModal({ onClose }) {
  return (
    <ModalShell
      title="Notificaciones"
      subtitle={`${NOTIFICATIONS.length} sin leer`}
      width={520}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cerrar</Button>
          <Button variant="primary">Marcar todas como leídas</Button>
        </>
      )}
    >
      <div className="grid gap-0">
        {NOTIFICATIONS.map((n, i) => (
          <div
            key={n.id}
            className="grid items-start gap-3"
            style={{
              gridTemplateColumns: "8px 1fr 80px",
              padding: "12px 4px",
              borderTop: i > 0 ? "1px solid var(--border)" : "none",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                marginTop: 6,
                background: TONE_DOT[n.tone] || "var(--info)",
                borderRadius: "50%",
              }}
            />
            <div>
              <div className="text-[13px] font-medium">{n.title}</div>
              <div className="text-xs text-muted mt-0.5">{n.body}</div>
            </div>
            <span className="mono text-[11px] text-muted text-right">{n.t}</span>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}
