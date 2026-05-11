// Avatar — initials over a hue derived deterministically from the name, so
// the same person always gets the same color.

export function Avatar({ name, size = 28 }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return (
    <span
      className="inline-flex items-center justify-center font-semibold"
      style={{
        width: size,
        height: size,
        background: `oklch(0.88 0.04 ${h})`,
        color: "var(--ink)",
        fontSize: size * 0.38,
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </span>
  );
}
