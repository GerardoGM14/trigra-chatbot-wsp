import { Button } from "../../components/ui/Button.jsx";
import { Panel } from "../../components/ui/Panel.jsx";
import { Stat } from "../../components/ui/Stat.jsx";
import { Table } from "../../components/ui/Table.jsx";
import { Progress } from "../../components/ui/Progress.jsx";
import { I } from "../../components/Icons.jsx";
import { useToast } from "../../lib/toast.jsx";

const ROWS = [
  { name: "Promo Mayo — Clientes A", id: "camp_8821", sent: "3.420", del: 98, read: 74, reply: 22 },
  { name: "Recordatorio cita", id: "camp_8820", sent: "812", del: 99, read: 88, reply: 41 },
  { name: "Bienvenida leads", id: "camp_8816", sent: "2.100", del: 97, read: 62, reply: 9 },
  { name: "Confirmación entrega", id: "camp_8815", sent: "430", del: 99, read: 91, reply: 54 },
  { name: "Encuesta NPS Marzo", id: "camp_8810", sent: "5.210", del: 96, read: 68, reply: 18 },
];

export function UserReports() {
  const { toast } = useToast();

  const exportAll = () => {
    const csv = [
      ["campaña", "id", "enviados", "entregados%", "leídos%", "respondidos%"],
      ...ROWS.map((r) => [r.name, r.id, r.sent, r.del, r.read, r.reply]),
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
      <KpiRow />
      <Panel title="Rendimiento por campaña — últimos 7 días">
        <Table columns={COLUMNS} rows={ROWS} />
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

function KpiRow() {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
      <Stat label="Mensajes enviados" value="12.480" sub="Últimos 7 días" trend="+8,2%" />
      <Stat label="Tasa de entrega" value="98,3%" sub="2 sesiones / 12.272" />
      <Stat label="Tasa de lectura" value="71,4%" sub="8.913 lectores" />
      <Stat label="Respuestas (CTR)" value="14,8%" sub="1.847 respuestas" trend="+1,2pp" />
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
  {
    label: "Entregados",
    render: (r) => (
      <div style={{ width: 140 }}>
        <Progress value={r.del} total={100} tone="ink" />
      </div>
    ),
  },
  {
    label: "Leídos",
    render: (r) => (
      <div style={{ width: 140 }}>
        <Progress value={r.read} total={100} tone="ink" />
      </div>
    ),
  },
  {
    label: "Respondidos",
    render: (r) => (
      <div style={{ width: 140 }}>
        <Progress value={r.reply} total={100} tone="accent" />
      </div>
    ),
  },
];
