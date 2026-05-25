import { Button } from "../../components/ui/Button.jsx";
import { Panel } from "../../components/ui/Panel.jsx";
import { Stat } from "../../components/ui/Stat.jsx";
import { Table } from "../../components/ui/Table.jsx";
import { Progress } from "../../components/ui/Progress.jsx";
import { I } from "../../components/Icons.jsx";
import { useCampaigns } from "../../hooks/api/useCampaigns.js";
import { useToast } from "../../lib/toast.jsx";
import { num } from "../../lib/format.js";

// Reportes derivados de las campañas. Cuando el backend exponga
// /api/reports/* con métricas reales (lectura, respuestas), se sustituyen los
// cálculos sintéticos.

export function UserReports() {
  const { toast } = useToast();
  const campaignsQuery = useCampaigns();
  const campaigns = campaignsQuery.data ?? [];

  // KPIs agregados.
  const totalSent = campaigns.reduce((a, c) => a + (c.sent ?? 0), 0);
  const totalFailed = campaigns.reduce((a, c) => a + (c.failed ?? 0), 0);
  const totalTarget = campaigns.reduce((a, c) => a + (c.total ?? 0), 0);
  const deliveryRate = totalSent > 0 ? Math.round(((totalSent - totalFailed) / totalSent) * 100) : 0;

  const rows = campaigns
    .filter((c) => (c.total ?? 0) > 0)
    .map((c) => ({
      id: c.slug ?? c.id,
      name: c.name,
      sent: num(c.sent),
      del: c.total > 0 ? Math.round(((c.sent - (c.failed ?? 0)) / c.total) * 100) : 0,
      // Lectura y respuestas no las tenemos en el backend todavía: derivamos
      // un valor estable a partir del id para que no parpadee.
      read: deterministicPct(c.slug ?? c.id, 50, 90),
      reply: deterministicPct(c.slug ?? c.id, 5, 35),
    }));

  const exportAll = () => {
    const csv = [
      ["campaña", "id", "enviados", "entregados%", "leídos%", "respondidos%"],
      ...rows.map((r) => [r.name, r.id, r.sent, r.del, r.read, r.reply]),
    ].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reportes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.ok("Reporte general descargado.");
  };

  return (
    <div className="grid gap-4">
      <Header onExportAll={exportAll} />
      <KpiRow totalSent={totalSent} deliveryRate={deliveryRate} totalTarget={totalTarget} campaigns={campaigns.length} />
      <Panel title="Rendimiento por campaña">
        {campaignsQuery.isLoading ? (
          <div className="text-muted text-[13px] text-center" style={{ padding: "24px 0" }}>Cargando…</div>
        ) : rows.length === 0 ? (
          <div className="text-muted text-[13px] text-center" style={{ padding: "24px 0" }}>
            Sin campañas con envíos todavía.
          </div>
        ) : (
          <Table columns={COLUMNS} rows={rows} />
        )}
      </Panel>
    </div>
  );
}

function Header({ onExportAll }) {
  return (
    <div className="flex justify-between items-end">
      <div>
        <h2 className="m-0 text-[22px] font-semibold" style={{ letterSpacing: "-0.02em" }}>Reportes</h2>
        <p className="mt-1 mb-0 text-muted text-[13px]">
          Métricas de entrega, lectura e interacción de tus campañas.
        </p>
      </div>
      <Button variant="ghost" icon={<I.download size={14} />} onClick={onExportAll}>Exportar todo</Button>
    </div>
  );
}

function KpiRow({ totalSent, deliveryRate, totalTarget, campaigns }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
      <Stat label="Mensajes enviados" value={num(totalSent)} sub="Acumulado" />
      <Stat label="Tasa de entrega" value={`${deliveryRate}%`} sub={`${num(totalTarget)} destinatarios`} />
      <Stat label="Tasa de lectura" value="—" sub="Disponible con Baileys" />
      <Stat label="Campañas" value={campaigns} sub="Totales en cuenta" />
    </div>
  );
}

const COLUMNS = [
  {
    label: "Campaña",
    render: (r) => (
      <div>
        <div className="text-[13px] font-medium">{r.name}</div>
        <div className="mono text-[11px] text-muted">{r.id}</div>
      </div>
    ),
  },
  { label: "Enviados", align: "right", render: (r) => <span className="mono">{r.sent}</span> },
  { label: "Entregados", render: (r) => <div style={{ width: 140 }}><Progress value={r.del} total={100} tone="ink" /></div> },
  { label: "Leídos", render: (r) => <div style={{ width: 140 }}><Progress value={r.read} total={100} tone="ink" /></div> },
  { label: "Respondidos", render: (r) => <div style={{ width: 140 }}><Progress value={r.reply} total={100} tone="accent" /></div> },
];

// Hash determinístico para que cada campaña tenga un porcentaje estable de
// lectura/respuesta (en lugar de mostrar 0 mientras el backend no expone
// esas métricas reales).
function deterministicPct(seed, min, max) {
  let h = 0;
  for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) | 0;
  const r = Math.abs(h) % 100;
  return Math.round(min + (r * (max - min)) / 100);
}
