import { useState } from "react";
import { I } from "../components/Icons.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Field } from "../components/ui/Field.jsx";
import { Input } from "../components/ui/Input.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";

// Login → "¿Olvidaste tu contraseña?". Submit gates on a naive "@" check; the
// real validation happens server-side when the backend lands.

export function ForgotPasswordModal({ onClose, onSubmit }) {
  const [email, setEmail] = useState("");
  return (
    <ModalShell
      title="Recuperar acceso"
      subtitle="Te enviaremos un enlace para restablecer tu contraseña al correo registrado."
      width={460}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button
            variant="primary"
            disabled={!email.includes("@")}
            onClick={() => { onSubmit?.(email); close(); }}
          >
            Enviar enlace
          </Button>
        </>
      )}
    >
      <div className="grid gap-3">
        <Field label="Correo corporativo">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@empresa.pe"
            icon={<I.user1 size={14} />}
          />
        </Field>
        <div
          className="text-xs"
          style={{ padding: "10px 12px", background: "var(--info-soft)", borderLeft: "2px solid var(--info)", color: "var(--ink-2)" }}
        >
          Si tu correo está registrado, recibirás instrucciones en los próximos minutos. Revisa también tu carpeta de
          spam.
        </div>
      </div>
    </ModalShell>
  );
}
