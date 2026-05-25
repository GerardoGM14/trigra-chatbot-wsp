import { useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { I } from "../../components/Icons.jsx";
import { useActivity } from "../../hooks/api/useActivity.js";
import { useToast } from "../../lib/toast.jsx";
import { timeOfDay } from "../../lib/format.js";
import { FiltersModal } from "../../modals";

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

  // Pasamos los filtros al hook para que el backend haga el match.
  const activityQuery = useActivity({
    level: filters.level,
    scope: filters.scope,
    q: q || undefined,
    take: 200,
  });
  const rows = activityQuery.data ?? [];
  // todayOnly filtra del lado del cliente porque el backend aún no lo expone
  // como parámetro; cuando lo añadamos pasa al hook.
  const visible = todayOnly
    ? rows.filter((r) => {
        const d = new Date(r.createdAt);
        const today = new Date();
        return d.toDateString() === today.toDateString();
      })
    : rows;

  const exportLog = () => {
    const header = ["hora", "usuario", "accion", "recurso", "detalle", "nivel"];
    const csv = [
      header,
      ...visible.map((a) => [
        timeOfDay(a.createdAt),
        a.user?.username ?? "system",
        a.action,
        a.target ?? "",
        a.detail ?? "",
        a.level,
      ]),
    ]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `actividad_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.ok(`Exportados ${visible.length} registros.`);
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

      <LogTable rows={visible} loading={activityQuery.isLoading} error={activityQuery.isError} onRetry={() => activityQuery.refetch()} />

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

function LogTable({ rows, loading, error, onRetry }) {
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
      {loading ? (
        <div className="text-center text-muted text-[13px]" style={{ padding: "32px" }}>
          Cargando actividad…
        </div>
      ) : error ? (
        <div className="text-center" style={{ padding: "32px" }}>
          <div className="text-[13px] text-danger">No se pudo cargar la actividad.</div>
          <div className="mt-3">
            <Button size="sm" variant="ghost" onClick={onRetry}>Reintentar</Button>
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center text-muted text-[13px]" style={{ padding: "32px" }}>
          Ningún registro coincide con los filtros aplicados.
        </div>
      ) : (
        rows.map((a, i) => (
          <div
            key={a.id}
            className="grid items-center"
            style={{
              gridTemplateColumns: "90px 110px 160px 1fr 90px",
              padding: "12px 18px",
              borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <span className="mono text-xs text-muted">{timeOfDay(a.createdAt)}</span>
            <span className="mono text-xs">{a.user?.username ?? "system"}</span>
            <span className="mono text-xs text-ink-2">{a.action}</span>
            <div className="text-[13px] flex gap-2.5 items-baseline">
              <span className="mono text-[11px] text-muted">{a.target ?? "—"}</span>
              <span>{a.detail ?? ""}</span>
            </div>
            <div className="text-right">
              <Badge tone={a.level === "err" ? "danger" : a.level === "warn" ? "warn" : a.level === "info" ? "info" : "neutral"}>
                {a.level.toUpperCase()}
              </Badge>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
