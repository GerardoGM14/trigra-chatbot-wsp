import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/Button.jsx";
import { Field } from "../../../components/ui/Field.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Toggle } from "../../../components/ui/Toggle.jsx";
import { I } from "../../../components/Icons.jsx";
import {
  useFlow,
  useUpdateFlow,
  useDeleteFlow,
  useCreateNode,
  useUpdateNode,
  useDeleteNode,
  useSetStartNode,
} from "../../../hooks/api/useFlows.js";
import { useMutationError } from "../../../hooks/useMutationFeedback.js";
import { useToast } from "../../../lib/toast.jsx";
import { ConfirmModal } from "../../../modals";

// Editor de un flow: metadatos + lista de nodos editables. Para mantenerlo
// simple, **no es un editor visual drag-drop** — usamos formularios con un
// dropdown "Siguiente nodo" para encadenar.

export function FlowEditor({ flowId, onDeleted }) {
  const { toast } = useToast();
  const onError = useMutationError();

  const flowQuery = useFlow(flowId);
  const updateFlow = useUpdateFlow();
  const deleteFlow = useDeleteFlow();
  const createNode = useCreateNode(flowId);
  const setStartNode = useSetStartNode(flowId);

  const [confirmDelete, setConfirmDelete] = useState(false);

  if (flowQuery.isLoading) {
    return <div className="text-muted text-[13px]" style={{ padding: 32 }}>Cargando flow…</div>;
  }
  if (flowQuery.isError || !flowQuery.data) {
    return <div className="text-danger text-[13px]" style={{ padding: 32 }}>No se pudo cargar el flow.</div>;
  }

  const flow = flowQuery.data;

  return (
    <div className="grid gap-4" style={{ padding: 18 }}>
      <FlowMeta
        flow={flow}
        onSave={(patch) =>
          updateFlow.mutate({ id: flowId, ...patch }, {
            onSuccess: () => toast.ok("Flow actualizado."),
            onError,
          })
        }
        saving={updateFlow.isPending}
      />

      <div className="flex justify-between items-end">
        <div>
          <h3 className="m-0 text-sm font-semibold">Nodos</h3>
          <p className="m-0 mt-0.5 text-xs text-muted">
            El bot empieza por el nodo marcado como ⭐ inicial.
          </p>
        </div>
        <Button
          size="sm"
          variant="accent"
          icon={<I.plus size={12} />}
          onClick={() =>
            createNode.mutate(
              { type: "message", body: "Nuevo mensaje" },
              { onSuccess: () => toast.ok("Nodo añadido."), onError },
            )
          }
          disabled={createNode.isPending}
        >
          Nuevo nodo
        </Button>
      </div>

      {flow.nodes.length === 0 ? (
        <div className="text-muted text-[13px] text-center bg-surface-2" style={{ padding: 24, border: "1px solid var(--border)" }}>
          Sin nodos. Crea el primero.
        </div>
      ) : (
        <div className="grid gap-3">
          {flow.nodes.map((node) => (
            <NodeCard
              key={node.id}
              flowId={flowId}
              node={node}
              nodes={flow.nodes}
              isStart={flow.startNodeId === node.id}
              onSetStart={() =>
                setStartNode.mutate(node.id, {
                  onSuccess: () => toast.ok("Nodo inicial actualizado."),
                  onError,
                })
              }
            />
          ))}
        </div>
      )}

      <div
        className="flex justify-end gap-2"
        style={{ paddingTop: 16, borderTop: "1px solid var(--border)", marginTop: 8 }}
      >
        <Button
          variant="ghost"
          icon={<I.trash size={12} />}
          onClick={() => setConfirmDelete(true)}
          style={{ color: "var(--danger)" }}
        >
          Eliminar flow
        </Button>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Eliminar flow"
          message={`Vas a eliminar "${flow.name}" y todos sus nodos. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar flow"
          tone="danger"
          onClose={() => setConfirmDelete(false)}
          onConfirm={() =>
            deleteFlow.mutate(flowId, {
              onSuccess: () => {
                toast.warn(`Flow "${flow.name}" eliminado.`);
                onDeleted?.();
              },
              onError,
            })
          }
        />
      )}
    </div>
  );
}

function FlowMeta({ flow, onSave, saving }) {
  const [name, setName] = useState(flow.name);
  const [trigger, setTrigger] = useState(flow.trigger);
  const [isActive, setIsActive] = useState(flow.isActive);

  // Cuando el flow cambia (cambias de flow seleccionado), re-cargamos campos.
  // Sincronizar props → estado local es exactamente para lo que sirve useEffect.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setName(flow.name);
    setTrigger(flow.trigger);
    setIsActive(flow.isActive);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [flow.id, flow.name, flow.trigger, flow.isActive]);

  const dirty = name !== flow.name || trigger !== flow.trigger || isActive !== flow.isActive;

  return (
    <div className="grid gap-3.5">
      <div className="grid gap-3" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <Field label="Nombre">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Trigger" hint="default · keyword:hola · regex:^precio · fallback">
          <Input value={trigger} onChange={(e) => setTrigger(e.target.value)} />
        </Field>
      </div>
      <div className="flex items-center justify-between">
        <Toggle label={isActive ? "Activo (responde a clientes)" : "Inactivo (no responde)"} checked={isActive} onChange={setIsActive} />
        <Button variant="primary" onClick={() => onSave({ name, trigger, isActive })} disabled={!dirty || saving}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}

function NodeCard({ flowId, node, nodes, isStart, onSetStart }) {
  const { toast } = useToast();
  const onError = useMutationError();
  const updateNode = useUpdateNode(flowId);
  const deleteNode = useDeleteNode(flowId);

  const [type, setType] = useState(node.type);
  const [body, setBody] = useState(node.body);
  const [options, setOptions] = useState(Array.isArray(node.options) ? node.options : []);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setType(node.type);
    setBody(node.body);
    setOptions(Array.isArray(node.options) ? node.options : []);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [node.id, node.type, node.body, node.options]);

  const dirty =
    type !== node.type ||
    body !== node.body ||
    JSON.stringify(options) !== JSON.stringify(node.options ?? []);

  const save = () =>
    updateNode.mutate(
      { id: node.id, type, body, options: type === "menu" ? options : null },
      { onSuccess: () => toast.ok("Nodo guardado."), onError },
    );

  const addOption = () =>
    setOptions([...options, { label: "Nueva opción", value: String(options.length + 1) }]);
  const updateOption = (i, patch) =>
    setOptions(options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  const removeOption = (i) => setOptions(options.filter((_, idx) => idx !== i));

  return (
    <div
      className="grid gap-3 bg-surface"
      style={{
        padding: 14,
        border: `1px solid ${isStart ? "var(--accent)" : "var(--border)"}`,
      }}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {isStart && <Badge tone="accent">⭐ Inicial</Badge>}
          <span className="mono text-[11px] text-muted">{node.id.slice(-8)}</span>
        </div>
        <div className="flex gap-1.5">
          {!isStart && (
            <Button size="sm" variant="ghost" onClick={onSetStart}>Marcar como inicial</Button>
          )}
          <Button size="sm" variant="ghost" icon={<I.trash size={12} />} onClick={() => setConfirm(true)}>
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "180px 1fr" }}>
        <Field label="Tipo">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="message">Mensaje</option>
            <option value="menu">Menú</option>
            <option value="handoff">Handoff (a operador)</option>
            <option value="end">Fin de flow</option>
          </Select>
        </Field>
        <Field label="Mensaje">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="w-full text-[13px] text-ink"
            style={{
              padding: "8px 10px",
              border: "1px solid var(--border-strong)",
              background: "var(--surface)",
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />
        </Field>
      </div>

      {type === "menu" && (
        <Field label="Opciones del menú" hint="El valor es lo que el cliente escribe (ej. '1'). Siguiente nodo: a dónde lleva esa opción.">
          <div className="grid gap-1.5">
            {options.map((opt, i) => (
              <div
                key={i}
                className="grid items-center gap-2 bg-surface-2"
                style={{ gridTemplateColumns: "60px 1fr 1fr 28px", padding: "6px 8px", border: "1px solid var(--border)" }}
              >
                <Input
                  value={opt.value ?? ""}
                  onChange={(e) => updateOption(i, { value: e.target.value })}
                  placeholder="1"
                />
                <Input
                  value={opt.label ?? ""}
                  onChange={(e) => updateOption(i, { label: e.target.value })}
                  placeholder="Ver catálogo"
                />
                <Select
                  value={opt.nextNodeId ?? ""}
                  onChange={(e) => updateOption(i, { nextNodeId: e.target.value || undefined })}
                >
                  <option value="">— sin destino —</option>
                  {nodes.filter((n) => n.id !== node.id).map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.body.slice(0, 30)}…
                    </option>
                  ))}
                </Select>
                <button
                  onClick={() => removeOption(i)}
                  className="border-none bg-transparent cursor-pointer text-muted"
                >
                  <I.trash size={12} />
                </button>
              </div>
            ))}
            <Button size="sm" variant="ghost" icon={<I.plus size={12} />} onClick={addOption}>
              Añadir opción
            </Button>
          </div>
        </Field>
      )}

      <div className="flex justify-end">
        <Button size="sm" variant="primary" onClick={save} disabled={!dirty || updateNode.isPending}>
          {updateNode.isPending ? "Guardando…" : "Guardar nodo"}
        </Button>
      </div>

      {confirm && (
        <ConfirmModal
          title="Eliminar nodo"
          message="Vas a eliminar este nodo. Otros nodos que apunten a él perderán esa conexión."
          confirmLabel="Eliminar"
          tone="danger"
          onClose={() => setConfirm(false)}
          onConfirm={() =>
            deleteNode.mutate(node.id, {
              onSuccess: () => toast.warn("Nodo eliminado."),
              onError,
            })
          }
        />
      )}
    </div>
  );
}
