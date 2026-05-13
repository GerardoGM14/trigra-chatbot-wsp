import { Field } from "../../../components/ui/Field.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { Panel } from "../../../components/ui/Panel.jsx";
import { I } from "../../../components/Icons.jsx";

const MODES = [
  { k: "now", t: "Enviar ahora", d: "Inicia en cuanto confirmes" },
  { k: "schedule", t: "Programar", d: "Fecha y hora específica" },
  { k: "recurring", t: "Recurrente", d: "Diario, semanal o mensual" },
];

export function ScheduleStep({ whenMode, setWhenMode }) {
  return (
    <Panel title="Programación de envío">
      <div className="grid gap-3.5">
        <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          {MODES.map((o) => (
            <button
              key={o.k}
              onClick={() => setWhenMode(o.k)}
              className="text-left cursor-pointer"
              style={{
                padding: "12px 14px",
                border: `1px solid ${whenMode === o.k ? "var(--ink)" : "var(--border-strong)"}`,
                background: whenMode === o.k ? "var(--surface-2)" : "var(--surface)",
              }}
            >
              <div className="text-[13px] font-medium">{o.t}</div>
              <div className="text-[11px] text-muted mt-1">{o.d}</div>
            </button>
          ))}
        </div>

        {whenMode === "schedule" && (
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Field label="Fecha"><Input value="12/05/2026" icon={<I.cal size={14} />} /></Field>
            <Field label="Hora (UTC−5)"><Input value="09:00" icon={<I.clock size={14} />} /></Field>
          </div>
        )}
        {whenMode === "recurring" && (
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <Field label="Frecuencia"><Input value="Cada lunes" /></Field>
            <Field label="Hora"><Input value="09:00" /></Field>
            <Field label="Termina"><Input value="Sin fecha de fin" /></Field>
          </div>
        )}

        <div className="bg-surface-2" style={{ padding: "12px 14px", border: "1px solid var(--border)" }}>
          <div className="text-[11px] text-muted uppercase" style={{ letterSpacing: "0.04em" }}>Velocidad estimada</div>
          <div className="flex items-baseline gap-3.5 mt-1.5">
            <span className="mono" style={{ fontSize: 22, fontWeight: 500 }}>~ 57 min</span>
            <span className="text-xs text-muted">3.420 mensajes · 60 msj/min · 3 sesiones activas</span>
          </div>
        </div>
      </div>
    </Panel>
  );
}
