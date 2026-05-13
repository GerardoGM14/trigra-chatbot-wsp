import { Panel } from "../../../components/ui/Panel.jsx";
import { I } from "../../../components/Icons.jsx";

// Vista previa derecha (sticky). Renderiza el chat bubble + el resumen al pie.

export function ComposePreview({
  type, body, header, footer, buttonText, items, name,
  totalRecipients, whenMode, typeLabels,
}) {
  return (
    <div className="sticky" style={{ top: 20 }}>
      <Panel title="Vista previa" subtitle="Cómo verá el destinatario el mensaje" padding={0}>
        <ChatBubble
          type={type} body={body} header={header} footer={footer}
          buttonText={buttonText} items={items}
        />
        <Summary
          name={name} type={type} typeLabels={typeLabels}
          totalRecipients={totalRecipients} whenMode={whenMode}
        />
      </Panel>
    </div>
  );
}

function ChatBubble({ type, body, header, footer, buttonText, items }) {
  return (
    <div style={{ padding: 18, background: "#EDEAE2", borderBottom: "1px solid var(--border)" }}>
      <div style={{ maxWidth: 300, marginLeft: "auto" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "10px 12px" }}>
          {type === "list" && header && <div className="text-xs font-semibold mb-1.5">{header}</div>}
          {type === "image" && <ImagePlaceholder />}
          {type === "video" && <VideoPlaceholder />}
          {type === "doc" && <DocPlaceholder />}
          <div className="text-[13px]" style={{ whiteSpace: "pre-wrap", lineHeight: 1.45 }}>{body}</div>
          {footer && <div className="text-[11px] text-muted mt-2">{footer}</div>}
          {type === "list" && (
            <div
              className="text-center text-[13px] font-medium"
              style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)", color: "var(--info)" }}
            >
              <I.list size={12} style={{ verticalAlign: "-2px", marginRight: 6 }} />
              {buttonText}
            </div>
          )}
          {type === "btns" && <ButtonsPreview />}
          <div className="mono text-[10px] text-muted text-right" style={{ marginTop: 6 }}>14:32 ✓✓</div>
        </div>
        {type === "list" && <ListPreview header={header} items={items} />}
      </div>
    </div>
  );
}

function ImagePlaceholder() {
  return (
    <div
      className="mono flex items-center justify-center text-[11px] text-muted"
      style={{
        height: 140,
        background: "repeating-linear-gradient(45deg, #E5E2DC 0 8px, #EFEDE7 8px 16px)",
        border: "1px solid var(--border)",
        marginBottom: 8,
      }}
    >
      imagen.jpg · 1080×1080
    </div>
  );
}

function VideoPlaceholder() {
  return (
    <div className="flex items-center justify-center" style={{ height: 140, background: "#1A1916", marginBottom: 8 }}>
      <I.play size={28} stroke="#fff" />
    </div>
  );
}

function DocPlaceholder() {
  return (
    <div
      className="flex items-center gap-2.5 bg-surface-2"
      style={{ padding: "10px 12px", border: "1px solid var(--border)", marginBottom: 8 }}
    >
      <I.doc size={28} />
      <div>
        <div className="text-xs font-medium">Catálogo Q2 2026.pdf</div>
        <div className="mono text-[10px] text-muted">2,3 MB · 12 pág.</div>
      </div>
    </div>
  );
}

function ButtonsPreview() {
  return (
    <div className="grid gap-1" style={{ marginTop: 8 }}>
      {["Ver catálogo", "Hablar con asesor", "Cancelar suscripción"].map((b) => (
        <div
          key={b}
          className="text-center text-xs font-medium"
          style={{ padding: "6px 10px", border: "1px solid var(--border-strong)", color: "var(--info)" }}
        >
          {b}
        </div>
      ))}
    </div>
  );
}

function ListPreview({ header, items }) {
  return (
    <div style={{ marginTop: 6, background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div
        className="text-[11px] text-muted uppercase"
        style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", letterSpacing: "0.04em" }}
      >
        {header}
      </div>
      {items.map((it, i) => (
        <div key={i} style={{ padding: "10px 12px", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
          <div className="text-[13px] font-medium">{it.title}</div>
          {it.desc && <div className="text-[11px] text-muted mt-0.5">{it.desc}</div>}
        </div>
      ))}
    </div>
  );
}

function Summary({ name, type, typeLabels, totalRecipients, whenMode }) {
  return (
    <div style={{ padding: "14px 18px" }}>
      <div className="text-[11px] font-medium uppercase text-muted mb-2" style={{ letterSpacing: "0.04em" }}>
        Resumen
      </div>
      <div className="grid gap-2 text-[13px]">
        <Row k="Campaña" v={name} />
        <Row k="Tipo" v={typeLabels[type]} />
        <Row k="Destinatarios" v={<span className="mono">{totalRecipients.toLocaleString("es-PE")}</span>} />
        <Row
          k="Envío"
          v={whenMode === "now" ? "Inmediato" : whenMode === "schedule" ? "12/05/2026 · 09:00" : "Cada lunes · 09:00"}
        />
        <Row k="Sesión" v={<span className="mono">session_01</span>} />
      </div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-3.5 pb-2" style={{ borderBottom: "1px dashed var(--border)" }}>
      <span className="text-muted">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}
