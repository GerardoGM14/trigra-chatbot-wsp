import { useState } from "react";
import { Button } from "../components/ui/Button.jsx";
import { Field } from "../components/ui/Field.jsx";
import { Input } from "../components/ui/Input.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";

// `policy.type` toggles between "lockout" (attempts + lockMin) and
// "passwordAge" (days). One modal, two layouts.

export function EditSecurityPolicyModal({ policy, onClose, onSave }) {
  const isLockout = policy.type === "lockout";
  const [attempts, setAttempts] = useState(policy.attempts ?? 5);
  const [lockMin, setLockMin] = useState(policy.lockMin ?? 30);
  const [days, setDays] = useState(policy.days ?? 90);
  return (
    <ModalShell
      title={isLockout ? "Bloqueo por intentos fallidos" : "Caducidad de contraseña"}
      width={460}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={() => { onSave?.(isLockout ? { attempts, lockMin } : { days }); close(); }}
          >
            Guardar
          </Button>
        </>
      )}
    >
      {isLockout ? (
        <div className="grid gap-3.5">
          <Field label="Intentos fallidos permitidos" hint="Tras este número, la cuenta se bloquea temporalmente.">
            <Input value={attempts} onChange={(e) => setAttempts(Number(e.target.value) || 0)} type="number" />
          </Field>
          <Field label="Duración del bloqueo (minutos)">
            <Input value={lockMin} onChange={(e) => setLockMin(Number(e.target.value) || 0)} type="number" />
          </Field>
        </div>
      ) : (
        <Field label="Vigencia de la contraseña (días)" hint="Tras este periodo el usuario deberá cambiarla.">
          <Input value={days} onChange={(e) => setDays(Number(e.target.value) || 0)} type="number" />
        </Field>
      )}
    </ModalShell>
  );
}
