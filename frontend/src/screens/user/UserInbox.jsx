import { useEffect, useState } from "react";
import { Input } from "../../components/ui/Input.jsx";
import { Panel } from "../../components/ui/Panel.jsx";
import { I } from "../../components/Icons.jsx";
import {
  useConversations,
  useConversation,
  useMarkRead,
  useSendManual,
  useConversationAction,
} from "../../hooks/api/useConversations.js";
import { useMutationError } from "../../hooks/useMutationFeedback.js";
import { useToast } from "../../lib/toast.jsx";
import { InboxList } from "./inbox/InboxList.jsx";
import { ChatView } from "./inbox/ChatView.jsx";

// Bandeja de conversaciones del operador. Layout: lista (320px) + chat (1fr).
// Las actualizaciones en vivo entran por Socket.IO (useRealtimeUpdates) que
// invalida las queries automáticamente.

export function UserInbox() {
  const { toast } = useToast();
  const onError = useMutationError();

  const [filter, setFilter] = useState("all"); // all | unread | mine
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState(null);

  const conversationsQuery = useConversations({
    q: q || undefined,
    assignedToMe: filter === "mine" ? true : undefined,
  });
  const conversationQuery = useConversation(activeId);
  const markReadMutation = useMarkRead();
  const sendMutation = useSendManual();
  const actionMutation = useConversationAction();

  const all = conversationsQuery.data ?? [];
  const visible =
    filter === "unread" ? all.filter((c) => c.unreadCount > 0) : all;

  // Cuando seleccionas una conversación con unreadCount > 0, la marcamos leída.
  useEffect(() => {
    if (!activeId) return;
    const conv = all.find((c) => c.id === activeId);
    if (conv && conv.unreadCount > 0) {
      markReadMutation.mutate(activeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, all.length]);

  const send = (body) => {
    sendMutation.mutate(
      { id: activeId, body },
      { onError, onSuccess: () => { /* Socket.IO refresca el detalle */ } },
    );
  };

  const runAction = (action, label) => {
    actionMutation.mutate(
      { id: activeId, action },
      { onSuccess: () => toast.ok(label), onError },
    );
  };

  return (
    <div className="grid gap-4">
      <Header />

      <Toolbar q={q} setQ={setQ} filter={filter} setFilter={setFilter} />

      <Panel padding={0}>
        <div className="grid" style={{ gridTemplateColumns: "320px 1fr", minHeight: 600 }}>
          <div style={{ borderRight: "1px solid var(--border)", overflowY: "auto", maxHeight: 700 }}>
            <InboxList
              conversations={visible}
              loading={conversationsQuery.isLoading}
              activeId={activeId}
              onSelect={setActiveId}
            />
          </div>
          <div>
            <ChatView
              conversation={conversationQuery.data}
              loading={!!activeId && conversationQuery.isLoading}
              onSend={send}
              sending={sendMutation.isPending}
              onHandoff={() => runAction("handoff", "Tomaste control de la conversación.")}
              onRelease={() => runAction("release", "Conversación devuelta al bot.")}
              onClose={() => runAction("close", "Conversación cerrada.")}
              actionPending={actionMutation.isPending}
            />
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Header() {
  return (
    <div>
      <h2 className="m-0 text-[22px] font-semibold" style={{ letterSpacing: "-0.02em" }}>
        Bandeja
      </h2>
      <p className="mt-1 mb-0 text-muted text-[13px]">
        Conversaciones en vivo con tus contactos. El bot responde automáticamente; toma el control cuando lo necesites.
      </p>
    </div>
  );
}

function Toolbar({ q, setQ, filter, setFilter }) {
  return (
    <div className="flex gap-2.5 items-center">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nombre o número…"
        icon={<I.search size={14} />}
        style={{ flex: 1, maxWidth: 360 }}
      />
      <div className="flex bg-surface" style={{ border: "1px solid var(--border-strong)" }}>
        {[
          { k: "all", l: "Todas" },
          { k: "unread", l: "Sin leer" },
          { k: "mine", l: "Asignadas a mí" },
        ].map((o, i) => (
          <button
            key={o.k}
            onClick={() => setFilter(o.k)}
            className="text-xs font-medium cursor-pointer"
            style={{
              padding: "7px 14px",
              border: "none",
              borderLeft: i > 0 ? "1px solid var(--border)" : "none",
              background: filter === o.k ? "var(--ink)" : "transparent",
              color: filter === o.k ? "#fff" : "var(--ink)",
            }}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}
