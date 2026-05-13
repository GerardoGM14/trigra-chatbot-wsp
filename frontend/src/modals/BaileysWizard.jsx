import { useState, useEffect } from "react";
import { I } from "../components/Icons.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Field } from "../components/ui/Field.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Overlay } from "../components/overlays/Overlay.jsx";
import { FakeQR } from "../screens/shared/FakeQR.jsx";

// 3-step wizard for linking a new WhatsApp session.
//   1. Name the device.
//   2. Scan the QR (auto-refreshes every 45s, fake "connected" after ~12s).
//   3. Confirmation + finish.
//
// No onBackdropClick on the Overlay: a multi-step flow shouldn't discard
// progress on a stray click outside — close only via X or Cancelar.

export function BaileysWizard({ onClose, onConnect }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("Mi celular");
  const [num, setNum] = useState("");
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 9999));
  const [secondsLeft, setSecondsLeft] = useState(45);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (step !== 2) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSecondsLeft(45);
    const i = setInterval(
      () =>
        setSecondsLeft((s) => {
          if (s <= 1) {
            setSeed(Math.floor(Math.random() * 9999));
            return 45;
          }
          return s - 1;
        }),
      1000,
    );
    const t = setTimeout(() => {
      const fakeNum = num || `+51 9${Math.floor(10000000 + Math.random() * 89999999)}`;
      setNum(fakeNum);
      setStep(3);
    }, 12000);
    return () => {
      clearInterval(i);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const close = () => {
    setClosing(true);
    setTimeout(() => onClose(), 180);
  };

  const finish = () => {
    const fakeNum = num || `+51 9${Math.floor(10000000 + Math.random() * 89999999)}`;
    onConnect({
      id: "sess_" + Math.random().toString(36).slice(2, 8),
      num: fakeNum,
      status: "Conectado",
      quality: "Alta",
      battery: 92,
      since: "00:00:04",
      platform: name,
      primary: false,
    });
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
          {step === 2 && <Step2 seed={seed} setSeed={setSeed} secondsLeft={secondsLeft} />}
          {step === 3 && <Step3 name={name} num={num} />}
        </div>

        <div className="flex justify-between gap-2 px-[22px] py-3.5 border-t border-border bg-surface-2">
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <div className="flex gap-2">
            {step > 1 && step < 3 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>← Atrás</Button>
            )}
            {step === 1 && <Button variant="primary" onClick={() => setStep(2)}>Generar QR →</Button>}
            {step === 2 && <Button variant="primary" onClick={() => setStep(3)}>Ya escaneé el código →</Button>}
            {step === 3 && <Button variant="accent" onClick={finish}>Finalizar</Button>}
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

function Step2({ seed, setSeed, secondsLeft }) {
  return (
    <div className="anim-fade-in grid items-center gap-6" style={{ gridTemplateColumns: "240px 1fr" }}>
      <div className="relative p-2" style={{ border: "1px solid var(--border-strong)", background: "#fff" }}>
        <FakeQR seed={seed} size={240} />
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
            <div className="text-xs font-semibold">Esperando vinculación…</div>
            <div className="mono text-[11px] text-muted mt-0.5">
              El QR se renueva en {String(secondsLeft).padStart(2, "0")}s
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setSeed(Math.floor(Math.random() * 9999))}>
            Regenerar
          </Button>
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
        Tu número {num || "+51 9XX XXX XXX"} ya puede enviar mensajes. Mantén el teléfono encendido durante las
        campañas.
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
        <Cell k="Número" v={<span className="mono">{num || "+51 9XX XXX XXX"}</span>} />
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
