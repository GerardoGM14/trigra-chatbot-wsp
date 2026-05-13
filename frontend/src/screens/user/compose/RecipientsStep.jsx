import { Badge } from "../../../components/ui/Badge.jsx";
import { Panel } from "../../../components/ui/Panel.jsx";
import { I } from "../../../components/Icons.jsx";
import { GROUPS } from "../../../lib/data.js";

export function RecipientsStep({ selectedGroups, setSelectedGroups, totalRecipients }) {
  return (
    <Panel
      title="Destinatarios"
      subtitle="Selecciona uno o más grupos. Puedes excluir contactos puntuales en el siguiente paso."
    >
      <div className="grid gap-0">
        {GROUPS.map((g, i) => {
          const sel = selectedGroups.includes(g.id);
          return (
            <label
              key={g.id}
              onClick={() =>
                setSelectedGroups(sel ? selectedGroups.filter((x) => x !== g.id) : [...selectedGroups, g.id])
              }
              className="grid items-center cursor-pointer"
              style={{
                gridTemplateColumns: "22px 1fr 120px 120px 120px",
                gap: 14,
                padding: "12px 4px",
                borderTop: i > 0 ? "1px solid var(--border)" : "none",
              }}
            >
              <span
                className="inline-flex items-center justify-center"
                style={{
                  width: 16,
                  height: 16,
                  border: `1.5px solid ${sel ? "var(--ink)" : "var(--muted-2)"}`,
                  background: sel ? "var(--ink)" : "transparent",
                }}
              >
                {sel && <I.check size={11} stroke="#fff" />}
              </span>
              <div>
                <div className="text-[13px] font-medium">{g.name}</div>
                <div className="mono text-[11px] text-muted">{g.id}</div>
              </div>
              <Badge tone="neutral">{g.tag}</Badge>
              <span className="mono text-[13px] text-right">{g.count.toLocaleString("es-PE")}</span>
              <span className="text-xs text-muted text-right">{g.updated}</span>
            </label>
          );
        })}
      </div>
      <div
        className="flex justify-between items-center bg-surface-2"
        style={{ marginTop: 14, padding: "12px 14px", border: "1px solid var(--border)" }}
      >
        <div className="text-[13px]">Destinatarios totales (deduplicados)</div>
        <div className="mono text-lg font-semibold">{totalRecipients.toLocaleString("es-PE")}</div>
      </div>
    </Panel>
  );
}
