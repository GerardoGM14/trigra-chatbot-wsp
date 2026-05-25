import { useMemo, useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Panel } from "../../components/ui/Panel.jsx";
import { Stat } from "../../components/ui/Stat.jsx";
import { Avatar } from "../../components/ui/Avatar.jsx";
import { Bars } from "../../components/ui/Bars.jsx";
import { I } from "../../components/Icons.jsx";
import { useUsers } from "../../hooks/api/useUsers.js";
import { useCampaigns } from "../../hooks/api/useCampaigns.js";
import { useSessions } from "../../hooks/api/useSessions.js";
import { useActivity } from "../../hooks/api/useActivity.js";
import { useToast } from "../../lib/toast.jsx";
import { timeOfDay, num } from "../../lib/format.js";

// Resumen ejecutivo: KPIs derivados de queries reales, gráfico de envíos por
// rango temporal (datos sintéticos por ahora — el backend no expone series
// históricas), estado de sesiones Baileys en vivo, top operadores por envíos
// y feed reciente de actividad.

const RANGE_META = {
  "24h": { label: "+3,1%", scale: 0.6 },
  "7d": { label: "+12,4%", scale: 1 },
  "30d": { label: "+18,9%", scale: 1.8 },
};

// Curva sintética de 24 puntos. El backend tendrá un endpoint /reports/hourly
// más adelante; por ahora reproducimos la forma del mock.
const BASE_HOURLY = [12, 8, 4, 2, 2, 3, 9, 28, 62, 84, 71, 55, 48, 52, 61, 73, 82, 91, 76, 58, 42, 30, 22, 16];

export function AdminOverview() {
  const { toast } = useToast();
  const [range, setRange] = useState("7d");

  const usersQuery = useUsers();
  const campaignsQuery = useCampaigns();
  const sessionsQuery = useSessions();
  const activityQuery = useActivity({ take: 7 });

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const campaigns = useMemo(() => campaignsQuery.data ?? [], [campaignsQuery.data]);
  const sessions = sessionsQuery.data ?? [];

  const activeUsers = users.filter((u) => u.status === "Activo").length;
  const totalSent = campaigns.reduce((a, c) => a + (c.sent ?? 0), 0);
  const running = campaigns.filter((c) => c.status === "Enviando").length;
  const connectedSessions = sessions.filter((s) => s.status === "Conectado").length;

  const r = RANGE_META[range];
  const scaledHourly = useMemo(() => BASE_HOURLY.map((v) => Math.round(v * r.scale)), [r.scale]);
  const total = scaledHourly.reduce((a, v) => a + v * 60, 0);

  // Top operadores: ordenamos por número de campañas creadas (lo que tenemos
  // hoy contra el backend; cuando agreguemos /reports/top-operators ese hook
  // sustituye este cálculo).
  const topOperators = useMemo(() => {
    const counts = new Map();
    for (const c of campaigns) {
      const key = c.owner?.username ?? c.ownerId;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return users
      .filter((u) => u.status === "Activo")
      .map((u) => ({ ...u, count: counts.get(u.username) ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [campaigns, users]);

  return (
    <div className="grid gap-5">
      <KpiRow
        activeUsers={activeUsers}
        totalUsers={users.length}
        totalSent={totalSent}
        running={running}
        connectedSessions={connectedSessions}
        totalSessions={sessions.length}
      />

      <div className="grid gap-3" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <VolumePanel range={range} setRange={setRange} total={total} delta={r.label} hourly={scaledHourly} />
        <SystemStatusPanel sessions={sessions} loading={sessionsQuery.isLoading} />
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1.4fr" }}>
        <TopOperatorsPanel operators={topOperators} loading={usersQuery.isLoading} />
        <RecentActivityPanel
          rows={activityQuery.data ?? []}
          loading={activityQuery.isLoading}
          onExport={() => toast.ok("Exportando los últimos 7 días de actividad…")}
        />
      </div>
    </div>
  );
}

function KpiRow({ activeUsers, totalUsers, totalSent, running, connectedSessions, totalSessions }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
      <Stat label="Usuarios activos" value={activeUsers} sub={`${totalUsers} totales`} />
      <Stat label="Mensajes enviados" value={num(totalSent)} sub="Acumulado de campañas" />
      <Stat label="Campañas en curso" value={running} sub={`${campaignsRunning(running)}`} />
      <Stat label="Sesiones Baileys" value={`${connectedSessions} / ${totalSessions}`} sub="Conectadas / totales" />
    </div>
  );
}
function campaignsRunning(n) {
  if (n === 0) return "Ninguna activa";
  if (n === 1) return "1 enviando";
  return `${n} enviando`;
}

function VolumePanel({ range, setRange, total, delta, hourly }) {
  return (
    <Panel
      title="Volumen de envíos · últimas 24 h"
      subtitle="Hora local UTC−5"
      action={
        <div className="flex gap-1.5">
          {[
            { k: "24h", l: "24 h" },
            { k: "7d", l: "7 d" },
            { k: "30d", l: "30 d" },
          ].map((opt) => (
            <Button key={opt.k} size="sm" variant="ghost" active={range === opt.k} onClick={() => setRange(opt.k)}>
              {opt.l}
            </Button>
          ))}
        </div>
      }
    >
      <div className="flex items-end gap-6">
        <div className="grid gap-1">
          <span className="text-[11px] text-muted uppercase" style={{ letterSpacing: "0.04em" }}>Total</span>
          <span className="mono" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1 }}>
            {num(total)}
          </span>
          <span className="text-xs text-muted">{delta} vs. periodo anterior</span>
        </div>
        <div className="flex-1 relative">
          <Bars
            data={hourly}
            width={520}
            height={120}
            labels={hourly.map((_, i) => `${String(i).padStart(2, "0")}:00`)}
            valueFmt={(v) => `${num(v * 60)} msj`}
          />
          <div className="flex justify-between mt-1.5 text-[10px] text-muted">
            <span className="mono">00:00</span>
            <span className="mono">06:00</span>
            <span className="mono">12:00</span>
            <span className="mono">18:00</span>
            <span className="mono">23:00</span>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function SystemStatusPanel({ sessions, loading }) {
  return (
    <Panel title="Estado del sistema">
      <div className="grid gap-3.5">
        {loading ? (
          <div className="text-muted text-[13px] text-center" style={{ padding: "12px 0" }}>Cargando…</div>
        ) : sessions.length === 0 ? (
          <div className="text-muted text-[13px] text-center" style={{ padding: "12px 0" }}>
            Sin sesiones vinculadas todavía.
          </div>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className="flex justify-between items-center">
              <div>
                <div className="text-[13px] font-medium">{s.slug}</div>
                <div className="mono text-[11px] text-muted mt-0.5">{s.phoneNumber}</div>
              </div>
              <div className="text-right">
                <Badge tone={s.status === "Conectado" ? "info" : "warn"}>
                  <span style={{ width: 6, height: 6, background: "currentColor", display: "inline-block" }} />
                  {s.status}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function TopOperatorsPanel({ operators, loading }) {
  return (
    <Panel title="Operadores más activos" subtitle="Por número de campañas creadas">
      <div className="grid gap-3.5">
        {loading ? (
          <div className="text-muted text-[13px]">Cargando…</div>
        ) : operators.length === 0 ? (
          <div className="text-muted text-[13px]">Sin actividad todavía.</div>
        ) : (
          operators.map((u, i) => (
            <div key={u.id} className="flex items-center gap-3">
              <span className="mono text-[11px] text-muted" style={{ width: 18 }}>{String(i + 1).padStart(2, "0")}</span>
              <Avatar name={u.name} size={28} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {u.name}
                </div>
                <div className="text-[11px] text-muted">{u.count} campañas</div>
              </div>
              <div className="mono text-xs font-medium">{u.role}</div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function RecentActivityPanel({ rows, loading, onExport }) {
  return (
    <Panel
      title="Actividad reciente"
      subtitle="Auditoría en tiempo real"
      action={
        <Button size="sm" variant="ghost" icon={<I.download size={14} />} onClick={onExport}>
          Exportar
        </Button>
      }
    >
      <div className="grid gap-0" style={{ marginTop: -12 }}>
        {loading ? (
          <div className="text-muted text-[13px]" style={{ padding: "16px 0" }}>Cargando…</div>
        ) : rows.length === 0 ? (
          <div className="text-muted text-[13px]" style={{ padding: "16px 0" }}>Sin actividad reciente.</div>
        ) : (
          rows.slice(0, 7).map((a, i) => (
            <div
              key={a.id}
              className="grid items-center"
              style={{
                gridTemplateColumns: "68px 100px 1fr auto",
                gap: 14,
                padding: "10px 0",
                borderBottom: i < Math.min(rows.length, 7) - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <span className="mono text-[11px] text-muted">{timeOfDay(a.createdAt)}</span>
              <span className="mono text-[11px]">{a.user?.username ?? "system"}</span>
              <div className="min-w-0">
                <span className="mono text-[11px] text-ink-2">{a.action}</span>
                <span className="text-xs text-muted ml-2">{a.detail}</span>
              </div>
              <Badge tone={a.level === "err" ? "danger" : a.level === "warn" ? "warn" : a.level === "info" ? "info" : "neutral"}>
                {a.level.toUpperCase()}
              </Badge>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}
