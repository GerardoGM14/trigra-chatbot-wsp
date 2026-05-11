// KPI tile. `trend` accepts strings like "+12,4%" or "−3pp" and colors green/red.

export function Stat({ label, value, sub, trend, mono = true }) {
  return (
    <div className="px-5 py-[18px] bg-surface border border-border">
      <div className="text-[11px] font-medium uppercase text-muted" style={{ letterSpacing: "0.04em" }}>
        {label}
      </div>
      <div className="flex items-baseline gap-2.5 mt-2">
        <div className={mono ? "mono" : ""} style={{ fontSize: 30, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1 }}>
          {value}
        </div>
        {trend && (
          <span
            className="mono text-[11px]"
            style={{ color: trend.startsWith("+") ? "#1A6B45" : trend.startsWith("−") ? "var(--danger)" : "var(--muted)" }}
          >
            {trend}
          </span>
        )}
      </div>
      {sub && <div className="text-xs text-muted mt-2">{sub}</div>}
    </div>
  );
}
