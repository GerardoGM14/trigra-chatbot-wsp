// Deterministic pseudo-random QR-ish matrix. Used by the Baileys wizard and
// the per-session QR modal. The seed is just an int; the same seed always
// renders the same pattern, so we can simulate "refresh" by bumping it.

function qrMatrix(seed = 0, n = 29) {
  const m = [];
  let s = seed || 1;
  const r = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let y = 0; y < n; y++) {
    m.push([]);
    for (let x = 0; x < n; x++) m[y].push(r() > 0.5 ? 1 : 0);
  }
  // Finder patterns (corners) so it reads as a QR at a glance.
  const stamp = (ox, oy) => {
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 7; x++) {
        const edge = x === 0 || y === 0 || x === 6 || y === 6;
        const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        m[oy + y][ox + x] = edge || inner ? 1 : 0;
      }
  };
  stamp(0, 0);
  stamp(n - 7, 0);
  stamp(0, n - 7);
  return m;
}

export function FakeQR({ seed, size = 240 }) {
  const n = 29;
  const cell = size / n;
  const m = qrMatrix(seed, n);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block" style={{ background: "#fff" }}>
      <rect width={size} height={size} fill="#fff" />
      {m.map((row, y) =>
        row.map((v, x) =>
          v ? <rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill="#15140F" /> : null,
        ),
      )}
    </svg>
  );
}
