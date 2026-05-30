import { Badge } from "../../../components/ui/Badge.jsx";

// Lista de flows en la sidebar del editor.

export function FlowList({ flows, activeId, onSelect }) {
  if (flows.length === 0) {
    return (
      <div className="text-muted text-[13px] text-center" style={{ padding: "24px 12px" }}>
        Sin flows. Crea el primero con el botón de arriba.
      </div>
    );
  }

  return (
    <div>
      {flows.map((f, i) => {
        const on = activeId === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            className="w-full text-left flex items-center gap-2.5 cursor-pointer border-none"
            style={{
              padding: "12px 16px",
              borderTop: i > 0 ? "1px solid var(--border)" : "none",
              background: on ? "var(--surface-2)" : "transparent",
            }}
          >
            <span
              className="self-stretch"
              style={{ width: 4, background: on ? "var(--accent)" : "transparent" }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {f.name}
              </div>
              <div className="mono text-[11px] text-muted mt-0.5">
                {f.trigger} · {f._count?.nodes ?? 0} nodos
              </div>
            </div>
            <Badge tone={f.isActive ? "info" : "neutral"}>{f.isActive ? "Activo" : "Inactivo"}</Badge>
          </button>
        );
      })}
    </div>
  );
}
