import { Panel } from "../../../components/ui/Panel.jsx";
import { I } from "../../../components/Icons.jsx";

const TYPES = [
  { k: "text", icon: <I.text size={18} />, t: "Texto", d: "Mensaje simple" },
  { k: "image", icon: <I.image size={18} />, t: "Imagen", d: "Foto + caption" },
  { k: "video", icon: <I.video size={18} />, t: "Video", d: "MP4 + caption" },
  { k: "doc", icon: <I.doc size={18} />, t: "Documento", d: "PDF, XLS, etc." },
  { k: "list", icon: <I.list size={18} />, t: "Lista cliceable", d: "Opciones en menú" },
  { k: "btns", icon: <I.button size={18} />, t: "Botones rápidos", d: "Hasta 3 acciones" },
];

export function MessageTypePicker({ type, setType }) {
  return (
    <Panel title="Tipo de mensaje" subtitle="Cómo aparecerá el contenido en el chat del destinatario.">
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {TYPES.map((o) => (
          <button
            key={o.k}
            onClick={() => setType(o.k)}
            className="text-left cursor-pointer"
            style={{
              padding: "12px 14px",
              border: `1px solid ${type === o.k ? "var(--ink)" : "var(--border-strong)"}`,
              background: type === o.k ? "var(--surface-2)" : "var(--surface)",
            }}
          >
            <div className="flex items-center gap-2.5">
              {o.icon}
              <span className="text-[13px] font-medium">{o.t}</span>
            </div>
            <div className="text-[11px] text-muted mt-1.5">{o.d}</div>
          </button>
        ))}
      </div>
    </Panel>
  );
}
