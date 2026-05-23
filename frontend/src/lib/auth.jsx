// AuthContext real, hablando con /auth/login del backend.
//
// El token JWT vive en localStorage (apiClient lo lee al adjuntar headers).
// Al montar, intentamos rehidratar la sesión consultando /auth/me con el token
// guardado; si el backend lo rechaza, limpiamos y mostramos /login.
//
// Mapeo de roles:
//   backend `Administrador` o `Supervisor` → frontend `admin` (área /a/*)
//   backend `Operador`                     → frontend `user`  (área /u/*)
/* eslint-disable react-refresh/only-export-components -- provider + hook colocated by design */

import { createContext, useContext, useEffect, useState } from "react";
import { api, setToken, clearToken } from "./apiClient.js";

const AuthContext = createContext(null);

// Convierte el rol que viene del backend (string del enum) al que usa el frontend.
function toFrontendRole(backendRole) {
  return backendRole === "Operador" ? "user" : "admin";
}

// Normaliza la forma del usuario que viene del backend para que las pantallas
// puedan consumir { role, name, label, ... } sin pensar en el shape original.
function normalizeUser(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    username: raw.username,
    name: raw.name,
    email: raw.email,
    label: raw.role,          // texto bonito ("Administrador", "Operador", ...)
    backendRole: raw.role,    // valor del enum por si alguna pantalla lo necesita
    role: toFrontendRole(raw.role),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `ready` = ya intentamos rehidratar la sesión. Las rutas protegidas esperan
  // este flag para no mostrar /login fugazmente al recargar.
  const [ready, setReady] = useState(false);

  // Rehidratación al montar: si hay token, lo validamos contra /auth/me.
  useEffect(() => {
    let cancelled = false;
    async function rehydrate() {
      try {
        const stored = localStorage.getItem("wsp-control.token");
        if (!stored) {
          if (!cancelled) setReady(true);
          return;
        }
        // /auth/me devuelve { user: { sub, username, role } } desde el JWT.
        // Para tener nombre/email completo pedimos /api/users/:id.
        const { user: tokenUser } = await api.get("/auth/me");
        const full = await api.get(`/api/users/${tokenUser.sub}`);
        if (!cancelled) setUser(normalizeUser(full));
      } catch {
        // Token inválido/expirado o backend caído — limpiamos y seguimos.
        clearToken();
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    rehydrate();
    return () => { cancelled = true; };
  }, []);

  // Listener del evento global que dispara apiClient al recibir 401.
  useEffect(() => {
    const onExpired = () => {
      clearToken();
      setUser(null);
    };
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  const login = async (username, password) => {
    const { token, user: rawUser } = await api.post("/auth/login", { username, password });
    setToken(token);
    setUser(normalizeUser(rawUser));
    return normalizeUser(rawUser);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
