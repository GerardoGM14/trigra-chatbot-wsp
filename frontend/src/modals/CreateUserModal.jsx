import { useState } from "react";
import { I } from "../components/Icons.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Field } from "../components/ui/Field.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Overlay } from "../components/overlays/Overlay.jsx";
import { useCreateUser } from "../hooks/api/useUsers.js";
import { useMutationError } from "../hooks/useMutationFeedback.js";
import { useToast } from "../lib/toast.jsx";

// "Nuevo usuario" — bespoke layout. POST a /api/users; al éxito refresca la
// lista (TanStack Query invalida el cache) y cierra el modal con su animación.

export function CreateUserModal({ onClose }) {
  const { toast } = useToast();
  const createMutation = useCreateUser();
  const onMutationError = useMutationError("No se pudo crear el usuario.");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("Tk9-fja7-Lp22");
  const [role, setRole] = useState("Operador");
  const [closing, setClosing] = useState(false);
  const [perm, setPerm] = useState({ envio: true, plantillas: true, contactos: true, reportes: false });
  const close = () => {
    setClosing(true);
    setTimeout(onClose, 180);
  };

  const valid = name.trim() && email.includes("@") && username.length >= 3 && pw.length >= 8;

  const submit = () => {
    if (!valid || createMutation.isPending) return;
    createMutation.mutate(
      { name: name.trim(), email: email.trim(), username: username.trim(), password: pw, role },
      {
        onSuccess: () => {
          toast.ok(`Usuario "${name}" creado.`);
          close();
        },
        onError: onMutationError,
      },
    );
  };

  return (
    <Overlay closing={closing} zIndex={50} onBackdropClick={close}>
      <div
        className={`${closing ? "anim-rise-out" : "anim-rise-in"} bg-surface`}
        style={{ width: 560, border: "1px solid var(--border-strong)" }}
      >
        <div className="flex justify-between items-center px-[22px] py-4 border-b border-border">
          <div>
            <h3 className="m-0 text-[15px] font-semibold">Crear nuevo usuario</h3>
            <p className="mt-0.5 mb-0 text-xs text-muted">El usuario recibirá sus credenciales por correo seguro.</p>
          </div>
          <button onClick={close} className="border-none bg-transparent cursor-pointer p-1.5">
            <I.x size={16} />
          </button>
        </div>
        <div className="p-[22px] grid gap-4">
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Field label="Nombre completo">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Juan Pérez" />
            </Field>
            <Field label="Correo corporativo">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@empresa.pe" />
            </Field>
          </div>
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Field label="Usuario de acceso" hint="Mínimo 4 caracteres. Sin espacios.">
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="j.perez" />
            </Field>
            <Field label="Contraseña inicial" hint="El usuario deberá cambiarla al primer ingreso.">
              <div className="flex gap-1.5">
                <Input value={pw} onChange={(e) => setPw(e.target.value)} style={{ flex: 1 }} />
                <Button
                  icon={<I.refresh size={14} />}
                  title="Regenerar"
                  onClick={() => setPw("Pw-" + Math.random().toString(36).slice(2, 10))}
                />
              </div>
            </Field>
          </div>
          <Field label="Rol asignado">
            <div className="flex gap-2">
              {[
                { r: "Operador", d: "Crea y ejecuta campañas propias" },
                { r: "Supervisor", d: "Ve campañas de su equipo" },
              ].map((o) => (
                <button
                  key={o.r}
                  onClick={() => setRole(o.r)}
                  className="text-left flex-1 cursor-pointer"
                  style={{
                    padding: "12px 14px",
                    border: `1px solid ${role === o.r ? "var(--ink)" : "var(--border-strong)"}`,
                    background: role === o.r ? "var(--surface-2)" : "var(--surface)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center justify-center"
                      style={{
                        width: 14,
                        height: 14,
                        border: `1.5px solid ${role === o.r ? "var(--ink)" : "var(--muted-2)"}`,
                        borderRadius: "50%",
                      }}
                    >
                      {role === o.r && <span style={{ width: 6, height: 6, background: "var(--ink)", borderRadius: "50%" }} />}
                    </span>
                    <span className="text-[13px] font-medium">{o.r}</span>
                  </div>
                  <div className="text-[11px] text-muted mt-1.5" style={{ marginLeft: 22 }}>{o.d}</div>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Permisos">
            <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {[
                ["envio", "Envío de campañas"],
                ["plantillas", "Gestionar plantillas"],
                ["contactos", "Editar contactos y grupos"],
                ["reportes", "Ver reportes globales"],
              ].map(([k, l]) => (
                <label
                  key={k}
                  className="flex gap-2.5 items-center cursor-pointer"
                  style={{ padding: "8px 10px", border: "1px solid var(--border)" }}
                  onClick={() => setPerm({ ...perm, [k]: !perm[k] })}
                >
                  <span
                    className="inline-flex items-center justify-center"
                    style={{
                      width: 14,
                      height: 14,
                      border: `1.5px solid ${perm[k] ? "var(--ink)" : "var(--muted-2)"}`,
                      background: perm[k] ? "var(--ink)" : "transparent",
                    }}
                  >
                    {perm[k] && <I.check size={10} stroke="#fff" />}
                  </span>
                  <span className="text-[13px]">{l}</span>
                </label>
              ))}
            </div>
          </Field>
        </div>
        <div className="flex justify-end gap-2 px-[22px] py-3.5 border-t border-border bg-surface-2">
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button variant="primary" onClick={submit} disabled={!valid || createMutation.isPending}>
            {createMutation.isPending ? "Creando…" : "Crear usuario"}
          </Button>
        </div>
      </div>
    </Overlay>
  );
}
