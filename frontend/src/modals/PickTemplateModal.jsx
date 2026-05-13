import { useState } from "react";
import { Button } from "../components/ui/Button.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";
import { TEMPLATES } from "../lib/data.js";

export function PickTemplateModal({ onClose, onPick }) {
  const [active, setActive] = useState(TEMPLATES[0]?.id);
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
            onClick={() => { onPick?.(TEMPLATES.find((t) => t.id === active)); close(); }}
          >
            Usar plantilla
          </Button>
        </>
      )}
    >
      <div className="grid gap-2">
        {TEMPLATES.map((t) => {
          const on = active === t.id;
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
                  <div className="mono text-[11px] text-muted mt-0.5">{t.id} · {t.items} elementos</div>
                </div>
                <Badge tone="neutral">{t.type}</Badge>
              </div>
              <div className="text-[11px] text-muted mt-2">Usada {t.used} veces</div>
            </button>
          );
        })}
      </div>
    </ModalShell>
  );
}
