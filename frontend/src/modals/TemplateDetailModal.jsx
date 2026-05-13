import { I } from "../components/Icons.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { Stat } from "../components/ui/Stat.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";

// Read-only view of a template. The "Editar" button hands off to the editor;
// "Usar en campaña" calls onUse(template) so the screen can navigate to compose.

const LIST_ITEMS = [
  { t: "Ver horarios de atención", d: "Lun–Sáb 8:00–20:00" },
  { t: "Hablar con un asesor", d: "Te conectamos en menos de 2 min" },
  { t: "Consultar mi estado de cuenta", d: "Necesitas tu DNI a la mano" },
  { t: "Cambiar de plan", d: "Mejoras disponibles para tu línea" },
  { t: "Reportar un problema", d: "Soporte técnico inmediato" },
];
const BUTTON_ITEMS = [{ t: "Sí, confirmar" }, { t: "Reagendar" }, { t: "Cancelar" }];

export function TemplateDetailModal({ template, onClose, onEdit, onUse }) {
  const sampleItems =
    template.type === "Lista" ? LIST_ITEMS : template.type === "Botones" ? BUTTON_ITEMS : [];

  return (
    <ModalShell
      title={template.name}
      subtitle={<span><span className="mono">{template.id}</span> · usada {template.used} veces</span>}
      width={620}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cerrar</Button>
          <Button
            variant="ghost"
            icon={<I.edit size={12} />}
            onClick={() => { close(); setTimeout(() => onEdit(template), 200); }}
          >
            Editar
          </Button>
          <Button
            variant="accent"
            icon={<I.send size={12} />}
            onClick={() => { close(); setTimeout(() => onUse?.(template), 200); }}
          >
            Usar en campaña
          </Button>
        </>
      )}
    >
      <div className="grid gap-4">
        <div className="flex gap-2">
          <Badge tone="neutral">{template.type}</Badge>
          <Badge tone="info">{template.items} elemento{template.items > 1 ? "s" : ""}</Badge>
          <Badge tone="neutral">es-PE</Badge>
        </div>

        <ChatPreview template={template} sampleItems={sampleItems} />

        {template.type === "Lista" && <ListItemsBlock items={sampleItems} />}

        <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          <Stat label="Variables" value="2" sub="{{nombre}}, {{plan}}" />
          <Stat label="Usada" value={template.used} sub="campañas" />
          <Stat label="Apertura" value="62%" sub="promedio" />
        </div>
      </div>
    </ModalShell>
  );
}

function ChatPreview({ template, sampleItems }) {
  return (
    <div className="bg-surface-2 p-[18px]" style={{ border: "1px solid var(--border)" }}>
      <div className="text-[11px] font-medium text-muted uppercase mb-2.5" style={{ letterSpacing: "0.04em" }}>
        Vista previa
      </div>
      <div style={{ background: "#FFF", border: "1px solid var(--border)", padding: 14, maxWidth: 340 }}>
        <div className="text-[13px]" style={{ lineHeight: 1.5 }}>
          Hola{" "}
          <span className="mono" style={{ background: "var(--accent-soft)", padding: "0 4px" }}>{"{{nombre}}"}</span>
          , gracias por contactarnos. ¿En qué podemos ayudarte hoy?
        </div>
        {template.type === "Lista" && (
          <div style={{ marginTop: 10, padding: "8px 0 0", borderTop: "1px solid var(--border)" }}>
            <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "var(--accent)" }}>
              <I.list size={12} /> Ver opciones
            </div>
          </div>
        )}
        {template.type === "Botones" && (
          <div className="grid gap-1.5" style={{ marginTop: 10 }}>
            {sampleItems.map((b, i) => (
              <div
                key={i}
                className="text-center text-xs font-medium"
                style={{ padding: "8px 10px", border: "1px solid var(--border)", color: "var(--accent)" }}
              >
                {b.t}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ListItemsBlock({ items }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-muted uppercase mb-2" style={{ letterSpacing: "0.04em" }}>
        Opciones de la lista
      </div>
      <div style={{ border: "1px solid var(--border)" }}>
        {items.map((it, i) => (
          <div
            key={i}
            className="flex gap-3"
            style={{ padding: "10px 14px", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}
          >
            <span className="mono text-[11px] text-muted" style={{ width: 20 }}>{i + 1}</span>
            <div>
              <div className="text-[13px] font-medium">{it.t}</div>
              <div className="text-[11px] text-muted mt-0.5">{it.d}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
