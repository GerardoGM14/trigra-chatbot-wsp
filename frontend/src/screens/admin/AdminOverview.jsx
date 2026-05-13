import { useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Panel } from "../../components/ui/Panel.jsx";
import { Stat } from "../../components/ui/Stat.jsx";
import { Avatar } from "../../components/ui/Avatar.jsx";
import { Bars } from "../../components/ui/Bars.jsx";
import { I } from "../../components/Icons.jsx";
import { useToast } from "../../lib/toast.jsx";
import { USERS, ACTIVITY, CAMPAIGNS, HOURLY } from "../../lib/data.js";

// Resumen ejecutivo: KPIs, gráfico de envíos (24h/7d/30d configurable),
// estado del sistema, top operadores y feed reciente de actividad.

const RANGE_LABELS = {
  "24h": { total: "21.430", delta: "+3,1%", scale: 0.6 },
  "7d": { total: "57.984", delta: "+12,4%", scale: 1 },
  "30d": { total: "186.420", delta: "+18,9%", scale: 1.8 },
};

const SYSTEM_STATUS = [
  { name: "Sesión Baileys #1", id: "+51 999 ··· 412", status: "Conectado", since: "04:12:08" },
  { name: "Sesión Baileys #2", id: "+51 998 ··· 220", status: "Conectado", since: "04:11:55" },
  { name: "Sesión Baileys #3", id: "+51 944 ··· 901", status: "Reconectando", since: "00:00:14" },
  { name: "Cola de envíos", id: "Redis · cluster-a", status: "OK", since: "—" },
];

export function AdminOverview() {
  const { toast } = useToast();
  const [range, setRange] = useState("7d");
  const r = RANGE_LABELS[range];

  const activeUsers = USERS.filter((u) => u.status === "Activo").length;
  const totalSent = CAMPAIGNS.reduce((a, c) => a + c.sent, 0);
  const running = CAMPAIGNS.filter((c) => c.status === "Enviando").length;
  const scaledHourly = HOURLY.map((v) => Math.round(v * r.scale));

  return (
    <div className="grid gap-5">
      <KpiRow activeUsers={activeUsers} totalSent={totalSent} running={running} />

      <div className="grid gap-3" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <VolumePanel range={range} setRange={setRange} total={r.total} delta={r.delta} hourly={scaledHourly} />
        <SystemStatusPanel />
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1.4fr" }}>
        <TopOperatorsPanel />
        <RecentActivityPanel onExport={() => toast.ok("Exportando los últimos 7 días de actividad…")} />
      </div>
    </div>
  );
}

function KpiRow({ activeUsers, totalSent, running }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
      <Stat label="Usuarios activos" value={activeUsers} sub={`${USERS.length} totales · 1 invitación pendiente`} trend="+2" />
      <Stat label="Mensajes enviados 24h" value={totalSent.toLocaleString("es-PE")} sub="Tasa de entrega 98,3%" trend="+12,4%" />
      <Stat label="Campañas en curso" value={running} sub="3 programadas · 1 pausada" />
      <Stat label="Sesiones Baileys" value="3 / 3" sub="Última reconexión hace 14 min" />
    </div>
  );
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
            {total}
          </span>
          <span className="text-xs text-muted">{delta} vs. periodo anterior</span>
        </div>
        <div className="flex-1 relative">
          <Bars
            data={hourly}
            width={520}
            height={120}
            labels={hourly.map((_, i) => `${String(i).padStart(2, "0")}:00`)}
            valueFmt={(v) => `${(v * 60).toLocaleString("es-PE")} msj`}
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

function SystemStatusPanel() {
  return (
    <Panel title="Estado del sistema">
      <div className="grid gap-3.5">
        {SYSTEM_STATUS.map((s, i) => (
          <div key={i} className="flex justify-between items-center">
            <div>
              <div className="text-[13px] font-medium">{s.name}</div>
              <div className="mono text-[11px] text-muted mt-0.5">{s.id}</div>
            </div>
            <div className="text-right">
              <Badge tone={s.status === "Conectado" ? "info" : s.status === "OK" ? "neutral" : "warn"}>
                <span style={{ width: 6, height: 6, background: "currentColor", display: "inline-block" }} />
                {s.status}
              </Badge>
              {s.since !== "—" && <div className="mono text-[10px] text-muted mt-1">uptime {s.since}</div>}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function TopOperatorsPanel() {
  const top = [...USERS]
    .filter((u) => u.status === "Activo")
    .sort((a, b) => b.sent - a.sent)
    .slice(0, 5);
  return (
    <Panel title="Operadores más activos" subtitle="Últimos 7 días">
      <div className="grid gap-3.5">
        {top.map((u, i) => (
          <div key={u.id} className="flex items-center gap-3">
            <span className="mono text-[11px] text-muted" style={{ width: 18 }}>{String(i + 1).padStart(2, "0")}</span>
            <Avatar name={u.name} size={28} />
            <div className="flex-1 min-w-0">
              <div
                className="text-[13px] font-medium"
                style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {u.name}
              </div>
              <div className="text-[11px] text-muted">{u.campaigns} campañas</div>
            </div>
            <div className="mono text-xs font-medium">{u.sent.toLocaleString("es-PE")}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function RecentActivityPanel({ onExport }) {
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
        {ACTIVITY.slice(0, 7).map((a, i) => (
          <div
            key={i}
            className="grid items-center"
            style={{
              gridTemplateColumns: "68px 100px 1fr auto",
              gap: 14,
              padding: "10px 0",
              borderBottom: i < 6 ? "1px solid var(--border)" : "none",
            }}
          >
            <span className="mono text-[11px] text-muted">{a.t}</span>
            <span className="mono text-[11px]">{a.user}</span>
            <div className="min-w-0">
              <span className="mono text-[11px] text-ink-2">{a.action}</span>
              <span className="text-xs text-muted ml-2">{a.detail}</span>
            </div>
            <Badge
              tone={a.level === "err" ? "danger" : a.level === "warn" ? "warn" : a.level === "info" ? "info" : "neutral"}
            >
              {a.level.toUpperCase()}
            </Badge>
          </div>
        ))}
      </div>
    </Panel>
  );
}
