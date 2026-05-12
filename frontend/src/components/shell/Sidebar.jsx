import { NavLink } from "react-router-dom";

// Dark left rail: brand block + role-aware nav + Baileys status card at the
// bottom. Pure presentational — nav items are passed in.

export function Sidebar({ isAdmin, nav }) {
  return (
    <aside
      className="flex flex-col"
      style={{ borderRight: "1px solid #0A0A09", background: "#15140F", color: "#E8E5DE" }}
    >
      <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid #2A2823" }}>
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex items-center justify-center text-white"
            style={{ width: 28, height: 28, background: "var(--accent)" }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 3h12v8H6l-4 3z" stroke="#fff" strokeWidth="1.5" />
            </svg>
          </span>
          <div>
            <div className="text-[13px] font-semibold" style={{ letterSpacing: "-0.005em", color: "#F4F1EA" }}>
              Mensajería
            </div>
            <div className="mono text-[10px]" style={{ color: "#8A8780" }}>
              WSP Control
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "14px 14px 4px" }}>
        <div
          className="text-[10px] font-medium uppercase"
          style={{ color: "#8A8780", letterSpacing: "0.06em", padding: "0 6px 8px" }}
        >
          {isAdmin ? "Administración" : "Operación"}
        </div>
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className="flex items-center gap-2.5 w-full text-left text-[13px]"
            style={({ isActive }) => ({
              padding: "9px 10px",
              border: "none",
              cursor: "pointer",
              fontWeight: isActive ? 600 : 500,
              background: isActive ? "#26241F" : "transparent",
              color: isActive ? "#F4F1EA" : "#B8B5AD",
              borderLeft: `2px solid ${isActive ? "var(--accent)" : "transparent"}`,
              marginBottom: 1,
              textDecoration: "none",
            })}
          >
            {n.i}
            <span>{n.l}</span>
          </NavLink>
        ))}
      </div>

      <div style={{ padding: "14px", marginTop: "auto" }}>
        <div style={{ padding: 14, background: "#1F1D19", border: "1px solid #2A2823" }}>
          <div
            className="text-[11px] font-medium uppercase"
            style={{ color: "#8A8780", letterSpacing: "0.04em" }}
          >
            Sesiones Baileys
          </div>
          <div className="flex items-baseline gap-1.5" style={{ marginTop: 6 }}>
            <span className="mono" style={{ fontSize: 20, fontWeight: 500, color: "#F4F1EA" }}>
              3
            </span>
            <span className="text-[11px]" style={{ color: "#8A8780" }}>
              de 3 conectadas
            </span>
          </div>
          <div className="flex gap-[3px]" style={{ marginTop: 8 }}>
            {[1, 1, 1].map((v, i) => (
              <span key={i} style={{ flex: 1, height: 4, background: v ? "var(--accent)" : "#363330" }} />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
