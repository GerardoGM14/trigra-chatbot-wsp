// Floating dark tooltip used by Sparkline + Bars on hover.

export function ChartTooltip({ x, y, label, value }) {
  return (
    <div
      className="absolute pointer-events-none bg-ink text-white whitespace-nowrap z-[5]"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -100%) translateY(-8px)",
        padding: "6px 9px",
        border: "1px solid var(--ink)",
      }}
    >
      <div className="mono text-[10px] uppercase" style={{ opacity: 0.7, letterSpacing: "0.04em" }}>
        {label}
      </div>
      <div className="mono text-xs font-semibold mt-0.5">{value}</div>
    </div>
  );
}
