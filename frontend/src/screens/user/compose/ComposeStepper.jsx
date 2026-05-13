import { I } from "../../../components/Icons.jsx";

const STEPS = [
  { n: 1, t: "Detalles" },
  { n: 2, t: "Mensaje" },
  { n: 3, t: "Destinatarios" },
  { n: 4, t: "Programación" },
  { n: 5, t: "Revisar" },
];

export function ComposeStepper({ step, onStep }) {
  return (
    <div className="flex bg-surface" style={{ border: "1px solid var(--border)" }}>
      {STEPS.map((s, i, arr) => (
        <button
          key={s.n}
          onClick={() => onStep(s.n)}
          className="flex-1 flex items-center gap-3 text-left cursor-pointer"
          style={{
            padding: "14px 18px",
            border: "none",
            borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none",
            background: step === s.n ? "var(--surface-2)" : "transparent",
          }}
        >
          <span
            className="mono inline-flex items-center justify-center text-[11px]"
            style={{
              width: 24,
              height: 24,
              border: `1px solid ${step >= s.n ? "var(--ink)" : "var(--border-strong)"}`,
              background: step > s.n ? "var(--ink)" : "transparent",
              color: step > s.n ? "#fff" : step === s.n ? "var(--ink)" : "var(--muted)",
            }}
          >
            {step > s.n ? <I.check size={12} stroke="#fff" /> : String(s.n).padStart(2, "0")}
          </span>
          <span
            className="text-[13px]"
            style={{ fontWeight: step === s.n ? 600 : 500, color: step >= s.n ? "var(--ink)" : "var(--muted)" }}
          >
            {s.t}
          </span>
        </button>
      ))}
    </div>
  );
}
