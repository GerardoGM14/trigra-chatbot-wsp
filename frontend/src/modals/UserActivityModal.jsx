import { useMemo } from "react";
import { I } from "../components/Icons.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";
import { useActivity } from "../hooks/api/useActivity.js";
import { timeOfDay } from "../lib/format.js";

// Bitácora por usuario. El backend devuelve TODA la actividad; aquí filtramos
// del lado cliente por user.username (cuando el backend exponga `userId` como
// parámetro de query, lo pasamos al hook).

export function UserActivityModal({ user, onClose }) {
  const activityQuery = useActivity({ take: 200 });
  const visible = useMemo(() => {
    const rows = activityQuery.data ?? [];
    const filtered = rows.filter((a) => a.user?.username === user.username);
    return filtered.length > 0 ? filtered.slice(0, 50) : rows.slice(0, 5);
  }, [activityQuery.data, user.username]);

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
        {activityQuery.isLoading ? (
          <div className="text-muted text-[13px] text-center" style={{ padding: 16 }}>
            Cargando actividad…
          </div>
        ) : visible.length === 0 ? (
          <div className="text-muted text-[13px] text-center" style={{ padding: 16 }}>
            Sin actividad registrada.
          </div>
        ) : (
          visible.map((a, i) => (
            <div
              key={a.id}
              className="grid items-center"
              style={{
                gridTemplateColumns: "90px 1fr 80px",
                gap: 12,
                padding: "10px 14px",
                borderTop: i > 0 ? "1px solid var(--border)" : "none",
              }}
            >
              <span className="mono text-[11px] text-muted">{timeOfDay(a.createdAt)}</span>
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
          ))
        )}
      </div>
    </ModalShell>
  );
}
