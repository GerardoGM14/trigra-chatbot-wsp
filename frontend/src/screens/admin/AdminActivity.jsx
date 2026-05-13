import { useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { I } from "../../components/Icons.jsx";
import { useToast } from "../../lib/toast.jsx";
import { ACTIVITY } from "../../lib/data.js";
import { FiltersModal } from "../../modals";

// `todayOnly` is decorative for now — todos los mocks son "hoy" — pero el
// toggle se queda porque va a ir contra el backend.

const FILTER_FIELDS = [
  {
    key: "level",
    label: "Nivel mínimo",
    type: "select",
    options: [
      { value: "ok", label: "OK" },
      { value: "info", label: "INFO" },
      { value: "warn", label: "WARN" },
      { value: "err", label: "ERROR" },
    ],
  },
  {
    key: "scope",
    label: "Origen",
    type: "select",
    options: [
      { value: "user", label: "Solo usuarios" },
      { value: "system", label: "Solo sistema" },
    ],
  },
];

export function AdminActivity() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [todayOnly, setTodayOnly] = useState(false);

  const rows = ACTIVITY.filter((a) => {
    if (filters.level && a.level !== filters.level) return false;
    if (filters.scope === "system" && a.user !== "system") return false;
    if (filters.scope === "user" && a.user === "system") return false;
    if (q && !`${a.user} ${a.action} ${a.target} ${a.detail}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const exportLog = () => {
    const header = ["hora", "usuario", "accion", "recurso", "detalle", "nivel"];
    const csv = [header, ...rows.map((a) => [a.t, a.user, a.action, a.target, a.detail, a.level])]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `actividad_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.ok(`Exportados ${rows.length} registros.`);
  };

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="m-0 text-[22px] font-semibold" style={{ letterSpacing: "-0.02em" }}>
          Registro de actividad
        </h2>
        <p className="mt-1 mb-0 text-muted text-[13px]">
          Auditoría de todas las acciones realizadas por usuarios y por el sistema.
        </p>
      </div>

      <Toolbar
        q={q}
        setQ={setQ}
        todayOnly={todayOnly}
        setTodayOnly={setTodayOnly}
        levelLabel={filters.level}
        onFilters={() => setFiltersOpen(true)}
        onExport={exportLog}
      />

      <LogTable rows={rows} />

      {filtersOpen && (
        <FiltersModal
          title="Filtrar actividad"
          initial={filters}
          onClose={() => setFiltersOpen(false)}
          onApply={setFilters}
          fields={FILTER_FIELDS}
        />
      )}
    </div>
  );
}

function Toolbar({ q, setQ, todayOnly, setTodayOnly, levelLabel, onFilters, onExport }) {
  return (
    <div className="flex gap-2.5 items-center">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filtrar por acción, usuario, recurso…"
        icon={<I.search size={14} />}
        style={{ flex: 1, maxWidth: 420 }}
      />
      <Button variant="ghost" active={todayOnly} icon={<I.cal size={14} />} onClick={() => setTodayOnly((v) => !v)}>
        Hoy
      </Button>
      <Button variant="ghost" icon={<I.filter size={14} />} onClick={onFilters}>
        Nivel{levelLabel ? ` · ${levelLabel}` : ""}
      </Button>
      <div className="flex-1" />
      <Button variant="ghost" icon={<I.download size={14} />} onClick={onExport}>Exportar</Button>
    </div>
  );
}

function LogTable({ rows }) {
  return (
    <div className="bg-surface" style={{ border: "1px solid var(--border)" }}>
      <div
        className="grid bg-surface-2 text-[11px] font-medium uppercase text-muted"
        style={{
          gridTemplateColumns: "90px 110px 160px 1fr 90px",
          padding: "10px 18px",
          borderBottom: "1px solid var(--border)",
          letterSpacing: "0.04em",
        }}
      >
        <span>Hora</span>
        <span>Usuario</span>
        <span>Acción</span>
        <span>Detalle</span>
        <span className="text-right">Nivel</span>
      </div>
      {rows.length === 0 ? (
        <div className="text-center text-muted text-[13px]" style={{ padding: "32px" }}>
          Ningún registro coincide con los filtros aplicados.
        </div>
      ) : (
        rows.map((a, i) => (
          <div
            key={i}
            className="grid items-center"
            style={{
              gridTemplateColumns: "90px 110px 160px 1fr 90px",
              padding: "12px 18px",
              borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <span className="mono text-xs text-muted">{a.t}</span>
            <span className="mono text-xs">{a.user}</span>
            <span className="mono text-xs text-ink-2">{a.action}</span>
            <div className="text-[13px] flex gap-2.5 items-baseline">
              <span className="mono text-[11px] text-muted">{a.target}</span>
              <span>{a.detail}</span>
            </div>
            <div className="text-right">
              <Badge
                tone={a.level === "err" ? "danger" : a.level === "warn" ? "warn" : a.level === "info" ? "info" : "neutral"}
              >
                {a.level.toUpperCase()}
              </Badge>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
