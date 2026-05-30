import { Avatar } from "../../../components/ui/Avatar.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { timeAgo } from "../../../lib/format.js";

// Sidebar de la bandeja: lista de conversaciones ordenadas por última actividad.
// Click → selecciona conversación. Item resaltado si tiene mensajes sin leer.

const STATUS_TONE = {
  bot: "info",
  handed_off: "accent",
  closed: "neutral",
};
const STATUS_LABEL = {
  bot: "Bot",
  handed_off: "En atención",
  closed: "Cerrada",
};

export function InboxList({ conversations, loading, activeId, onSelect }) {
  if (loading) {
    return (
      <div className="text-muted text-[13px] text-center" style={{ padding: "32px 0" }}>
        Cargando conversaciones…
      </div>
    );
  }
  if (conversations.length === 0) {
    return (
      <div className="text-muted text-[13px] text-center" style={{ padding: "32px 16px" }}>
        Sin conversaciones todavía. Cuando alguien escriba a una de tus sesiones, aparecerá aquí.
      </div>
    );
  }

  return (
    <div>
      {conversations.map((c, i) => {
        const on = activeId === c.id;
        const name = c.contactName || c.contactPhone;
        const lastBody = c.lastMessage?.body ?? "—";
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className="w-full text-left flex items-center gap-3 cursor-pointer border-none"
            style={{
              padding: "12px 16px",
              borderTop: i > 0 ? "1px solid var(--border)" : "none",
              background: on ? "var(--surface-2)" : "transparent",
            }}
          >
            <Avatar name={name} size={36} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline gap-2">
                <div
                  className="text-[13px] font-semibold"
                  style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                >
                  {name}
                </div>
                <span className="mono text-[10px] text-muted whitespace-nowrap">
                  {timeAgo(c.lastMessageAt)}
                </span>
              </div>
              <div className="flex justify-between items-baseline gap-2 mt-0.5">
                <div
                  className="text-xs text-muted"
                  style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                >
                  {lastBody.slice(0, 60)}
                </div>
                {c.unreadCount > 0 && (
                  <span
                    className="mono text-[10px] font-semibold text-white"
                    style={{ background: "var(--accent)", padding: "1px 6px", borderRadius: 999 }}
                  >
                    {c.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex gap-1 mt-1">
                <Badge tone={STATUS_TONE[c.status] || "neutral"}>{STATUS_LABEL[c.status] || c.status}</Badge>
                {c.session && <span className="mono text-[10px] text-muted">{c.session.slug}</span>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
