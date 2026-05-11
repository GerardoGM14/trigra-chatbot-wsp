// Linear progress bar with trailing percentage.

export function Progress({ value, total, tone = "ink" }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1" style={{ background: "#EFEDE7" }}>
        <div
          className="h-full"
          style={{ width: `${pct}%`, background: tone === "accent" ? "var(--accent)" : "var(--ink)" }}
        />
      </div>
      <span className="mono text-[11px] text-muted text-right" style={{ minWidth: 34 }}>
        {pct}%
      </span>
    </div>
  );
}
