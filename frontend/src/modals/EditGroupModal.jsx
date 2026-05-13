import { useState } from "react";
import { Button } from "../components/ui/Button.jsx";
import { Field } from "../components/ui/Field.jsx";
import { Input } from "../components/ui/Input.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";

export function EditGroupModal({ group, onClose, onSave }) {
  const [name, setName] = useState(group.name);
  const [tag, setTag] = useState(group.tag);
  return (
    <ModalShell
      title={`Editar grupo · ${group.name}`}
      width={460}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button variant="primary" onClick={() => { onSave?.({ ...group, name, tag }); close(); }}>Guardar</Button>
        </>
      )}
    >
      <div className="grid gap-3.5">
        <Field label="Nombre del grupo">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Etiqueta principal">
          <Input value={tag} onChange={(e) => setTag(e.target.value)} />
        </Field>
        <div
          className="text-xs"
          style={{ padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          <div className="flex justify-between">
            <span className="text-muted">Contactos</span>
            <span className="mono font-medium">{group.count.toLocaleString("es-PE")}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-muted">Última actualización</span>
            <span>{group.updated}</span>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
