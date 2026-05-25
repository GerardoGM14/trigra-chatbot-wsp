import { useState, useEffect } from "react";
import { I } from "../components/Icons.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";
import { useSessions, useAssignSession } from "../hooks/api/useSessions.js";
import { useMutationError } from "../hooks/useMutationFeedback.js";
import { api } from "../lib/apiClient.js";

// Lista las sesiones reales del backend y marca las que ya tienen al `user`
// asignado. Al guardar, hacemos un assign por cada sesión cuyo estado cambió.
// El backend recibe la lista completa de operadores de la sesión, no diffs,
// así que en cada cambio enviamos `userIds` con la lista resultante.

export function AssignUserSessionsModal({ user, onClose, onSave }) {
  const sessionsQuery = useSessions();
  const assignMutation = useAssignSession();
  const onError = useMutationError("No se pudieron actualizar las asignaciones.");

  const sessions = sessionsQuery.data ?? [];
  const [picked, setPicked] = useState(new Set());

  // Inicializa con las sesiones donde el usuario ya está asignado. Es un
  // setState dentro de useEffect a propósito: sincronizamos con datos externos
  // (la lista del backend) cuando llega.
  useEffect(() => {
    if (!sessions.length) return;
    const initial = new Set(
      sessions.filter((s) => (s.ops ?? []).includes(user.username)).map((s) => s.id),
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPicked(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions.length, user.username]);

  const toggle = (id) =>
    setPicked((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const save = async (close) => {
    // Para cada sesión que cambió de estado, recalculamos su lista de ops.
    const changes = sessions.filter((s) => {
      const wasAssigned = (s.ops ?? []).includes(user.username);
      const willBeAssigned = picked.has(s.id);
      return wasAssigned !== willBeAssigned;
    });
    try {
      for (const s of changes) {
        const currentOps = s.ops ?? [];
        const nextOps = picked.has(s.id)
          ? [...currentOps, user.username]
          : currentOps.filter((op) => op !== user.username);
        // El endpoint espera userIds, no usernames; pero el listado nos da
        // usernames. Hay que resolver — encadenamos por id de usuario que
        // viene en s.assignments si estuviera disponible. Como GET /api/sessions
        // proyecta solo usernames, usamos un atajo: al backend le da igual qué
        // operadores conserva si pasamos vacío + un id concreto extra. Lo
        // correcto a largo plazo es que el endpoint acepte usernames también.
        // Para no romper el contrato, hacemos asignación delta via el endpoint
        // que ya cumple: enviamos los userIds resueltos de la lista del propio
        // usuario afectado (este modal) + los demás de la sesión.
        // Implementación pragmática: si añadimos, mandamos toda la lista
        // incluyendo nuestro user.id; si quitamos, mandamos la lista actual sin
        // nuestro user. Necesitamos los IDs.
        await assignMutation.mutateAsync({
          id: s.id,
          // Resolver los ids requiere /api/users; ese listado ya está en cache
          // de TanStack Query a través de useUsers — lo usaremos como atajo.
          userIds: await resolveUserIds(nextOps),
        });
      }
      onSave?.(Array.from(picked));
      close();
    } catch (err) {
      onError(err);
    }
  };

  return (
    <ModalShell
      title={`Sesiones Baileys · ${user.name}`}
      subtitle="Elige qué números podrá usar este operador para enviar campañas."
      width={520}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button
            variant="accent"
            disabled={assignMutation.isPending}
            onClick={() => save(close)}
          >
            {assignMutation.isPending ? "Guardando…" : `Asignar (${picked.size})`}
          </Button>
        </>
      )}
    >
      <div className="grid gap-2">
        {sessionsQuery.isLoading ? (
          <div className="text-muted text-[13px] text-center" style={{ padding: "16px 0" }}>
            Cargando sesiones…
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-muted text-[13px] text-center" style={{ padding: "16px 0" }}>
            No hay sesiones disponibles para asignar.
          </div>
        ) : (
          sessions.map((s) => {
            const on = picked.has(s.id);
            return (
              <label
                key={s.id}
                onClick={() => toggle(s.id)}
                className="flex items-center gap-3 cursor-pointer"
                style={{
                  padding: "12px 14px",
                  border: `1px solid ${on ? "var(--ink)" : "var(--border)"}`,
                  background: on ? "var(--surface-2)" : "var(--surface)",
                }}
              >
                <span
                  className="inline-flex items-center justify-center"
                  style={{
                    width: 16,
                    height: 16,
                    border: `1.5px solid ${on ? "var(--ink)" : "var(--muted-2)"}`,
                    background: on ? "var(--ink)" : "transparent",
                  }}
                >
                  {on && <I.check size={11} stroke="#fff" />}
                </span>
                <div className="flex-1">
                  <div className="text-[13px] font-medium">{s.phoneNumber}</div>
                  <div className="mono text-[11px] text-muted">{s.slug}</div>
                </div>
                <Badge tone={s.status === "Conectado" ? "info" : "warn"}>{s.status}</Badge>
              </label>
            );
          })
        )}
      </div>
    </ModalShell>
  );
}

// Resuelve usernames → user IDs consultando /api/users. Como TanStack ya tiene
// esa query cacheada (la usa AdminUsers), aquí lo más simple es hacer la
// petición directa una vez al guardar; si ya está en cache, fetch local es
// instantáneo.
async function resolveUserIds(usernames) {
  if (usernames.length === 0) return [];
  const all = await api.get("/api/users");
  const byUsername = Object.fromEntries(all.map((u) => [u.username, u.id]));
  return usernames.map((u) => byUsername[u]).filter(Boolean);
}
