import { useState } from "react";
import { I } from "../components/Icons.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Field } from "../components/ui/Field.jsx";
import { Input } from "../components/ui/Input.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";

// "Enviar prueba" from the compose flow — asks for a single phone number and
// fires onSend(phone). Validates with a loose digit-count check (≥9 digits)
// before enabling the submit button.

export function SendTestModal({ name, onClose, onSend }) {
  const [phone, setPhone] = useState("+51 ");
  return (
    <ModalShell
      title={`Enviar prueba · ${name}`}
      subtitle="Recibirás el mensaje exacto en el número que indiques."
      onClose={onClose}
      width={460}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button
            variant="primary"
            disabled={phone.replace(/\D/g, "").length < 9}
            onClick={() => {
              onSend(phone);
              close();
            }}
          >
            Enviar prueba
          </Button>
        </>
      )}
    >
      <Field label="Número de prueba" hint="Incluye el código de país.">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} icon={<I.contact size={14} />} />
      </Field>
    </ModalShell>
  );
}
