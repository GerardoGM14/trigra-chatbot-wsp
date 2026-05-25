import { useState } from "react";
import { Button } from "../components/ui/Button.jsx";
import { Field } from "../components/ui/Field.jsx";
import { Input } from "../components/ui/Input.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";
import { useUpdateGroup } from "../hooks/api/useGroups.js";
import { useMutationError } from "../hooks/useMutationFeedback.js";
import { useToast } from "../lib/toast.jsx";
import { num, timeAgo } from "../lib/format.js";

export function EditGroupModal({ group, onClose }) {
  const { toast } = useToast();
  const updateMutation = useUpdateGroup();
  const onError = useMutationError("No se pudo actualizar el grupo.");

  const [name, setName] = useState(group.name);
  const [tag, setTag] = useState(group.tag);

  const save = (close) => {
    if (!name.trim() || updateMutation.isPending) return;
    updateMutation.mutate(
      { id: group.id, name: name.trim(), tag: tag.trim() },
      {
        onSuccess: () => {
          toast.ok("Grupo actualizado.");
          close();
        },
        onError,
      },
    );
  };

  return (
    <ModalShell
      title={`Editar grupo · ${group.name}`}
      width={460}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={() => save(close)}
            disabled={!name.trim() || updateMutation.isPending}
          >
            {updateMutation.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </>
      )}
    >
      <div className="grid gap-3.5">
        <Field label="Nombre del grupo">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Etiqueta principal">
          <Input value={tag} onChange={(e) => setTag(e.target.value)} />
        </Field>
        <div
          className="text-xs"
          style={{ padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          <div className="flex justify-between">
            <span className="text-muted">Contactos</span>
            <span className="mono font-medium">{num(group.count)}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-muted">Última actualización</span>
            <span>{timeAgo(group.updated)}</span>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
