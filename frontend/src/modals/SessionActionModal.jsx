import { useState } from "react";
import { I } from "../components/Icons.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Field } from "../components/ui/Field.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Select } from "../components/ui/Select.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { Stat } from "../components/ui/Stat.jsx";
import { Avatar } from "../components/ui/Avatar.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";
import { FakeQR } from "../screens/shared/FakeQR.jsx";
import { ALL_OPERATORS } from "../lib/data.js";

// Five different actions, all rooted on the same "session". Each sub-component
// is its own modal — we just route based on `action`. Keeping them in one file
// because they all share the (action, session, onClose, onApply) contract.

export function SessionActionModal({ action, session, onClose, onApply }) {
  if (!action || !session) return null;
  if (action === "assign") return <Assign session={session} onClose={onClose} onApply={onApply} />;
  if (action === "exclusive") return <Exclusive session={session} onClose={onClose} onApply={onApply} />;
  if (action === "restart") return <Restart session={session} onClose={onClose} onApply={onApply} />;
  if (action === "qr") return <QrView session={session} onClose={onClose} />;
  if (action === "unlink") return <Unlink session={session} onClose={onClose} onApply={onApply} />;
  return null;
}

function Assign({ session, onClose, onApply }) {
  const [picked, setPicked] = useState(session.ops || []);
  const [search, setSearch] = useState("");
  const toggle = (u) => setPicked((p) => (p.includes(u) ? p.filter((x) => x !== u) : [...p, u]));
  const visible = ALL_OPERATORS.filter(
    (o) => !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.u.includes(search.toLowerCase()),
  );
  return (
    <ModalShell
      title={`Asignar operadores · ${session.id}`}
      subtitle={`Selecciona quién puede usar ${session.num} para enviar campañas.`}
      width={620}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button variant="accent" onClick={() => { onApply({ ops: picked }); close(); }}>
            Guardar ({picked.length})
          </Button>
        </>
      )}
    >
      <div className="grid gap-3">
        <Input
          placeholder="Buscar por nombre o usuario…"
          icon={<I.search size={14} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ border: "1px solid var(--border)", maxHeight: 340, overflow: "auto" }}>
          {visible.map((op, i) => {
            const on = picked.includes(op.u);
            return (
              <label
                key={op.u}
                className="grid items-center cursor-pointer"
                style={{
                  gridTemplateColumns: "24px 1fr 100px 80px",
                  gap: 10,
                  padding: "10px 14px",
                  borderTop: i > 0 ? "1px solid var(--border)" : "none",
                  background: on ? "var(--accent-soft)" : "transparent",
                }}
              >
                <input type="checkbox" checked={on} onChange={() => toggle(op.u)} />
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={op.u} size={26} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium">{op.name}</div>
                    <div className="mono text-[11px] text-muted">{op.u}</div>
                  </div>
                </div>
                <Badge tone={op.role === "Supervisor" ? "accent" : "neutral"}>{op.role}</Badge>
                <span className="mono text-xs text-muted text-right">{op.campaigns} camp.</span>
              </label>
            );
          })}
        </div>
        <div
          className="text-xs"
          style={{ padding: "10px 12px", background: "var(--info-soft)", borderLeft: "2px solid var(--info)", color: "var(--ink-2)" }}
        >
          Los envíos se reparten en cola entre los operadores asignados, respetando el límite de velocidad de la
          sesión.
        </div>
      </div>
    </ModalShell>
  );
}

function Exclusive({ session, onClose, onApply }) {
  const [exclusive, setExclusive] = useState(false);
  const [owner, setOwner] = useState((session.ops && session.ops[0]) || "maria.q");
  return (
    <ModalShell
      title={`Modo exclusivo · ${session.id}`}
      subtitle="En modo exclusivo solo un operador puede enviar mensajes desde esta sesión."
      width={560}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button variant="primary" onClick={() => { onApply({ exclusive, owner }); close(); }}>Aplicar</Button>
        </>
      )}
    >
      <div className="grid gap-3.5">
        <label
          className="flex items-center justify-between cursor-pointer bg-surface-2"
          style={{ padding: "14px 16px", border: "1px solid var(--border)" }}
          onClick={() => setExclusive(!exclusive)}
        >
          <div>
            <div className="text-[13px] font-semibold">Activar modo exclusivo</div>
            <div className="text-xs text-muted mt-1">
              La sesión queda bloqueada para los demás operadores asignados.
            </div>
          </div>
          <span
            className="relative transition-colors"
            style={{ width: 32, height: 18, background: exclusive ? "var(--accent)" : "var(--border-strong)" }}
          >
            <span
              className="absolute transition-all"
              style={{ top: 2, left: exclusive ? 16 : 2, width: 14, height: 14, background: "#FFF" }}
            />
          </span>
        </label>
        {exclusive && (
          <Field label="Operador con acceso exclusivo" hint="Solo este usuario podrá enviar desde la sesión.">
            <Select value={owner} onChange={(e) => setOwner(e.target.value)}>
              {ALL_OPERATORS.map((o) => (
                <option key={o.u} value={o.u}>{o.name} · @{o.u}</option>
              ))}
            </Select>
          </Field>
        )}
        <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          <Stat label="Velocidad reservada" value="60 msj/min" sub="100% del cupo" />
          <Stat label="Cola compartida" value={exclusive ? "No" : "Sí"} sub={exclusive ? "exclusivo" : "compartida"} />
          <Stat label="Auditoría" value="Activa" sub="cada envío firmado" />
        </div>
      </div>
    </ModalShell>
  );
}

function Restart({ session, onClose, onApply }) {
  return (
    <ModalShell
      title={`Reiniciar sesión · ${session.id}`}
      subtitle={`Esto cerrará la conexión actual con ${session.num} y volverá a iniciar.`}
      width={520}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button variant="primary" onClick={() => { onApply({}); close(); }} icon={<I.refresh size={12} />}>
            Reiniciar ahora
          </Button>
        </>
      )}
    >
      <div className="grid gap-3.5">
        <div
          className="text-xs"
          style={{ padding: "10px 12px", background: "var(--warn-soft)", borderLeft: "2px solid var(--warn)", color: "var(--ink-2)" }}
        >
          Los envíos en curso se pondrán en pausa por unos segundos. Las campañas activas continuarán al reconectar.
        </div>
        <div className="grid gap-2.5" style={{ gridTemplateColumns: "1fr 1fr", padding: 14, border: "1px solid var(--border)" }}>
          <RestartStat label="Mensajes en cola" value="12" mono />
          <RestartStat label="Operadores afectados" value={session.ops.length} mono />
          <RestartStat label="Tiempo estimado" value="~ 3 segundos" />
          <RestartStat label="Reintento" value="Automático" />
        </div>
      </div>
    </ModalShell>
  );
}

function RestartStat({ label, value, mono }) {
  return (
    <div>
      <div className="text-[10px] text-muted uppercase" style={{ letterSpacing: "0.04em" }}>{label}</div>
      <div className={`${mono ? "mono" : ""} text-[13px] mt-1`}>{value}</div>
    </div>
  );
}

function QrView({ session, onClose }) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 9999));
  return (
    <ModalShell
      title={`Código QR · ${session.id}`}
      subtitle={`Vuelve a vincular ${session.num} si la sesión se cerró en el teléfono.`}
      width={520}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cerrar</Button>
          <Button variant="primary" icon={<I.refresh size={12} />} onClick={() => setSeed(Math.floor(Math.random() * 9999))}>
            Regenerar QR
          </Button>
        </>
      )}
    >
      <div className="grid items-center gap-[18px]" style={{ gridTemplateColumns: "220px 1fr" }}>
        <div className="p-1.5" style={{ border: "1px solid var(--border-strong)", background: "#fff" }}>
          <FakeQR seed={seed} size={208} />
        </div>
        <div className="grid gap-2.5 text-[13px]">
          <div>1. Abre WSP en el teléfono del número <span className="mono">{session.num}</span>.</div>
          <div>2. Menú · Dispositivos vinculados · Vincular un dispositivo.</div>
          <div>3. Escanea este código.</div>
          <div className="mono text-[11px] text-muted mt-1.5">El QR se renueva automáticamente cada 45 s.</div>
        </div>
      </div>
    </ModalShell>
  );
}

function Unlink({ session, onClose, onApply }) {
  const [confirmText, setConfirm] = useState("");
  return (
    <ModalShell
      title={`Desvincular sesión · ${session.id}`}
      subtitle="Esta acción cerrará la conexión y desasignará a todos los operadores."
      width={520}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={() => { onApply({}); close(); }}
            disabled={confirmText !== session.id}
          >
            Desvincular sesión
          </Button>
        </>
      )}
    >
      <div className="grid gap-3.5">
        <div
          className="text-xs"
          style={{ padding: "10px 12px", background: "var(--danger-soft)", borderLeft: "2px solid var(--danger)", color: "var(--ink-2)" }}
        >
          <strong>Atención.</strong> Las campañas programadas en esta sesión se pausarán hasta que la asignes a otra.
          Esta acción no se puede deshacer desde este panel.
        </div>
        <div className="grid gap-1.5 text-[13px]">
          <div>Operadores que perderán acceso a {session.num}:</div>
          <div className="flex gap-1.5 flex-wrap">
            {session.ops.map((op) => (
              <span
                key={op}
                className="mono text-[11px]"
                style={{ padding: "2px 8px", border: "1px solid var(--border)", background: "var(--surface-2)" }}
              >
                @{op}
              </span>
            ))}
            {session.ops.length === 0 && <span className="text-muted text-xs">— ninguno —</span>}
          </div>
        </div>
        <Field label={`Escribe ${session.id} para confirmar`}>
          <Input value={confirmText} onChange={(e) => setConfirm(e.target.value)} placeholder={session.id} />
        </Field>
      </div>
    </ModalShell>
  );
}
