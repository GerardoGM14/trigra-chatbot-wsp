import { useEffect, useRef, useState } from "react";
import { Button } from "../../../components/ui/Button.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Avatar } from "../../../components/ui/Avatar.jsx";
import { I } from "../../../components/Icons.jsx";
import { timeOfDay } from "../../../lib/format.js";

// Vista del chat de una conversación: header + lista de mensajes + composer.
// Hace auto-scroll al fondo cuando llegan mensajes nuevos.

export function ChatView({
  conversation,
  loading,
  onSend,
  sending,
  onHandoff,
  onRelease,
  onClose,
  actionPending,
}) {
  if (!conversation && !loading) {
    return (
      <div
        className="flex items-center justify-center text-muted text-[13px] h-full"
        style={{ minHeight: 400 }}
      >
        Selecciona una conversación a la izquierda.
      </div>
    );
  }
  if (loading || !conversation) {
    return (
      <div
        className="flex items-center justify-center text-muted text-[13px] h-full"
        style={{ minHeight: 400 }}
      >
        Cargando conversación…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 500 }}>
      <ChatHeader
        conversation={conversation}
        onHandoff={onHandoff}
        onRelease={onRelease}
        onClose={onClose}
        actionPending={actionPending}
      />
      <MessageList messages={conversation.messages} />
      <Composer
        disabled={conversation.status === "closed"}
        onSend={onSend}
        sending={sending}
      />
    </div>
  );
}

function ChatHeader({ conversation, onHandoff, onRelease, onClose, actionPending }) {
  const name = conversation.contactName || conversation.contactPhone;
  return (
    <div
      className="flex justify-between items-center"
      style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}
    >
      <div className="flex items-center gap-3">
        <Avatar name={name} size={36} />
        <div>
          <div className="text-[14px] font-semibold">{name}</div>
          <div className="mono text-[11px] text-muted">
            {conversation.contactPhone} · {conversation.session?.slug}
          </div>
        </div>
      </div>
      <div className="flex gap-1.5 items-center">
        <Badge
          tone={
            conversation.status === "bot"
              ? "info"
              : conversation.status === "handed_off"
                ? "accent"
                : "neutral"
          }
        >
          {conversation.status === "bot" && "🤖 Bot"}
          {conversation.status === "handed_off" && `👤 ${conversation.assignedUser?.username ?? "asignada"}`}
          {conversation.status === "closed" && "Cerrada"}
        </Badge>
        {conversation.status === "bot" && (
          <Button size="sm" variant="primary" onClick={onHandoff} disabled={actionPending}>
            Tomar control
          </Button>
        )}
        {conversation.status === "handed_off" && (
          <Button size="sm" variant="ghost" onClick={onRelease} disabled={actionPending}>
            Devolver al bot
          </Button>
        )}
        {conversation.status !== "closed" && (
          <Button size="sm" variant="ghost" icon={<I.x size={12} />} onClick={onClose} disabled={actionPending}>
            Cerrar
          </Button>
        )}
      </div>
    </div>
  );
}

function MessageList({ messages }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages?.length]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted text-xs" style={{ minHeight: 300 }}>
        Sin mensajes todavía.
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto"
      style={{ padding: "16px 18px", background: "#EDEAE2", minHeight: 300 }}
    >
      {messages.map((m, i) => (
        <MessageBubble key={m.id ?? i} message={m} />
      ))}
    </div>
  );
}

function MessageBubble({ message }) {
  const outbound = message.direction === "outbound";
  const isBot = outbound && !message.sentByUser;
  return (
    <div
      className="flex"
      style={{
        justifyContent: outbound ? "flex-end" : "flex-start",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          maxWidth: "70%",
          background: outbound ? "var(--surface)" : "#FFF",
          border: "1px solid var(--border)",
          borderLeft: outbound ? `3px solid ${isBot ? "var(--info)" : "var(--accent)"}` : "1px solid var(--border)",
          padding: "8px 12px",
        }}
      >
        {outbound && (
          <div className="mono text-[10px] text-muted" style={{ marginBottom: 2 }}>
            {isBot ? "🤖 bot" : `👤 ${message.sentByUser?.username ?? "operador"}`}
          </div>
        )}
        <div className="text-[13px]" style={{ whiteSpace: "pre-wrap", lineHeight: 1.45 }}>
          {message.body}
        </div>
        <div className="mono text-[10px] text-muted text-right" style={{ marginTop: 4 }}>
          {timeOfDay(message.createdAt)}
        </div>
      </div>
    </div>
  );
}

function Composer({ disabled, onSend, sending }) {
  const [text, setText] = useState("");
  const submit = () => {
    if (!text.trim() || sending || disabled) return;
    onSend(text.trim());
    setText("");
  };
  return (
    <div
      className="flex gap-2 items-center"
      style={{ padding: "12px 18px", borderTop: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
        placeholder={disabled ? "Conversación cerrada" : "Escribe un mensaje…"}
        disabled={disabled}
        className="flex-1 border-none outline-none text-[13px] px-3 h-9"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)" }}
      />
      <Button
        variant="accent"
        onClick={submit}
        disabled={!text.trim() || sending || disabled}
        icon={<I.send size={12} />}
      >
        {sending ? "Enviando…" : "Enviar"}
      </Button>
    </div>
  );
}
