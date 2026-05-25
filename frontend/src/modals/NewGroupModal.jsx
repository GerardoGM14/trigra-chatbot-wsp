import { useState } from "react";
import { Button } from "../components/ui/Button.jsx";
import { Field } from "../components/ui/Field.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Select } from "../components/ui/Select.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";
import { useCreateGroup } from "../hooks/api/useGroups.js";
import { useMutationError } from "../hooks/useMutationFeedback.js";
import { useToast } from "../lib/toast.jsx";

const TAGS = ["Clientes", "Prospectos", "Campañas", "Soporte", "VIP"];
const PALETTE = ["#D97757", "#2540D9", "#7C3AED", "#0F766E", "#B45309", "#6B6862"];
const SOURCES = [
  { k: "empty", l: "Grupo vacío", d: "Agrega contactos manualmente." },
  { k: "csv", l: "Importar CSV", d: "Sube un archivo .csv." },
  { k: "filter", l: "Desde otro grupo", d: "Filtra con etiquetas." },
];

// Slugifica el nombre para crear el `slug` que pide el backend.
function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || `grupo_${Date.now().toString().slice(-5)}`;
}

export function NewGroupModal({ onClose, onCreated }) {
  const { toast } = useToast();
  const createMutation = useCreateGroup();
  const onError = useMutationError("No se pudo crear el grupo.");

  const [name, setName] = useState("");
  const [tag, setTag] = useState("Clientes");
  const [desc, setDesc] = useState("");
  const [source, setSource] = useState("empty");

  const create = (close) => {
    if (!name.trim() || createMutation.isPending) return;
    createMutation.mutate(
      { slug: `grp_${slugify(name)}`, name: name.trim(), tag },
      {
        onSuccess: (group) => {
          toast.ok(`Grupo "${group.name}" creado.`);
          onCreated?.(group);
          close();
        },
        onError,
      },
    );
  };

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
            onClick={() => create(close)}
            disabled={!name.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? "Creando…" : "Crear grupo"}
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
