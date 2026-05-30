// Root: router + auth + toast + react-query providers + global theme picker.

import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./lib/auth.jsx";
import { ToastProvider } from "./lib/toast.jsx";
import { queryClient } from "./lib/queryClient.js";
import { useTheme } from "./hooks/useTheme.js";
import { useAnalytics } from "./hooks/useAnalytics.js";
import { useRealtimeUpdates } from "./hooks/useRealtimeUpdates.js";
import { Shell } from "./components/shell";
import { ThemePicker } from "./components/ThemePicker.jsx";
import { LoginScreen } from "./screens/auth/LoginScreen.jsx";
import { AdminOverview, AdminUsers, AdminActivity, AdminSettings, AdminFlows } from "./screens/admin";
import {
  UserSessions,
  UserInbox,
  CampaignsRoute,
  UserContacts,
  UserTemplates,
  UserSchedule,
  UserReports,
} from "./screens/user";

// Gate que requiere usuario con el rol esperado. Mientras AuthProvider rehidrata
// (lee localStorage + valida /auth/me), `ready` es false y mostramos un splash
// suave en lugar de redirigir a /login (evita el flash de login al recargar).
function RequireRole({ role, children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  // Conectamos el realtime solo cuando hay usuario; el hook es idempotente y
  // se desconecta al desmontar.
  useRealtimeUpdates();
  if (!ready) return <BootScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.role !== role) return <Navigate to={user.role === "admin" ? "/a" : "/u"} replace />;
  return children;
}

function BootScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center text-muted text-[13px]"
      style={{ background: "var(--bg)" }}
    >
      Cargando sesión…
    </div>
  );
}

function AppRoutes() {
  const { user, ready } = useAuth();
  useAnalytics();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          // Si ya hay sesión activa, /login redirige al área del rol.
          ready && user ? <Navigate to={user.role === "admin" ? "/a" : "/u"} replace /> : <LoginScreen />
        }
      />

      <Route
        path="/a"
        element={
          <RequireRole role="admin">
            <Shell />
          </RequireRole>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="flows" element={<AdminFlows />} />
        <Route path="activity" element={<AdminActivity />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route
        path="/u"
        element={
          <RequireRole role="user">
            <Shell />
          </RequireRole>
        }
      >
        <Route index element={<UserSessions />} />
        <Route path="inbox" element={<UserInbox />} />
        <Route path="campaigns" element={<CampaignsRoute />} />
        <Route path="contacts" element={<UserContacts />} />
        <Route path="templates" element={<UserTemplates />} />
        <Route path="schedule" element={<UserSchedule />} />
        <Route path="reports" element={<UserReports />} />
      </Route>

      <Route
        path="*"
        element={
          ready ? (
            <Navigate to={user ? (user.role === "admin" ? "/a" : "/u") : "/login"} replace />
          ) : (
            <BootScreen />
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  const [theme, setTheme] = useTheme();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
            <ThemePicker theme={theme} setTheme={setTheme} />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
