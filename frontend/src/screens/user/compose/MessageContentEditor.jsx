import { Button } from "../../../components/ui/Button.jsx";
import { Field } from "../../../components/ui/Field.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { Panel } from "../../../components/ui/Panel.jsx";
import { I } from "../../../components/Icons.jsx";

// Editor de contenido del mensaje. Cambia según `type` (text/image/video/doc/
// list/btns). Header solo aparece para lista; los botones del editor de
// formato son decorativos por ahora.

const FORMAT_BUTTONS = [
  { l: "B", s: { fontWeight: 700 } },
  { l: "I", s: { fontStyle: "italic" } },
  { l: "S", s: { textDecoration: "line-through" } },
  { l: "`", s: { fontFamily: "Geist Mono" } },
  { l: "{{ }}", s: { fontSize: 11 }, w: 48 },
  { l: "😀", s: { fontSize: 11 }, w: 32 },
];

const UPLOAD_HINTS = {
  image: "JPG, PNG, WebP",
  video: "MP4, 3GP",
  doc: "PDF, DOCX, XLSX, ZIP",
};

export function MessageContentEditor({
  type, body, setBody, header, setHeader, footer, setFooter,
  buttonText, setButtonText, items, setItems,
}) {
  return (
    <Panel title="Contenido del mensaje">
      <div className="grid gap-3.5">
        {type === "list" && (
          <Field label="Encabezado" hint="Hasta 60 caracteres.">
            <Input value={header} onChange={(e) => setHeader(e.target.value)} />
          </Field>
        )}

        <BodyEditor body={body} setBody={setBody} />

        {(type === "image" || type === "video" || type === "doc") && <MediaDropzone type={type} />}

        {type === "list" && (
          <ListItemsEditor
            buttonText={buttonText} setButtonText={setButtonText}
            items={items} setItems={setItems}
          />
        )}

        {type === "btns" && <ButtonsEditor />}

        <Field label="Pie de mensaje (opcional)">
          <Input value={footer} onChange={(e) => setFooter(e.target.value)} />
        </Field>
      </div>
    </Panel>
  );
}

function BodyEditor({ body, setBody }) {
  return (
    <Field
      label="Cuerpo del mensaje"
      hint="Variables disponibles: {{nombre}}, {{empresa}}, {{ref}}."
    >
      <div style={{ border: "1px solid var(--border-strong)", background: "var(--surface)" }}>
        <div
          className="flex gap-0.5 bg-surface-2"
          style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}
        >
          {FORMAT_BUTTONS.map((b, i) => (
            <button
              key={i}
              className="border-none bg-transparent cursor-pointer text-xs"
              style={{ padding: "4px 8px", width: b.w, ...b.s }}
            >
              {b.l}
            </button>
          ))}
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          className="w-full border-none outline-none text-[13px] bg-transparent"
          style={{ padding: 12, lineHeight: 1.5, resize: "vertical", fontFamily: "inherit" }}
        />
        <div
          className="flex justify-between text-[11px] text-muted"
          style={{ padding: "6px 12px", borderTop: "1px solid var(--border)" }}
        >
          <span>{body.length} caracteres</span>
          <span>Se enviará en 1 mensaje</span>
        </div>
      </div>
    </Field>
  );
}

function MediaDropzone({ type }) {
  return (
    <Field
      label={type === "image" ? "Imagen adjunta" : type === "video" ? "Video adjunto" : "Documento adjunto"}
      hint="Máx. 16 MB para video, 100 MB para documentos."
    >
      <div
        className="flex items-center justify-center flex-col gap-2 bg-surface-2"
        style={{ border: "1px dashed var(--border-strong)", padding: "24px" }}
      >
        <I.upload size={22} />
        <div className="text-[13px]">
          Arrastra tu archivo aquí o{" "}
          <span className="font-medium cursor-pointer" style={{ color: "var(--accent)" }}>selecciona</span>
        </div>
        <div className="mono text-[11px] text-muted">{UPLOAD_HINTS[type]}</div>
      </div>
    </Field>
  );
}

function ListItemsEditor({ buttonText, setButtonText, items, setItems }) {
  return (
    <>
      <Field label="Texto del botón" hint="Lo que el usuario tocará para abrir la lista.">
        <Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} />
      </Field>
      <Field
        label="Opciones de la lista"
        hint={`${items.length} de 10 opciones · cada usuario verá una sola respuesta seleccionada`}
      >
        <div className="grid gap-1.5">
          {items.map((it, i) => (
            <div
              key={i}
              className="grid items-center gap-2 bg-surface"
              style={{ gridTemplateColumns: "24px 1fr 1fr 28px", padding: "8px 10px", border: "1px solid var(--border)" }}
            >
              <span className="mono text-[11px] text-muted">{String(i + 1).padStart(2, "0")}</span>
              <Input
                value={it.title}
                onChange={(e) => { const c = [...items]; c[i].title = e.target.value; setItems(c); }}
                placeholder="Título"
              />
              <Input
                value={it.desc}
                onChange={(e) => { const c = [...items]; c[i].desc = e.target.value; setItems(c); }}
                placeholder="Descripción"
              />
              <button
                onClick={() => setItems(items.filter((_, j) => j !== i))}
                className="border-none bg-transparent cursor-pointer text-muted"
              >
                <I.trash size={14} />
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            icon={<I.plus size={12} />}
            onClick={() => setItems([...items, { title: "Nueva opción", desc: "" }])}
          >
            Agregar opción
          </Button>
        </div>
      </Field>
    </>
  );
}

function ButtonsEditor() {
  return (
    <Field label="Botones rápidos" hint="Hasta 3 botones. Pueden abrir URL, copiar o responder.">
      <div className="grid gap-1.5">
        {["Ver catálogo", "Hablar con asesor", "Cancelar suscripción"].map((b, i) => (
          <div
            key={i}
            className="grid items-center gap-2 bg-surface"
            style={{ gridTemplateColumns: "120px 1fr 28px", padding: "8px 10px", border: "1px solid var(--border)" }}
          >
            <select
              className="text-xs"
              style={{ border: "1px solid var(--border-strong)", background: "var(--surface-2)", height: 32, padding: "0 8px" }}
            >
              <option>URL</option>
              <option>Respuesta</option>
              <option>Copiar</option>
            </select>
            <Input value={b} />
            <button className="border-none bg-transparent cursor-pointer text-muted">
              <I.trash size={14} />
            </button>
          </div>
        ))}
      </div>
    </Field>
  );
}
