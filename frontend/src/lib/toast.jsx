// Toast system — replaces alert() for ephemeral confirmations.
// Usage: const { toast } = useToast(); toast.ok("Guardado"); toast.warn(...)
/* eslint-disable react-refresh/only-export-components -- provider + hook colocated by design */

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const remove = useCallback((id) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (tone, message, opts = {}) => {
      const id = nextId++;
      const ttl = opts.ttl ?? 3200;
      setItems((list) => [...list, { id, tone, message, ttl }]);
      return id;
    },
    [],
  );

  const toast = {
    ok: (m, o) => push("ok", m, o),
    info: (m, o) => push("info", m, o),
    warn: (m, o) => push("warn", m, o),
    err: (m, o) => push("danger", m, o),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastViewport items={items} onDismiss={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const TONE_STYLES = {
  ok: { bg: "var(--surface)", border: "var(--ink)", accent: "#1A6B45" },
  info: { bg: "var(--info-soft)", border: "var(--info)", accent: "var(--info)" },
  warn: { bg: "var(--warn-soft)", border: "var(--warn)", accent: "var(--warn)" },
  danger: { bg: "var(--danger-soft)", border: "var(--danger)", accent: "var(--danger)" },
};

function ToastViewport({ items, onDismiss }) {
  if (!items.length) return null;
  return createPortal(
    <div
      className="fixed flex flex-col gap-2 pointer-events-none"
      style={{ bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 2147483645 }}
    >
      {items.map((t) => (
        <ToastItem key={t.id} item={t} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  );
}

function ToastItem({ item, onDismiss }) {
  const [closing, setClosing] = useState(false);
  const dismiss = useCallback(() => {
    setClosing(true);
    setTimeout(() => onDismiss(item.id), 180);
  }, [item.id, onDismiss]);

  useEffect(() => {
    const t = setTimeout(dismiss, item.ttl);
    return () => clearTimeout(t);
  }, [dismiss, item.ttl]);

  const s = TONE_STYLES[item.tone] || TONE_STYLES.info;
  return (
    <div
      className={`${closing ? "anim-fade-out" : "anim-rise-in"} pointer-events-auto flex items-center gap-3 text-[13px]`}
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderLeft: `3px solid ${s.accent}`,
        padding: "10px 14px",
        minWidth: 280,
        maxWidth: 480,
        color: "var(--ink)",
      }}
    >
      <span className="flex-1">{item.message}</span>
      <button
        onClick={dismiss}
        className="border-none bg-transparent cursor-pointer text-muted text-base leading-none"
        aria-label="Cerrar"
      >
        ✕
      </button>
    </div>
  );
}
