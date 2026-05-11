// In-memory auth context. No backend yet — login just stores a role.
// When the API arrives, swap `login` for a real request and persist a token.
/* eslint-disable react-refresh/only-export-components -- provider + hook colocated by design */

import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { role: "admin" | "user", name, label }

  const login = (role) => {
    setUser(
      role === "admin"
        ? { role: "admin", name: "Sergio Admin", label: "Administrador" }
        : { role: "user", name: "María Quispe", label: "Operador" },
    );
  };
  const logout = () => setUser(null);
  // Lets the topbar role switcher preview the other role without re-logging in.
  const switchRole = (role) => login(role);

  return <AuthContext.Provider value={{ user, login, logout, switchRole }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
