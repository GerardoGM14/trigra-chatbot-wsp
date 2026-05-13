import { useState } from "react";
import { I } from "../components/Icons.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Field } from "../components/ui/Field.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Select } from "../components/ui/Select.jsx";
import { Stat } from "../components/ui/Stat.jsx";
import { Toggle } from "../components/ui/Toggle.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";

// 3-step CSV import: file pick → column mapping → confirm.
// The mock "detects" 1.204 contacts regardless of what gets dropped, so the
// later steps can render real-looking data without parsing anything.

export function ImportCsvModal({ onClose, onDone }) {
  const [step, setStep] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [groupName, setGroupName] = useState("Clientes mayo 2026");
  const [mapping, setMapping] = useState({ phone: "col_1", name: "col_2", tag: "col_3" });

  return (
    <ModalShell
      title="Importar contactos desde CSV"
      subtitle={`Paso ${step} de 3 · ${["Subir archivo", "Mapear columnas", "Confirmar"][step - 1]}`}
      width={680}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          {step > 1 && <Button variant="ghost" onClick={() => setStep(step - 1)}>← Atrás</Button>}
          {step < 3 && (
            <Button variant="primary" onClick={() => setStep(step + 1)} disabled={step === 1 && !file}>
              Continuar →
            </Button>
          )}
          {step === 3 && (
            <Button
              variant="accent"
              onClick={() => {
                onDone && onDone({ groupName, count: 1204 });
                close();
              }}
            >
              Importar 1.204 contactos
            </Button>
          )}
        </>
      )}
    >
      <div className="flex h-0.5 bg-border" style={{ margin: "-22px -22px 22px" }}>
        <div style={{ flex: step / 3, background: "var(--accent)", transition: "flex 240ms ease-out" }} />
        <div style={{ flex: 1 - step / 3 }} />
      </div>

      {step === 1 && (
        <Step1Upload
          dragOver={dragOver}
          setDragOver={setDragOver}
          file={file}
          setFile={setFile}
        />
      )}
      {step === 2 && <Step2Mapping mapping={mapping} setMapping={setMapping} />}
      {step === 3 && <Step3Confirm groupName={groupName} setGroupName={setGroupName} />}
    </ModalShell>
  );
}

function Step1Upload({ dragOver, setDragOver, file, setFile }) {
  const drop = () => setFile({ name: "contactos_mayo_2026.csv", size: "218 KB", rows: 1204 });
  return (
    <div className="anim-fade-in grid gap-3.5">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); drop(); }}
        onClick={drop}
        className="text-center cursor-pointer"
        style={{
          border: `1.5px dashed ${dragOver ? "var(--accent)" : "var(--border-strong)"}`,
          padding: "38px 18px",
          background: dragOver ? "var(--accent-soft)" : "var(--surface-2)",
        }}
      >
        <I.upload size={22} />
        <div className="text-sm font-semibold mt-2.5">Arrastra tu archivo CSV aquí</div>
        <div className="text-xs text-muted mt-1">o haz clic para seleccionarlo · máx. 10 MB · UTF-8</div>
      </div>
      {file && (
        <div
          className="anim-fade-in flex items-center gap-3 bg-surface"
          style={{ padding: "10px 12px", border: "1px solid var(--border)" }}
        >
          <I.tpl size={16} />
          <div className="flex-1">
            <div className="text-[13px] font-medium">{file.name}</div>
            <div className="mono text-[11px] text-muted mt-0.5">
              {file.size} · {file.rows.toLocaleString("es-PE")} filas detectadas
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setFile(null)}>Quitar</Button>
        </div>
      )}
      <div
        className="text-xs"
        style={{ padding: "10px 12px", background: "var(--info-soft)", borderLeft: "2px solid var(--info)", color: "var(--ink-2)" }}
      >
        Formato esperado: <span className="mono">numero, nombre, etiqueta</span>. La primera fila debe contener los
        encabezados.
      </div>
    </div>
  );
}

const SAMPLE_ROWS = [
  ["+51 912 445 008", "Carla Vásquez", "premium"],
  ["+51 988 112 904", "Jorge Aguilar", "premium"],
  ["+51 945 770 211", "Andrea Quispe", "basico"],
  ["+51 999 802 415", "Luis Cárdenas", "premium"],
  ["+51 921 446 092", "Patricia Tello", "basico"],
];

function Step2Mapping({ mapping, setMapping }) {
  const set = (k, v) => setMapping({ ...mapping, [k]: v });
  return (
    <div className="anim-fade-in grid gap-4">
      <div className="grid gap-2.5" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <Field label="Número de WSP">
          <Select value={mapping.phone} onChange={(e) => set("phone", e.target.value)}>
            <option value="col_1">col 1 · "numero"</option>
            <option value="col_2">col 2 · "nombre"</option>
            <option value="col_3">col 3 · "etiqueta"</option>
          </Select>
        </Field>
        <Field label="Nombre">
          <Select value={mapping.name} onChange={(e) => set("name", e.target.value)}>
            <option value="col_1">col 1 · "numero"</option>
            <option value="col_2">col 2 · "nombre"</option>
            <option value="col_3">col 3 · "etiqueta"</option>
          </Select>
        </Field>
        <Field label="Etiqueta">
          <Select value={mapping.tag} onChange={(e) => set("tag", e.target.value)}>
            <option value="">— ninguna —</option>
            <option value="col_1">col 1 · "numero"</option>
            <option value="col_2">col 2 · "nombre"</option>
            <option value="col_3">col 3 · "etiqueta"</option>
          </Select>
        </Field>
      </div>
      <div>
        <div className="text-[11px] font-medium text-muted uppercase mb-2" style={{ letterSpacing: "0.04em" }}>
          Vista previa · primeras 5 filas
        </div>
        <div style={{ border: "1px solid var(--border)" }}>
          <div
            className="mono grid bg-surface-2 text-[11px] text-muted"
            style={{ gridTemplateColumns: "1.4fr 1.2fr 0.8fr", padding: "8px 12px", borderBottom: "1px solid var(--border)" }}
          >
            <span>numero</span>
            <span>nombre</span>
            <span>etiqueta</span>
          </div>
          {SAMPLE_ROWS.map((row, i) => (
            <div
              key={i}
              className="mono grid text-xs"
              style={{
                gridTemplateColumns: "1.4fr 1.2fr 0.8fr",
                padding: "8px 12px",
                borderTop: i > 0 ? "1px solid var(--border)" : "none",
              }}
            >
              <span>{row[0]}</span>
              <span className="text-ink">{row[1]}</span>
              <span className="text-muted">{row[2]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step3Confirm({ groupName, setGroupName }) {
  return (
    <div className="anim-fade-in grid gap-4">
      <Field label="Crear como nuevo grupo">
        <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} />
      </Field>
      <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <Stat label="Filas detectadas" value="1.204" />
        <Stat label="Válidos WSP" value="1.189" sub="98,7%" />
        <Stat label="Duplicados" value="11" sub="se omitirán" />
        <Stat label="Opt-out" value="4" sub="excluidos" />
      </div>
      <Field label="Opciones">
        <div className="grid gap-2">
          <Toggle label="Validar números antes de importar" defaultChecked />
          <Toggle label="Omitir duplicados con grupos existentes" defaultChecked />
          <Toggle label="Enviar mensaje de bienvenida automático" />
        </div>
      </Field>
    </div>
  );
}
