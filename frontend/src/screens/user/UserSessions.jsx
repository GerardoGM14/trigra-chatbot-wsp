import { useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Panel } from "../../components/ui/Panel.jsx";
import { Stat } from "../../components/ui/Stat.jsx";
import { I } from "../../components/Icons.jsx";
import { BaileysWizard } from "../../modals";

// Operator → "Mis sesiones". Lista de números vinculados + wizard para añadir
// uno nuevo. El primer item viene precargado para que la demo no esté vacía.

const INITIAL_SESSIONS = [
  {
    id: "sess_owner_01",
    num: "+51 999 412 220",
    status: "Conectado",
    quality: "Alta",
    battery: 84,
    since: "02:14:08",
    platform: "Android",
    primary: true,
  },
];

const STEPS = [
  { n: 1, t: "Abre WSP en tu teléfono", d: "Toca el menú · Dispositivos vinculados · Vincular un dispositivo." },
  { n: 2, t: "Escanea el código QR", d: "Apunta la cámara al QR que generaremos en el siguiente paso." },
  { n: 3, t: "Listo para enviar", d: "Tu sesión queda disponible para crear y disparar campañas." },
];

export function UserSessions() {
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [showWizard, setShowWizard] = useState(false);
  const addSession = (s) => setSessions((list) => [...list, s]);

  return (
    <div className="route-enter grid gap-4">
      <Header onLink={() => setShowWizard(true)} />
      <KpiRow sessions={sessions} />
      <ActiveSessionsPanel sessions={sessions} setSessions={setSessions} onLink={() => setShowWizard(true)} />
      <HowItWorksPanel />

      {showWizard && (
        <BaileysWizard
          onClose={() => setShowWizard(false)}
          onConnect={(s) => { addSession(s); setShowWizard(false); }}
        />
      )}
    </div>
  );
}

function Header({ onLink }) {
  return (
    <div className="flex justify-between items-end">
      <div>
        <h2 className="m-0 text-[22px] font-semibold" style={{ letterSpacing: "-0.02em" }}>Mis sesiones</h2>
        <p className="mt-1 mb-0 text-muted text-[13px]">
          Conecta tu número de WSP escaneando un código QR desde tu teléfono. Cada sesión envía mensajes en paralelo.
        </p>
      </div>
      <Button variant="accent" icon={<I.plus size={14} />} onClick={onLink}>
        Vincular nueva sesión
      </Button>
    </div>
  );
}

function KpiRow({ sessions }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
      <Stat
        label="Sesiones vinculadas"
        value={String(sessions.length).padStart(2, "0")}
        sub={`${sessions.filter((s) => s.status === "Conectado").length} conectadas`}
      />
      <Stat label="Velocidad combinada" value={`${sessions.length * 60} msj/min`} sub="60 msj/min por sesión" />
      <Stat label="Mensajes hoy" value="12.480" sub="Tasa de entrega 98,3%" trend="+8,2%" />
      <Stat label="Última conexión" value={sessions[0]?.since || "—"} sub={sessions[0]?.num || "—"} mono />
    </div>
  );
}

function ActiveSessionsPanel({ sessions, setSessions, onLink }) {
  return (
    <Panel title="Sesiones activas" subtitle="Cada sesión equivale a un número de WSP independiente.">
      <div className="grid gap-0">
        {sessions.map((s, i) => (
          <SessionRow key={s.id} session={s} index={i} setSessions={setSessions} />
        ))}
        {sessions.length === 0 && <EmptyState onLink={onLink} />}
      </div>
    </Panel>
  );
}

function SessionRow({ session, index, setSessions }) {
  const restart = () => {
    setSessions((list) =>
      list.map((x) => (x.id === session.id ? { ...x, status: "Reconectando", since: "00:00:04" } : x)),
    );
    setTimeout(
      () =>
        setSessions((list) =>
          list.map((x) => (x.id === session.id ? { ...x, status: "Conectado", since: "00:00:12" } : x)),
        ),
      1400,
    );
  };
  const disconnect = () => {
    if (confirm(`¿Desconectar ${session.num}? Tendrás que volver a escanear el QR.`)) {
      setSessions((list) => list.filter((x) => x.id !== session.id));
    }
  };
  return (
    <div
      className="grid items-center"
      style={{
        gridTemplateColumns: "40px 1fr 120px 120px 120px 130px",
        gap: 14,
        padding: "14px 0",
        borderTop: index > 0 ? "1px solid var(--border)" : "none",
      }}
    >
      <div
        className="flex items-center justify-center bg-surface-2"
        style={{ width: 36, height: 36, border: "1px solid var(--border-strong)" }}
      >
        <I.link size={16} />
      </div>
      <div>
        <div className="text-[13px] font-semibold">
          {session.num}{" "}
          {session.primary && <Badge tone="accent" style={{ marginLeft: 6 }}>Principal</Badge>}
        </div>
        <div className="mono text-[11px] text-muted mt-0.5">
          {session.id} · {session.platform}
        </div>
      </div>
      <Badge tone={session.status === "Conectado" ? "info" : session.status === "Reconectando" ? "warn" : "danger"}>
        <span
          className={session.status === "Reconectando" ? "pulse" : ""}
          style={{ width: 6, height: 6, background: "currentColor", display: "inline-block" }}
        />
        {session.status}
      </Badge>
      <div className="text-xs text-muted">
        Calidad <span className="text-ink">{session.quality}</span>
      </div>
      <div className="mono text-xs text-muted">uptime {session.since}</div>
      <div className="flex gap-1.5 justify-end">
        <Button size="sm" variant="ghost" icon={<I.refresh size={12} />} onClick={restart}>Reiniciar</Button>
        <Button size="sm" variant="ghost" icon={<I.x size={12} />} onClick={disconnect}>Desconectar</Button>
      </div>
    </div>
  );
}

function EmptyState({ onLink }) {
  return (
    <div className="text-center text-muted" style={{ padding: "40px 20px" }}>
      <div className="text-[13px]">No tienes sesiones vinculadas todavía.</div>
      <div className="mt-2.5">
        <Button variant="accent" icon={<I.plus size={14} />} onClick={onLink}>
          Vincular primera sesión
        </Button>
      </div>
    </div>
  );
}

function HowItWorksPanel() {
  return (
    <Panel title="Cómo funciona la vinculación" subtitle="Tu número se conecta vía Baileys, igual que WSP Web.">
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {STEPS.map((s) => (
          <div key={s.n} className="bg-surface-2" style={{ padding: "14px 16px", border: "1px solid var(--border)" }}>
            <span className="mono text-[11px] text-muted">0{s.n}</span>
            <div className="text-sm font-semibold mt-1.5">{s.t}</div>
            <div className="text-xs text-muted mt-1.5" style={{ lineHeight: 1.5 }}>
              {s.d}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
