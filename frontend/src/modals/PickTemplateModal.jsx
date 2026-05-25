import { useState, useEffect, useMemo } from "react";
import { Button } from "../components/ui/Button.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";
import { useTemplates } from "../hooks/api/useTemplates.js";

export function PickTemplateModal({ onClose, onPick }) {
  const templatesQuery = useTemplates();
  // Memoizamos para estabilizar la referencia y evitar que useEffect dispare en
  // cada render mientras la query no cambia.
  const templates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);
  const [active, setActive] = useState(null);

  // Selecciona la primera por defecto cuando llegan del backend.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!active && templates.length > 0) setActive(templates[0].id);
  }, [active, templates]);

  return (
    <ModalShell
      title="Elegir plantilla"
      subtitle="La nueva campaña heredará el contenido, las variables y la estructura de la plantilla."
      width={560}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button
            variant="accent"
            disabled={!active}
            onClick={() => { onPick?.(templates.find((t) => t.id === active)); close(); }}
          >
            Usar plantilla
          </Button>
        </>
      )}
    >
      <div className="grid gap-2">
        {templatesQuery.isLoading ? (
          <div className="text-muted text-[13px] text-center" style={{ padding: "16px 0" }}>Cargando plantillas…</div>
        ) : templates.length === 0 ? (
          <div className="text-muted text-[13px] text-center" style={{ padding: "16px 0" }}>
            No tienes plantillas todavía.
          </div>
        ) : (
          templates.map((t) => {
            const on = active === t.id;
            const itemCount = Array.isArray(t.items) ? t.items.length : 1;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className="text-left cursor-pointer"
                style={{
                  padding: "12px 14px",
                  border: `1px solid ${on ? "var(--ink)" : "var(--border)"}`,
                  background: on ? "var(--surface-2)" : "var(--surface)",
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[13px] font-semibold">{t.name}</div>
                    <div className="mono text-[11px] text-muted mt-0.5">{t.slug} · {itemCount} elementos</div>
                  </div>
                  <Badge tone="neutral">{t.type}</Badge>
                </div>
                <div className="text-[11px] text-muted mt-2">Usada {t.usedCount ?? 0} veces</div>
              </button>
            );
          })
        )}
      </div>
    </ModalShell>
  );
}
