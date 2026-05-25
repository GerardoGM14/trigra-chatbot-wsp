import { useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Panel } from "../../components/ui/Panel.jsx";
import { Stat } from "../../components/ui/Stat.jsx";
import { I } from "../../components/Icons.jsx";
import {
  useSessions,
  useRestartSession,
  useDeleteSession,
} from "../../hooks/api/useSessions.js";
import { useAuth } from "../../lib/auth.jsx";
import { useToast } from "../../lib/toast.jsx";
import { useMutationError } from "../../hooks/useMutationFeedback.js";
import { BaileysWizard, ConfirmModal } from "../../modals";

// Operador → "Mis sesiones". Lista solo las sesiones donde el usuario actual
// está asignado (lo determina el backend en una iteración futura; por ahora el
// listado expone todas y filtramos del lado cliente por `user.username`).

const STEPS = [
  { n: 1, t: "Abre WSP en tu teléfono", d: "Toca el menú · Dispositivos vinculados · Vincular un dispositivo." },
  { n: 2, t: "Escanea el código QR", d: "Apunta la cámara al QR que generaremos en el siguiente paso." },
  { n: 3, t: "Listo para enviar", d: "Tu sesión queda disponible para crear y disparar campañas." },
];

export function UserSessions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const onMutationError = useMutationError();

  const sessionsQuery = useSessions();
  const restartMutation = useRestartSession();
  const deleteMutation = useDeleteSession();

  const [showWizard, setShowWizard] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const allSessions = sessionsQuery.data ?? [];
  const mySessions = allSessions.filter((s) => (s.ops ?? []).includes(user?.username));

  return (
    <div className="route-enter grid gap-4">
      <Header onLink={() => setShowWizard(true)} />

      {sessionsQuery.isLoading ? (
        <div className="text-muted text-[13px] text-center bg-surface" style={{ padding: 32, border: "1px solid var(--border)" }}>
          Cargando sesiones…
        </div>
      ) : sessionsQuery.isError ? (
        <div className="text-center bg-surface" style={{ padding: 32, border: "1px solid var(--border)" }}>
          <div className="text-[13px] text-danger">No se pudieron cargar las sesiones.</div>
          <div className="mt-3"><Button size="sm" variant="ghost" onClick={() => sessionsQuery.refetch()}>Reintentar</Button></div>
        </div>
      ) : (
        <>
          <KpiRow sessions={mySessions} />
          <ActiveSessionsPanel
            sessions={mySessions}
            onLink={() => setShowWizard(true)}
            onRestart={(s) =>
              restartMutation.mutate(s.id, {
                onSuccess: () => toast.ok(`Reiniciando ${s.phoneNumber}…`),
                onError: onMutationError,
              })
            }
            onDisconnect={(s) => setConfirmRemove(s)}
            isRestarting={restartMutation.isPending}
          />
          <HowItWorksPanel />
        </>
      )}

      {showWizard && (
        <BaileysWizard
          onClose={() => setShowWizard(false)}
          onConnect={() => {
            setShowWizard(false);
            sessionsQuery.refetch();
          }}
        />
      )}
      {confirmRemove && (
        <ConfirmModal
          title="Desconectar sesión"
          message={`¿Desconectar ${confirmRemove.phoneNumber}? Tendrás que volver a escanear el QR.`}
          confirmLabel="Desconectar"
          tone="danger"
          onClose={() => setConfirmRemove(null)}
          onConfirm={() =>
            deleteMutation.mutate(confirmRemove.id, {
              onSuccess: () => toast.warn("Sesión desconectada."),
              onError: onMutationError,
            })
          }
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
  const connected = sessions.filter((s) => s.status === "Conectado").length;
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
      <Stat
        label="Sesiones vinculadas"
        value={String(sessions.length).padStart(2, "0")}
        sub={`${connected} conectadas`}
      />
      <Stat label="Velocidad combinada" value={`${sessions.length * 60} msj/min`} sub="60 msj/min por sesión" />
      <Stat label="Mensajes hoy" value="—" sub="Pronto" />
      <Stat label="Última conexión" value={sessions[0]?.connectedAt ? "activa" : "—"} sub={sessions[0]?.phoneNumber ?? "—"} mono />
    </div>
  );
}

function ActiveSessionsPanel({ sessions, onLink, onRestart, onDisconnect, isRestarting }) {
  return (
    <Panel title="Sesiones activas" subtitle="Cada sesión equivale a un número de WSP independiente.">
      <div className="grid gap-0">
        {sessions.length === 0 ? (
          <EmptyState onLink={onLink} />
        ) : (
          sessions.map((s, i) => (
            <SessionRow key={s.id} session={s} index={i} onRestart={onRestart} onDisconnect={onDisconnect} isRestarting={isRestarting} />
          ))
        )}
      </div>
    </Panel>
  );
}

function SessionRow({ session, index, onRestart, onDisconnect, isRestarting }) {
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
        <div className="text-[13px] font-semibold">{session.phoneNumber}</div>
        <div className="mono text-[11px] text-muted mt-0.5">
          {session.slug} · {session.platform ?? "Sin plataforma"}
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
        Calidad <span className="text-ink">{session.quality ?? "—"}</span>
      </div>
      <div className="mono text-xs text-muted">
        {session.connectedAt ? new Date(session.connectedAt).toLocaleString("es-PE") : "—"}
      </div>
      <div className="flex gap-1.5 justify-end">
        <Button
          size="sm"
          variant="ghost"
          icon={<I.refresh size={12} />}
          disabled={isRestarting}
          onClick={() => onRestart(session)}
        >
          Reiniciar
        </Button>
        <Button size="sm" variant="ghost" icon={<I.x size={12} />} onClick={() => onDisconnect(session)}>
          Desconectar
        </Button>
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
