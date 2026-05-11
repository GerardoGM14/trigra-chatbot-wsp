// Small label pill. Tones: neutral, accent, info, warn, danger, ok.

const TONES = {
  neutral: { bg: "#EFEDE7", fg: "var(--ink-2)" },
  accent: { bg: "var(--accent-soft)", fg: "#7A2B10" },
  info: { bg: "var(--info-soft)", fg: "var(--info)" },
  warn: { bg: "var(--warn-soft)", fg: "#6E4A0E" },
  danger: { bg: "var(--danger-soft)", fg: "var(--danger)" },
  ok: { bg: "#E5E2DC", fg: "var(--ink-2)" },
};

export function Badge({ tone = "neutral", children, style }) {
  const t = TONES[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-medium whitespace-nowrap"
      style={{ padding: "2px 8px", background: t.bg, color: t.fg, letterSpacing: "0.01em", ...style }}
    >
      {children}
    </span>
  );
}
