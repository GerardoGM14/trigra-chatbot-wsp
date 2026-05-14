import { useState } from "react";
import { Button } from "../components/ui/Button.jsx";
import { Field } from "../components/ui/Field.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Select } from "../components/ui/Select.jsx";
import { Toggle } from "../components/ui/Toggle.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";

// Generic filters dialog. Caller passes a `fields` schema of:
//   { key, label, type: "select"|"toggle"|"text", options?, hint?, ... }
// The current values come back via onApply(values).

export function FiltersModal({ title = "Filtros avanzados", fields, initial = {}, onClose, onApply }) {
  const [values, setValues] = useState(initial);
  const set = (k, v) => setValues((s) => ({ ...s, [k]: v }));
  return (
    <ModalShell
      title={title}
      subtitle="Combina varios criterios para acotar los resultados."
      width={520}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={() => setValues({})}>Limpiar</Button>
          <div className="flex-1" />
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button variant="primary" onClick={() => { onApply?.(values); close(); }}>Aplicar filtros</Button>
        </>
      )}
    >
      <div className="grid gap-3.5">
        {fields.map((f) => (
          <Field key={f.key} label={f.label} hint={f.hint}>
            {f.type === "select" ? (
              <Select value={values[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)}>
                <option value="">— cualquier —</option>
                {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            ) : f.type === "toggle" ? (
              <Toggle label={f.toggleLabel} checked={!!values[f.key]} onChange={(v) => set(f.key, v)} />
            ) : (
              <Input value={values[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} />
            )}
          </Field>
        ))}
      </div>
    </ModalShell>
  );
}
