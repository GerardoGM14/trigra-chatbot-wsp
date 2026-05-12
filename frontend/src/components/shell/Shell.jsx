import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/auth.jsx";
import { Sidebar } from "./Sidebar.jsx";
import { Topbar } from "./Topbar.jsx";
import { RouteProgressBar } from "./RouteProgressBar.jsx";
import { ADMIN_NAV, USER_NAV } from "./navItems.jsx";

// App shell — grid with the sidebar on the left and the route body on the
// right. The body is keyed by pathname so each route transition replays the
// enter animation.

export function Shell() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const nav = isAdmin ? ADMIN_NAV : USER_NAV;

  return (
    <div className="grid h-screen overflow-hidden" style={{ gridTemplateColumns: "232px 1fr" }}>
      <RouteProgressBar />
      <Sidebar isAdmin={isAdmin} nav={nav} />
      <main className="flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
        <Topbar />
        <RouteBody />
      </main>
    </div>
  );
}

function RouteBody() {
  const location = useLocation();
  return (
    <div
      key={location.pathname}
      className="route-enter flex-1 overflow-y-auto overflow-x-hidden"
      style={{ padding: "24px 32px 56px" }}
    >
      <Outlet />
    </div>
  );
}
