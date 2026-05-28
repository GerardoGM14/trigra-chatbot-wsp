import { useState, useEffect } from "react";
import { I } from "../components/Icons.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Field } from "../components/ui/Field.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Overlay } from "../components/overlays/Overlay.jsx";
import { useCreateSession } from "../hooks/api/useSessions.js";
import { useSessionQR } from "../hooks/useSessionQR.js";
import { useMutationError } from "../hooks/useMutationFeedback.js";

// Wizard de vinculación de un nuevo número WhatsApp.
//   1. Identificar el dispositivo (nombre, opcional número)
//   2. El backend arranca Baileys, emite QR por Socket.IO; el wizard lo muestra
//   3. Cuando WhatsApp confirma, mostramos pantalla de éxito
//
// Sin onBackdropClick: un wizard no debería descartar progreso por un clic
// fuera — cerrar solo vía X o Cancelar.

export function BaileysWizard({ onClose, onConnect }) {
  const onError = useMutationError("No se pudo iniciar la sesión.");
  const createMutation = useCreateSession();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("Mi celular");
  const [num, setNum] = useState("");
  const [closing, setClosing] = useState(false);
  // El slug de la sesión creada; se llena al pasar al paso 2.
  const [sessionSlug, setSessionSlug] = useState(null);

  // Hook de tiempo real: emite QR + cambios de estado.
  const { qr, status, expiresAt } = useSessionQR(sessionSlug, {
    onConnected: (payload) => {
      // Cuando WhatsApp confirma, capturamos el número real y avanzamos al paso 3.
      if (payload.phoneNumber) setNum(payload.phoneNumber);
      setStep(3);
    },
  });

  // Cuenta atrás visible del QR (45s). Solo decorativo — Baileys emite uno nuevo
  // automáticamente cuando expira, y `qr` se reemplaza con el nuevo data URL.
  const [secondsLeft, setSecondsLeft] = useState(45);
  useEffect(() => {
    if (step !== 2 || !expiresAt) return undefined;
    const tick = () => {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [step, expiresAt]);

  const close = () => {
    setClosing(true);
    setTimeout(() => onClose(), 180);
  };

  // Paso 1 → 2: crea la sesión en el backend, que arranca Baileys y empieza
  // a emitir QRs.
  const generateQR = () => {
    if (createMutation.isPending) return;
    createMutation.mutate(
      {},
      {
        onSuccess: (session) => {
          setSessionSlug(session.slug);
          setStep(2);
        },
        onError,
      },
    );
  };

  const finish = () => {
    onConnect({ slug: sessionSlug, num, status });
  };

  return (
    <Overlay closing={closing} zIndex={60}>
      <div
        className={`${closing ? "anim-rise-out" : "anim-rise-in"} bg-surface`}
        style={{ width: 620, border: "1px solid var(--border-strong)" }}
      >
        <div className="flex justify-between items-center px-[22px] py-4 border-b border-border">
          <div>
            <div className="mono text-[11px] text-muted uppercase" style={{ letterSpacing: "0.04em" }}>
              Vincular sesión · paso {step} de 3
            </div>
            <h3 className="mt-1 mb-0 text-[15px] font-semibold">
              {step === 1 && "Identifica tu dispositivo"}
              {step === 2 && "Escanea el código QR con tu teléfono"}
              {step === 3 && "Sesión conectada"}
            </h3>
          </div>
          <button onClick={close} className="border-none bg-transparent cursor-pointer p-1.5">
            <I.x size={16} />
          </button>
        </div>

        <div className="flex h-0.5 bg-border">
          <div style={{ flex: step / 3, background: "var(--accent)", transition: "flex 240ms ease-out" }} />
          <div style={{ flex: 1 - step / 3 }} />
        </div>

        <div className="p-6" style={{ minHeight: 340 }}>
          {step === 1 && <Step1 name={name} setName={setName} num={num} setNum={setNum} />}
          {step === 2 && <Step2 qr={qr} secondsLeft={secondsLeft} status={status} />}
          {step === 3 && <Step3 name={name} num={num} />}
        </div>

        <div className="flex justify-between gap-2 px-[22px] py-3.5 border-t border-border bg-surface-2">
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <div className="flex gap-2">
            {step > 1 && step < 3 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>← Atrás</Button>
            )}
            {step === 1 && (
              <Button variant="primary" onClick={generateQR} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Iniciando…" : "Generar QR →"}
              </Button>
            )}
            {step === 2 && (
              <Button variant="ghost" disabled>
                Esperando vinculación…
              </Button>
            )}
            {step === 3 && (
              <Button variant="accent" onClick={finish}>Finalizar</Button>
            )}
          </div>
        </div>
      </div>
    </Overlay>
  );
}

function Step1({ name, setName, num, setNum }) {
  return (
    <div className="anim-fade-in grid gap-[18px]">
      <Field
        label="Nombre del dispositivo"
        hint="Te ayudará a distinguirlo si conectas varios números."
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field
        label="Número de WSP (opcional)"
        hint="Se detecta automáticamente al vincular. Solo para tu referencia."
      >
        <Input value={num} onChange={(e) => setNum(e.target.value)} placeholder="+51 9XX XXX XXX" />
      </Field>
      <div style={{ padding: "12px 14px", background: "var(--info-soft)", borderLeft: "2px solid var(--info)" }}>
        <div className="text-xs font-semibold" style={{ color: "var(--info)" }}>Recomendación</div>
        <div className="text-xs mt-1" style={{ color: "var(--ink-2)" }}>
          Usa un número dedicado para envíos masivos. Mantén el teléfono encendido y con datos activos durante las
          campañas.
        </div>
      </div>
    </div>
  );
}

function Step2({ qr, secondsLeft, status }) {
  return (
    <div className="anim-fade-in grid items-center gap-6" style={{ gridTemplateColumns: "240px 1fr" }}>
      <div className="relative p-2" style={{ border: "1px solid var(--border-strong)", background: "#fff", width: 240, height: 240 }}>
        {qr ? (
          <img src={qr} alt="QR de WhatsApp" style={{ width: "100%", height: "100%", display: "block" }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="spin inline-block text-muted"><I.refresh size={32} /></span>
          </div>
        )}
        <div className="absolute flex items-center justify-center pointer-events-none" style={{ inset: 8 }}>
          <div
            className="flex items-center justify-center"
            style={{ width: 40, height: 40, background: "#fff", border: "2px solid #15140F" }}
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M2 3h12v8H6l-4 3z" stroke="#15140F" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>
      <div className="grid gap-3">
        <ol className="m-0 p-0 list-none grid gap-2.5">
          {[
            "Abre WSP en tu teléfono",
            "Ve a Menú o Configuración",
            "Toca Dispositivos vinculados",
            "Toca Vincular un dispositivo y escanea este QR",
          ].map((s, i) => (
            <li key={i} className="grid gap-2.5 items-start" style={{ gridTemplateColumns: "24px 1fr" }}>
              <span
                className="mono inline-flex items-center justify-center text-[11px]"
                style={{ width: 22, height: 22, border: "1px solid var(--border-strong)" }}
              >
                {i + 1}
              </span>
              <span className="text-[13px]">{s}</span>
            </li>
          ))}
        </ol>
        <div
          className="flex items-center gap-2.5 bg-surface-2"
          style={{ padding: "10px 12px", border: "1px solid var(--border)" }}
        >
          <span className="spin inline-block"><I.refresh size={14} /></span>
          <div className="flex-1">
            <div className="text-xs font-semibold">
              {qr ? "Esperando vinculación…" : "Generando QR…"}
            </div>
            <div className="mono text-[11px] text-muted mt-0.5">
              {qr
                ? `El QR se renueva en ${String(secondsLeft).padStart(2, "0")}s · estado: ${status}`
                : "Conectando con WhatsApp…"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step3({ name, num }) {
  return (
    <div className="anim-rise-in grid place-items-center text-center" style={{ padding: "20px 10px" }}>
      <div
        className="flex items-center justify-center"
        style={{ width: 64, height: 64, border: "2px solid var(--accent)" }}
      >
        <I.check size={32} stroke="var(--accent)" />
      </div>
      <h3 className="text-lg font-semibold" style={{ margin: "18px 0 6px", letterSpacing: "-0.01em" }}>
        Sesión vinculada correctamente
      </h3>
      <p className="m-0 text-muted text-[13px]" style={{ maxWidth: 380 }}>
        Tu número {num || "—"} ya puede enviar mensajes. Mantén el teléfono encendido durante las campañas.
      </p>
      <div
        className="grid bg-surface-2"
        style={{
          marginTop: 18,
          gridTemplateColumns: "repeat(3,auto)",
          gap: 18,
          padding: "14px 22px",
          border: "1px solid var(--border)",
        }}
      >
        <Cell k="Número" v={<span className="mono">{num || "—"}</span>} />
        <Cell k="Dispositivo" v={name} />
        <Cell k="Calidad" v="Alta" />
      </div>
    </div>
  );
}

function Cell({ k, v }) {
  return (
    <div className="text-left">
      <div className="text-[10px] font-medium uppercase text-muted" style={{ letterSpacing: "0.04em" }}>{k}</div>
      <div className="text-[13px] font-medium mt-1">{v}</div>
    </div>
  );
}
