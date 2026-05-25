import { useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Field } from "../../components/ui/Field.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Panel } from "../../components/ui/Panel.jsx";
import { Avatar } from "../../components/ui/Avatar.jsx";
import { Menu } from "../../components/overlays/Menu.jsx";
import { I } from "../../components/Icons.jsx";
import {
  useSessions,
  useAssignSession,
  useSessionExclusive,
  useRestartSession,
  useDeleteSession,
} from "../../hooks/api/useSessions.js";
import { useUsers } from "../../hooks/api/useUsers.js";
import { useMutationError } from "../../hooks/useMutationFeedback.js";
import { useToast } from "../../lib/toast.jsx";
import { BaileysWizard, SessionActionModal, EditSecurityPolicyModal } from "../../modals";

const INITIAL_POLICIES = {
  maxRate: "60 msj/min",
  pauseRange: "2–6 segundos",
  schedule: "Lun–Sáb · 08:00 – 20:00 (UTC−5)",
  lockout: { attempts: 5, lockMin: 30 },
  passwordAge: { days: 90 },
};

export function AdminSettings() {
  const { toast } = useToast();
  const onMutationError = useMutationError();

  const sessionsQuery = useSessions();
  const usersQuery = useUsers();
  const assignMutation = useAssignSession();
  const exclusiveMutation = useSessionExclusive();
  const restartMutation = useRestartSession();
  const deleteMutation = useDeleteSession();

  const [showNewSession, setShowNewSession] = useState(false);
  const [action, setAction] = useState(null);
  // Las políticas siguen en estado local hasta que tengamos endpoint dedicado;
  // /api/policies aterrizará en una iteración futura. El form ya está
  // controlado, solo falta conectar la mutation.
  const [policies, setPolicies] = useState(INITIAL_POLICIES);
  const [editingPolicy, setEditingPolicy] = useState(null);

  const sessions = sessionsQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const usernameToId = Object.fromEntries(users.map((u) => [u.username, u.id]));

  // Adapta acciones del SessionActionModal (que viene del prototipo) a los
  // endpoints reales. `data` trae { ops } (usernames) para assign, { exclusive,
  // owner } para exclusive, {} para restart/qr/unlink.
  const apply = (data) => {
    if (!action) return;
    const sessionId = action.session.id;
    const handlers = {
      assign: () => {
        const ids = (data.ops ?? []).map((u) => usernameToId[u]).filter(Boolean);
        assignMutation.mutate(
          { id: sessionId, userIds: ids },
          { onSuccess: () => toast.ok("Operadores asignados."), onError: onMutationError },
        );
      },
      exclusive: () => {
        exclusiveMutation.mutate(
          {
            id: sessionId,
            exclusive: !!data.exclusive,
            ownerId: data.exclusive ? usernameToId[data.owner] : null,
          },
          { onSuccess: () => toast.ok("Modo exclusivo actualizado."), onError: onMutationError },
        );
      },
      restart: () => {
        restartMutation.mutate(sessionId, {
          onSuccess: () => toast.ok("Sesión reiniciándose…"),
          onError: onMutationError,
        });
      },
      unlink: () => {
        deleteMutation.mutate(sessionId, {
          onSuccess: () => toast.warn("Sesión desvinculada."),
          onError: onMutationError,
        });
      },
      qr: () => { /* el modal QR es solo visual, no muta */ },
    };
    handlers[action.type]?.();
  };

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="m-0 text-[22px] font-semibold" style={{ letterSpacing: "-0.02em" }}>Configuración</h2>
        <p className="mt-1 mb-0 text-muted text-[13px]">
          Sesiones de Baileys, integraciones y políticas de la cuenta.
        </p>
      </div>

      <SessionsPanel
        sessions={sessions}
        loading={sessionsQuery.isLoading}
        onNewSession={() => setShowNewSession(true)}
        onAction={setAction}
        onRemoveOp={(session, op) => {
          const remainingIds = session.ops.filter((u) => u !== op).map((u) => usernameToId[u]).filter(Boolean);
          assignMutation.mutate(
            { id: session.id, userIds: remainingIds },
            { onError: onMutationError },
          );
        }}
      />

      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <SendingPolicyPanel
          policies={policies}
          setPolicies={setPolicies}
          onSave={() => toast.ok("Política de envíos guardada.")}
        />
        <SecurityPanel policies={policies} onEdit={setEditingPolicy} />
      </div>

      {showNewSession && (
        <BaileysWizard
          onClose={() => setShowNewSession(false)}
          onConnect={() => {
            // Cuando la integración real con Baileys aterrice, el backend creará
            // el registro y el siguiente refetch lo mostrará. Por ahora el
            // wizard cierra y el operador puede comprobar en la lista.
            setShowNewSession(false);
            sessionsQuery.refetch();
          }}
        />
      )}
      {action && (
        <SessionActionModal
          action={action.type}
          session={normalizeSessionForModal(action.session)}
          onClose={() => setAction(null)}
          onApply={apply}
        />
      )}
      {editingPolicy && (
        <EditSecurityPolicyModal
          policy={{ type: editingPolicy, ...policies[editingPolicy] }}
          onClose={() => setEditingPolicy(null)}
          onSave={(next) => {
            setPolicies({ ...policies, [editingPolicy]: next });
            toast.ok("Política actualizada.");
          }}
        />
      )}
    </div>
  );
}

// SessionActionModal espera { id, num, ops: [usernames] }; el backend devuelve
// { id, slug, phoneNumber, ops }. Adaptamos al shape esperado.
function normalizeSessionForModal(s) {
  return { id: s.id, num: s.phoneNumber, ops: s.ops ?? [] };
}

function SessionsPanel({ sessions, loading, onNewSession, onAction, onRemoveOp }) {
  return (
    <Panel
      title="Sesiones Baileys · asignación a operadores"
      subtitle="Controla qué sesión usa cada operador. Una sesión puede ser compartida o exclusiva."
      action={
        <Button variant="accent" size="sm" icon={<I.plus size={14} />} onClick={onNewSession}>
          Nueva sesión
        </Button>
      }
    >
      <div
        className="grid text-[11px] font-medium text-muted uppercase"
        style={{
          gridTemplateColumns: "140px 160px 110px 1fr 100px",
          padding: "8px 0",
          borderBottom: "1px solid var(--border)",
          letterSpacing: "0.04em",
        }}
      >
        <span>ID sesión</span>
        <span>Número</span>
        <span>Estado</span>
        <span>Operadores asignados</span>
        <span className="text-right">Acciones</span>
      </div>
      <div className="grid gap-0">
        {loading ? (
          <div className="text-muted text-[13px] text-center" style={{ padding: "24px 0" }}>
            Cargando sesiones…
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-muted text-[13px] text-center" style={{ padding: "24px 0" }}>
            Sin sesiones todavía. Vincula una con el botón "Nueva sesión".
          </div>
        ) : (
          sessions.map((s, i) => (
            <SessionRow key={s.id} session={s} index={i} onAction={onAction} onRemoveOp={onRemoveOp} />
          ))
        )}
      </div>
      <div
        className="text-xs"
        style={{ marginTop: 14, padding: "10px 12px", background: "var(--info-soft)", borderLeft: "2px solid var(--info)", color: "var(--ink-2)" }}
      >
        Los operadores solo verán las sesiones que les asignes. Si una sesión es compartida, los envíos se distribuirán
        en cola y respetarán la velocidad máxima configurada abajo.
      </div>
    </Panel>
  );
}

function SessionRow({ session, index, onAction, onRemoveOp }) {
  return (
    <div
      className="grid items-center"
      style={{
        gridTemplateColumns: "140px 160px 110px 1fr 100px",
        padding: "14px 0",
        borderTop: index > 0 ? "1px solid var(--border)" : "none",
      }}
    >
      <span className="mono text-xs">{session.slug}</span>
      <span className="text-[13px] font-medium">{session.phoneNumber}</span>
      <Badge tone={session.status === "Conectado" ? "info" : "warn"}>{session.status}</Badge>
      <div className="flex gap-1 items-center flex-wrap">
        {session.ops.map((op) => (
          <span
            key={op}
            className="inline-flex items-center gap-1 bg-surface-2 text-[11px]"
            style={{ padding: "2px 6px 2px 4px", border: "1px solid var(--border)" }}
          >
            <Avatar name={op} size={16} />
            <span className="mono">{op}</span>
            <button
              className="border-none bg-transparent cursor-pointer p-0 text-muted"
              style={{ marginLeft: 2 }}
              onClick={() => onRemoveOp(session, op)}
            >
              <I.x size={10} />
            </button>
          </span>
        ))}
        <Button
          size="sm"
          variant="ghost"
          icon={<I.plus size={11} />}
          onClick={() => onAction({ type: "assign", session })}
        >
          Asignar
        </Button>
      </div>
      <div className="text-right flex gap-1.5 justify-end">
        <Button size="sm" variant="ghost" onClick={() => onAction({ type: "qr", session })}>QR</Button>
        <Menu
          items={[
            { label: "Asignar operadores", icon: <I.contact size={12} />, onClick: () => onAction({ type: "assign", session }) },
            { label: "Modo exclusivo", icon: <I.user1 size={12} />, onClick: () => onAction({ type: "exclusive", session }) },
            { label: "Reiniciar sesión", icon: <I.refresh size={12} />, onClick: () => onAction({ type: "restart", session }) },
            { label: "Ver QR", icon: <I.link size={12} />, onClick: () => onAction({ type: "qr", session }) },
            { divider: true },
            { label: "Desvincular sesión", icon: <I.x size={12} />, onClick: () => onAction({ type: "unlink", session }), danger: true },
          ]}
        />
      </div>
    </div>
  );
}

function SendingPolicyPanel({ policies, setPolicies, onSave }) {
  return (
    <Panel
      title="Política de envíos"
      action={<Button size="sm" variant="ghost" onClick={onSave}>Guardar</Button>}
    >
      <div className="grid gap-3.5">
        <Field label="Velocidad máxima por sesión" hint="Mensajes por minuto. Protege contra bloqueos.">
          <Input value={policies.maxRate} onChange={(e) => setPolicies({ ...policies, maxRate: e.target.value })} />
        </Field>
        <Field label="Pausa aleatoria entre envíos">
          <Input value={policies.pauseRange} onChange={(e) => setPolicies({ ...policies, pauseRange: e.target.value })} />
        </Field>
        <Field label="Horario permitido">
          <Input value={policies.schedule} onChange={(e) => setPolicies({ ...policies, schedule: e.target.value })} />
        </Field>
      </div>
    </Panel>
  );
}

function SecurityPanel({ policies, onEdit }) {
  return (
    <Panel title="Seguridad de la cuenta">
      <div className="grid gap-3 text-[13px]">
        <SecurityRow
          title="Autenticación en dos pasos"
          sub="Obligatoria para Administradores"
          right={<Badge tone="info">Activa</Badge>}
        />
        <SecurityRow
          title="Bloqueo por intentos fallidos"
          sub={`${policies.lockout.attempts} intentos · bloqueo ${policies.lockout.lockMin} min`}
          right={
            <Button variant="ghost" size="sm" icon={<I.edit size={12} />} onClick={() => onEdit("lockout")}>
              Editar
            </Button>
          }
        />
        <SecurityRow
          title="Caducidad de contraseña"
          sub={`Cada ${policies.passwordAge.days} días`}
          right={
            <Button variant="ghost" size="sm" icon={<I.edit size={12} />} onClick={() => onEdit("passwordAge")}>
              Editar
            </Button>
          }
          last
        />
      </div>
    </Panel>
  );
}

function SecurityRow({ title, sub, right, last }) {
  return (
    <div
      className="flex justify-between items-center"
      style={{ paddingBottom: last ? 0 : 12, borderBottom: last ? "none" : "1px solid var(--border)" }}
    >
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted mt-0.5">{sub}</div>
      </div>
      {right}
    </div>
  );
}
