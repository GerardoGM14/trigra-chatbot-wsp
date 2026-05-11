import { useState, useEffect, useRef } from "react";
import { I } from "../Icons.jsx";
import { Button } from "../ui/Button.jsx";

// Three-dot dropdown. `items` is a list of { label, icon?, onClick, danger?,
// hint? } — or { divider: true } for a separator. The trigger defaults to a
// "more" icon button but can be overridden.

export function Menu({ items, trigger }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block">
      <span
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {trigger || <Button size="sm" variant="ghost" icon={<I.more size={14} />} />}
      </span>
      {open && (
        <div
          className="anim-rise-in absolute right-0 top-full mt-1 bg-surface z-40 p-1"
          style={{ minWidth: 200, border: "1px solid var(--border-strong)" }}
        >
          {items.map((it, i) =>
            it.divider ? (
              <div key={i} className="h-px bg-border my-1" />
            ) : (
              <button
                key={i}
                onClick={() => {
                  setOpen(false);
                  it.onClick && it.onClick();
                }}
                className="flex items-center gap-2.5 w-full text-left border-none bg-transparent cursor-pointer text-[13px]"
                style={{ padding: "8px 10px", color: it.danger ? "var(--danger)" : "var(--ink)", fontFamily: "inherit" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {it.icon && (
                  <span className="inline-flex" style={{ color: it.danger ? "var(--danger)" : "var(--muted)" }}>
                    {it.icon}
                  </span>
                )}
                <span className="flex-1">{it.label}</span>
                {it.hint && <span className="mono text-[11px] text-muted">{it.hint}</span>}
              </button>
            ),
          )}
        </div>
      )}
    </span>
  );
}
