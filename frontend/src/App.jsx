// Root: router + auth + toast providers + global theme picker.

import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth.jsx";
import { ToastProvider } from "./lib/toast.jsx";
import { useTheme } from "./hooks/useTheme.js";
import { useAnalytics } from "./hooks/useAnalytics.js";
import { Shell } from "./components/shell";
import { ThemePicker } from "./components/ThemePicker.jsx";
import { LoginScreen } from "./screens/auth/LoginScreen.jsx";
import { AdminOverview, AdminUsers, AdminActivity, AdminSettings } from "./screens/admin";
import {
  UserSessions,
  CampaignsRoute,
  UserContacts,
  UserTemplates,
  UserSchedule,
  UserReports,
} from "./screens/user";

// Gate that requires a logged-in user with the expected role. Wrong role
// redirects to that role's home rather than bouncing back to login.
function RequireRole({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.role !== role) return <Navigate to={user.role === "admin" ? "/a" : "/u"} replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  // Dispara page_view en cada cambio de ruta. Solo activa en producción; en
  // dev el track interno descarta los eventos.
  useAnalytics();
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />

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
        <Route path="campaigns" element={<CampaignsRoute />} />
        <Route path="contacts" element={<UserContacts />} />
        <Route path="templates" element={<UserTemplates />} />
        <Route path="schedule" element={<UserSchedule />} />
        <Route path="reports" element={<UserReports />} />
      </Route>

      <Route
        path="*"
        element={<Navigate to={user ? (user.role === "admin" ? "/a" : "/u") : "/login"} replace />}
      />
    </Routes>
  );
}

export default function App() {
  const [theme, setTheme] = useTheme();
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
          <ThemePicker theme={theme} setTheme={setTheme} />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
