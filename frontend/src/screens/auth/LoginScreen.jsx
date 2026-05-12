import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { Field } from "../../components/ui/Field.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Logo } from "../../components/Logo.jsx";
import { I } from "../../components/Icons.jsx";
import { useAuth } from "../../lib/auth.jsx";
import { useToast } from "../../lib/toast.jsx";
import { ForgotPasswordModal } from "../../modals";

// Login mock: the "Demo · Entrar como" toggle picks which role to log in as.
// The form fields are pre-populated so the demo opens in one click.

const STATS = [
  { k: "Sesiones activas", v: "3 / 3" },
  { k: "Operadores", v: "06" },
  { k: "Mensajes hoy", v: "57.984" },
];

export function LoginScreen() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("admin");
  const [pw, setPw] = useState("••••••••••");
  const [as, setAs] = useState("admin");
  const [forgotOpen, setForgotOpen] = useState(false);

  const onLogin = () => {
    login(as);
    navigate(as === "admin" ? "/a" : "/u");
  };

  return (
    <div className="min-h-screen grid" style={{ gridTemplateColumns: "1fr 520px", background: "var(--bg)" }}>
      <BrandPanel />
      <FormPanel
        username={username} setUsername={setUsername}
        pw={pw} setPw={setPw}
        as={as} setAs={setAs}
        onLogin={onLogin}
        onForgot={() => setForgotOpen(true)}
      />

      {forgotOpen && (
        <ForgotPasswordModal
          onClose={() => setForgotOpen(false)}
          onSubmit={(email) => toast.ok(`Enviamos instrucciones a ${email}.`)}
        />
      )}
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="flex flex-col" style={{ padding: "48px 56px", borderRight: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2.5">
        <Logo />
        <span className="text-sm font-semibold" style={{ letterSpacing: "-0.01em" }}>
          Mensajería · WSP Control
        </span>
      </div>
      <div className="flex-1 flex items-center">
        <div style={{ maxWidth: 520 }}>
          <h1 className="m-0" style={{ fontSize: 48, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            Plataforma de gestión<br />de mensajería WSP.
          </h1>
          <p className="text-muted" style={{ margin: "20px 0 0", fontSize: 15, maxWidth: 480, lineHeight: 1.55 }}>
            Conecta sesiones por Baileys, gestiona operadores, programa envíos masivos con listas cliceables, botones,
            imágenes y video. Todo desde un mismo panel, con auditoría completa.
          </p>
          <div className="grid" style={{ marginTop: 36, gridTemplateColumns: "repeat(3,1fr)", gap: 18, maxWidth: 520 }}>
            {STATS.map((s) => (
              <div key={s.k} style={{ paddingTop: 14, borderTop: "1px solid var(--border-strong)" }}>
                <div className="mono" style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }}>{s.v}</div>
                <div className="text-[11px] text-muted uppercase" style={{ letterSpacing: "0.04em", marginTop: 4 }}>
                  {s.k}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mono text-[11px] text-muted">v. 2.4.1 · build 2026.05.11 · status: operacional</div>
    </div>
  );
}

function FormPanel({ username, setUsername, pw, setPw, as, setAs, onLogin, onForgot }) {
  return (
    <div className="flex flex-col justify-center" style={{ padding: "48px 56px", background: "var(--surface)" }}>
      <div style={{ maxWidth: 380, width: "100%", margin: "0 auto" }}>
        <div className="text-[11px] font-medium uppercase text-muted" style={{ letterSpacing: "0.06em" }}>
          Acceso · panel interno
        </div>
        <h2 className="text-2xl font-semibold" style={{ margin: "10px 0 28px", letterSpacing: "-0.02em" }}>
          Inicia sesión
        </h2>

        <div className="grid gap-3.5">
          <Field label="Usuario">
            <Input value={username} onChange={(e) => setUsername(e.target.value)} icon={<I.user1 size={14} />} />
          </Field>
          <Field label="Contraseña">
            <Input value={pw} onChange={(e) => setPw(e.target.value)} type="password" icon={<I.shield size={14} />} />
          </Field>

          <RolePicker as={as} setAs={setAs} />

          <Button variant="accent" size="lg" onClick={onLogin} style={{ width: "100%", justifyContent: "center" }}>
            Entrar →
          </Button>

          <div className="flex justify-between text-xs text-muted">
            <button
              type="button"
              onClick={onForgot}
              className="border-none bg-transparent cursor-pointer p-0"
              style={{ color: "inherit", font: "inherit" }}
            >
              ¿Olvidaste tu contraseña?
            </button>
            <span>Soporte · TI</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RolePicker({ as, setAs }) {
  return (
    <div style={{ padding: "10px 12px", background: "var(--surface-2)", border: "1px dashed var(--border-strong)" }}>
      <div className="text-[11px] text-muted uppercase" style={{ letterSpacing: "0.04em", marginBottom: 6 }}>
        Demo · Entrar como
      </div>
      <div className="flex gap-1.5">
        {[
          { k: "admin", l: "Administrador" },
          { k: "user", l: "Operador" },
        ].map((o) => (
          <button
            key={o.k}
            onClick={() => setAs(o.k)}
            className="flex-1 text-xs font-medium cursor-pointer"
            style={{
              padding: "8px 10px",
              border: `1px solid ${as === o.k ? "var(--ink)" : "var(--border-strong)"}`,
              background: as === o.k ? "var(--ink)" : "var(--surface)",
              color: as === o.k ? "#fff" : "var(--ink)",
            }}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}
