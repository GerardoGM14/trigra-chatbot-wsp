import { useState } from "react";
import { Button } from "../components/ui/Button.jsx";
import { Field } from "../components/ui/Field.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Select } from "../components/ui/Select.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";

const TAGS = ["clientes", "prospectos", "campañas", "soporte", "vip"];
const PALETTE = ["#D97757", "#2540D9", "#7C3AED", "#0F766E", "#B45309", "#6B6862"];
const SOURCES = [
  { k: "empty", l: "Grupo vacío", d: "Agrega contactos manualmente." },
  { k: "csv", l: "Importar CSV", d: "Sube un archivo .csv." },
  { k: "filter", l: "Desde otro grupo", d: "Filtra con etiquetas." },
];

export function NewGroupModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("clientes");
  const [desc, setDesc] = useState("");
  const [source, setSource] = useState("empty");
  return (
    <ModalShell
      title="Nuevo grupo de contactos"
      subtitle="Los grupos te permiten segmentar campañas y reutilizar audiencias."
      width={560}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button
            variant="accent"
            onClick={() => { onCreate && onCreate({ name, tag }); close(); }}
            disabled={!name}
          >
            Crear grupo
          </Button>
        </>
      )}
    >
      <div className="grid gap-4">
        <Field label="Nombre del grupo" hint="Aparecerá en la lista lateral y al elegir destinatarios.">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Clientes VIP · Lima" />
        </Field>
        <div className="grid gap-3.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <Field label="Etiqueta principal">
            <Select value={tag} onChange={(e) => setTag(e.target.value)}>
              {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Color (interno)">
            <div className="flex gap-1.5 pt-1">
              {PALETTE.map((c) => (
                <span
                  key={c}
                  className="cursor-pointer"
                  style={{ width: 22, height: 22, background: c, border: "1px solid var(--border-strong)" }}
                />
              ))}
            </div>
          </Field>
        </div>
        <Field label="Descripción (opcional)">
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Notas internas sobre este grupo…" />
        </Field>
        <Field label="Cómo agregar contactos" hint="Podrás cambiar la fuente cuando quieras.">
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
            {SOURCES.map((o) => (
              <button
                key={o.k}
                onClick={() => setSource(o.k)}
                className="text-left cursor-pointer"
                style={{
                  padding: "10px 12px",
                  border: source === o.k ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                  background: source === o.k ? "var(--accent-soft)" : "var(--surface)",
                  fontFamily: "inherit",
                }}
              >
                <div className="text-[13px] font-semibold">{o.l}</div>
                <div className="text-[11px] text-muted mt-1">{o.d}</div>
              </button>
            ))}
          </div>
        </Field>
      </div>
    </ModalShell>
  );
}
