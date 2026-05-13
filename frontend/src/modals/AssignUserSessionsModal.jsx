import { useState } from "react";
import { I } from "../components/Icons.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";

// Hardcoded list of available sessions for the mock. When the backend lands,
// this will be fetched per-user.
const SESSIONS = [
  { id: "session_01", num: "+51 999 412 220" },
  { id: "session_02", num: "+51 998 220 118" },
  { id: "session_03", num: "+51 944 901 412" },
];

export function AssignUserSessionsModal({ user, onClose, onSave }) {
  const [picked, setPicked] = useState([]);
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  return (
    <ModalShell
      title={`Sesiones Baileys · ${user.name}`}
      subtitle="Elige qué números podrá usar este operador para enviar campañas."
      width={520}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button variant="accent" onClick={() => { onSave?.(picked); close(); }}>
            Asignar ({picked.length})
          </Button>
        </>
      )}
    >
      <div className="grid gap-2">
        {SESSIONS.map((s) => {
          const on = picked.includes(s.id);
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
                <div className="text-[13px] font-medium">{s.num}</div>
                <div className="mono text-[11px] text-muted">{s.id}</div>
              </div>
              <Badge tone="info">Conectada</Badge>
            </label>
          );
        })}
      </div>
    </ModalShell>
  );
}
