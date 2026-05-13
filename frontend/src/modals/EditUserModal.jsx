import { useState } from "react";
import { Button } from "../components/ui/Button.jsx";
import { Field } from "../components/ui/Field.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Select } from "../components/ui/Select.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";

export function EditUserModal({ user, onClose, onSave }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.status);
  return (
    <ModalShell
      title={`Editar · ${user.name}`}
      subtitle={<span className="mono">{user.id}</span>}
      width={520}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={() => { onSave?.({ ...user, name, email, role, status }); close(); }}
          >
            Guardar cambios
          </Button>
        </>
      )}
    >
      <div className="grid gap-3.5">
        <Field label="Nombre completo">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Correo corporativo">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <Field label="Rol">
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option>Operador</option>
              <option>Supervisor</option>
            </Select>
          </Field>
          <Field label="Estado">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Activo</option>
              <option>Suspendido</option>
              <option>Invitado</option>
            </Select>
          </Field>
        </div>
      </div>
    </ModalShell>
  );
}
