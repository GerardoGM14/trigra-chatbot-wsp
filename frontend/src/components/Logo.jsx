// Brand mark — a small speech-bubble glyph in a square.

export function Logo({ background = "var(--ink)", size = 28 }) {
  return (
    <span
      className="inline-flex items-center justify-center text-white"
      style={{ width: size, height: size, background }}
    >
      <svg width={size / 2} height={size / 2} viewBox="0 0 16 16" fill="none">
        <path d="M2 3h12v8H6l-4 3z" stroke="#fff" strokeWidth="1.5" />
      </svg>
    </span>
  );
}
