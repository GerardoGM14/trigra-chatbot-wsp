import { useState } from "react";
import { I } from "../components/Icons.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Field } from "../components/ui/Field.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Select } from "../components/ui/Select.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";

// Create + edit live in the same modal — `template === null` toggles "new".
// Live preview on the right reacts to the editor on the left.

const VARS = ["{{nombre}}", "{{plan}}", "{{fecha}}", "{{hora}}", "{{monto}}"];

export function TemplateEditorModal({ template, onClose, onSave }) {
  const isNew = !template;
  const [name, setName] = useState(template?.name || "");
  const [type, setType] = useState(template?.type || "Texto");
  const [body, setBody] = useState(template?.body || "Hola {{nombre}}, ");
  const [items, setItems] = useState(
    template?.itemList || [
      { t: "Opción 1", d: "Descripción opcional" },
      { t: "Opción 2", d: "" },
    ],
  );
  const updateItem = (i, k, v) => setItems(items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const addItem = () => setItems([...items, { t: `Opción ${items.length + 1}`, d: "" }]);

  return (
    <ModalShell
      title={isNew ? "Nueva plantilla" : `Editar plantilla · ${template.name}`}
      subtitle="Las plantillas pueden incluir variables, listas o botones cliceables."
      width={780}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={() => { onSave && onSave({ name, type, body, items }); close(); }}
            disabled={!name}
          >
            {isNew ? "Crear plantilla" : "Guardar cambios"}
          </Button>
        </>
      )}
    >
      <div className="grid gap-[18px]" style={{ gridTemplateColumns: "1fr 280px" }}>
        <Editor
          name={name} setName={setName}
          type={type} setType={setType}
          body={body} setBody={setBody}
          items={items} updateItem={updateItem} removeItem={removeItem} addItem={addItem}
        />
        <Preview body={body} type={type} items={items} />
      </div>
    </ModalShell>
  );
}

function Editor({ name, setName, type, setType, body, setBody, items, updateItem, removeItem, addItem }) {
  return (
    <div className="grid gap-3.5">
      <div className="grid gap-3" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <Field label="Nombre">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bienvenida · clientes nuevos" />
        </Field>
        <Field label="Tipo">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option>Texto</option>
            <option>Lista</option>
            <option>Botones</option>
            <option>Media</option>
          </Select>
        </Field>
      </div>
      <Field label="Mensaje principal" hint="Usa {{variable}} para personalizar.">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full text-[13px] text-ink"
          style={{
            padding: "10px 12px",
            border: "1px solid var(--border-strong)",
            background: "var(--surface)",
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />
      </Field>
      <div className="flex gap-1.5 flex-wrap">
        {VARS.map((v) => (
          <button
            key={v}
            onClick={() => setBody(body + v)}
            className="mono text-[11px] cursor-pointer text-ink"
            style={{ padding: "4px 8px", border: "1px solid var(--border)", background: "var(--surface-2)" }}
          >
            {v}
          </button>
        ))}
      </div>

      {(type === "Lista" || type === "Botones") && (
        <ItemsBlock type={type} items={items} updateItem={updateItem} removeItem={removeItem} addItem={addItem} />
      )}

      {type === "Media" && (
        <Field label="Adjuntar">
          <div
            className="text-center bg-surface-2"
            style={{ padding: "24px 14px", border: "1.5px dashed var(--border-strong)" }}
          >
            <I.upload size={18} />
            <div className="text-xs font-medium mt-2">Sube imagen, video o documento</div>
            <div className="text-[11px] text-muted mt-1">jpg, png, mp4, pdf · máx 16 MB</div>
          </div>
        </Field>
      )}
    </div>
  );
}

function ItemsBlock({ type, items, updateItem, removeItem, addItem }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] font-medium text-muted uppercase" style={{ letterSpacing: "0.04em" }}>
          {type === "Lista" ? "Opciones de la lista" : "Botones"}
        </span>
        <Button size="sm" variant="ghost" icon={<I.plus size={12} />} onClick={addItem}>Agregar</Button>
      </div>
      <div className="grid gap-2">
        {items.map((it, i) => (
          <div
            key={i}
            className="grid items-center gap-2"
            style={{ gridTemplateColumns: "20px 1fr 1fr 28px", padding: 8, border: "1px solid var(--border)" }}
          >
            <span className="mono text-[11px] text-muted text-center">{i + 1}</span>
            <Input value={it.t} onChange={(e) => updateItem(i, "t", e.target.value)} placeholder="Título" />
            {type === "Lista" && (
              <Input value={it.d} onChange={(e) => updateItem(i, "d", e.target.value)} placeholder="Descripción" />
            )}
            {type === "Botones" && <span className="text-[11px] text-muted">cliceable</span>}
            <button onClick={() => removeItem(i)} className="border-none bg-transparent cursor-pointer p-1">
              <I.x size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Preview({ body, type, items }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-muted uppercase mb-2" style={{ letterSpacing: "0.04em" }}>
        Vista previa
      </div>
      <div className="bg-surface-2 p-3.5" style={{ border: "1px solid var(--border)" }}>
        <div style={{ background: "#FFF", border: "1px solid var(--border)", padding: 12 }}>
          <div className="text-[13px]" style={{ lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
            {body || <span className="text-muted">Tu mensaje aparecerá aquí…</span>}
          </div>
          {type === "Lista" && items.length > 0 && (
            <div
              className="flex items-center gap-1.5 text-xs font-semibold"
              style={{ marginTop: 10, padding: "8px 0 0", borderTop: "1px solid var(--border)", color: "var(--accent)" }}
            >
              <I.list size={12} /> Ver opciones ({items.length})
            </div>
          )}
          {type === "Botones" && items.length > 0 && (
            <div className="grid gap-1.5" style={{ marginTop: 10 }}>
              {items.slice(0, 3).map((b, i) => (
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
          {type === "Media" && (
            <div
              className="flex items-center justify-center text-[11px] text-muted"
              style={{ marginTop: 10, height: 90, background: "var(--surface-2)", border: "1px dashed var(--border-strong)" }}
            >
              imagen / video
            </div>
          )}
        </div>
        <div className="mono text-[10px] text-muted" style={{ marginTop: 10 }}>
          ~{Math.max(1, body.length)} caracteres · {items.length} elementos
        </div>
      </div>
    </div>
  );
}
