import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { I } from "../Icons.jsx";
import { Input } from "../ui/Input.jsx";
import { Avatar } from "../ui/Avatar.jsx";
import { useAuth } from "../../lib/auth.jsx";
import { NotificationsModal } from "../../modals/NotificationsModal.jsx";
import { ProfileModal } from "../../modals/ProfileModal.jsx";
import { ROUTE_LABELS } from "./navItems.jsx";

// Breadcrumb + search + role switcher + bell + profile. The bell badge counts
// down to 0 once the user opens the notifications panel.

export function Topbar() {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === "admin";
  const label = ROUTE_LABELS[location.pathname] || "—";

  const [search, setSearch] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unread, setUnread] = useState(4);

  const handleSwitch = (role) => {
    switchRole(role);
    navigate(role === "admin" ? "/a" : "/u");
  };
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const openNotifs = () => {
    setNotifOpen(true);
    setUnread(0);
  };

  return (
    <header
      className="flex items-center gap-3.5"
      style={{ padding: "12px 32px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <nav aria-label="breadcrumb" className="flex items-center gap-2 text-[13px] text-muted">
        <span className="mono text-[11px]">org_</span>
        <span className="text-ink font-medium">empresa-sac</span>
        <span className="text-muted-2">›</span>
        <span>{isAdmin ? "Administración" : "Operación"}</span>
        <span className="text-muted-2">›</span>
        <span key={location.pathname} className="anim-slide-in text-ink font-semibold">
          {label}
        </span>
      </nav>

      <div className="flex-1" style={{ maxWidth: 340, marginLeft: 32 }}>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar contactos, campañas, plantillas…"
          icon={<I.search size={14} />}
        />
      </div>

      <div className="flex-1" />

      <div className="flex bg-surface" style={{ border: "1px solid var(--border-strong)" }}>
        {[
          { k: "admin", l: "Vista Admin" },
          { k: "user", l: "Vista Operador" },
        ].map((o, i) => (
          <button
            key={o.k}
            onClick={() => handleSwitch(o.k)}
            className="text-xs font-medium cursor-pointer"
            style={{
              padding: "6px 12px",
              border: "none",
              borderLeft: i > 0 ? "1px solid var(--border)" : "none",
              background: user?.role === o.k ? "var(--ink)" : "transparent",
              color: user?.role === o.k ? "#fff" : "var(--ink-2)",
            }}
          >
            <span className="inline-flex items-center gap-1.5">
              {o.k === "admin" ? <I.shield size={12} /> : <I.user1 size={12} />}
              {o.l}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={openNotifs}
        title="Notificaciones"
        className="relative border-none bg-transparent cursor-pointer p-1.5"
        style={{ color: "var(--ink)" }}
      >
        <I.bell size={16} />
        {unread > 0 && (
          <span
            className="mono absolute flex items-center justify-center text-white text-[9px] font-semibold"
            style={{
              top: 2,
              right: 0,
              minWidth: 14,
              height: 14,
              padding: "0 4px",
              background: "var(--accent)",
              borderRadius: 999,
            }}
          >
            {unread}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => setProfileOpen(true)}
        className="flex items-center gap-2.5 border-none bg-transparent cursor-pointer"
        style={{ paddingLeft: 14, borderLeft: "1px solid var(--border)", color: "var(--ink)" }}
      >
        <Avatar name={user?.name || "—"} size={28} />
        <div className="text-left">
          <div className="text-[13px] font-medium" style={{ letterSpacing: "-0.005em" }}>
            {user?.name}
          </div>
          <div className="mono text-[10px] text-muted">{user?.label}</div>
        </div>
      </button>
      <button
        onClick={handleLogout}
        title="Cerrar sesión"
        className="border-none bg-transparent cursor-pointer text-muted p-1.5"
      >
        <I.logout size={14} />
      </button>

      {notifOpen && <NotificationsModal onClose={() => setNotifOpen(false)} />}
      {profileOpen && (
        <ProfileModal user={user} onClose={() => setProfileOpen(false)} onLogout={handleLogout} />
      )}
    </header>
  );
}
