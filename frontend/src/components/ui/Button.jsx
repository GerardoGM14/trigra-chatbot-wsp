// Flat bordered button. Variants: primary, accent, default, ghost, danger.
// Sizes: sm, md, lg. `active` overrides to the inked look (used by tabs).
// Renamed from <Btn> → <Button> in the refactor; old name re-exported below
// for any straggler imports, remove once the codebase is clean.

const SIZES = {
  sm: { padding: "6px 10px", fontSize: 12, height: 28 },
  md: { padding: "8px 14px", fontSize: 13, height: 34 },
  lg: { padding: "10px 18px", fontSize: 14, height: 40 },
};

const VARIANTS = {
  primary: { background: "var(--ink)", color: "#fff", border: "1px solid var(--ink)" },
  accent: { background: "var(--accent)", color: "#fff", border: "1px solid var(--accent)" },
  default: { background: "var(--surface)", color: "var(--ink)", border: "1px solid var(--border-strong)" },
  ghost: { background: "transparent", color: "var(--ink)", border: "1px solid transparent" },
  danger: { background: "var(--surface)", color: "var(--danger)", border: "1px solid var(--border-strong)" },
};

export function Button({
  variant = "default", size = "md", icon, children, onClick,
  active, disabled, style, type = "button", title,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="inline-flex items-center gap-2 font-medium rounded-none transition-colors"
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        letterSpacing: "-0.005em",
        ...VARIANTS[variant],
        ...SIZES[size],
        ...(active ? { background: "var(--ink)", color: "#fff", borderColor: "var(--ink)" } : {}),
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

// Legacy alias — kept until every screen migrates to <Button>.
export { Button as Btn };
