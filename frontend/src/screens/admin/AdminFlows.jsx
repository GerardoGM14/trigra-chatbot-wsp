import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Panel } from "../../components/ui/Panel.jsx";
import { I } from "../../components/Icons.jsx";
import { useFlows, useCreateFlow } from "../../hooks/api/useFlows.js";
import { useMutationError } from "../../hooks/useMutationFeedback.js";
import { useToast } from "../../lib/toast.jsx";
import { FlowList } from "./flows/FlowList.jsx";
import { FlowEditor } from "./flows/FlowEditor.jsx";

// Editor de flows del bot. Layout: lista (280px) + editor (1fr).
//
// Acceso restringido a admin/supervisor (lo enforce el backend; aquí solo es
// la UI). Cualquier operador que abra esta ruta verá la lista pero las
// mutations fallarán con 403.

export function AdminFlows() {
  const { toast } = useToast();
  const onError = useMutationError();

  const flowsQuery = useFlows();
  const createFlow = useCreateFlow();
  const flows = useMemo(() => flowsQuery.data ?? [], [flowsQuery.data]);

  const [activeId, setActiveId] = useState(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!activeId && flows.length > 0) setActiveId(flows[0].id);
  }, [activeId, flows]);

  const onCreate = () =>
    createFlow.mutate(
      { name: "Nuevo flow", trigger: "keyword:", isActive: false },
      {
        onSuccess: (flow) => {
          toast.ok(`Flow "${flow.name}" creado.`);
          setActiveId(flow.id);
        },
        onError,
      },
    );

  return (
    <div className="grid gap-4">
      <Header onCreate={onCreate} creating={createFlow.isPending} />

      <Panel padding={0}>
        <div className="grid" style={{ gridTemplateColumns: "280px 1fr", minHeight: 600 }}>
          <div style={{ borderRight: "1px solid var(--border)", overflowY: "auto", maxHeight: 700 }}>
            <FlowList flows={flows} activeId={activeId} onSelect={setActiveId} />
          </div>
          <div style={{ overflowY: "auto", maxHeight: 800 }}>
            {activeId ? (
              <FlowEditor flowId={activeId} onDeleted={() => setActiveId(null)} />
            ) : (
              <div
                className="flex items-center justify-center text-muted text-[13px]"
                style={{ minHeight: 400 }}
              >
                {flowsQuery.isLoading ? "Cargando flows…" : "Selecciona o crea un flow a la izquierda."}
              </div>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Header({ onCreate, creating }) {
  return (
    <div className="flex justify-between items-end">
      <div>
        <h2 className="m-0 text-[22px] font-semibold" style={{ letterSpacing: "-0.02em" }}>
          Flows del bot
        </h2>
        <p className="mt-1 mb-0 text-muted text-[13px]">
          Define cómo responde el bot automáticamente a los mensajes entrantes.
        </p>
      </div>
      <Button variant="accent" icon={<I.plus size={14} />} onClick={onCreate} disabled={creating}>
        {creating ? "Creando…" : "Nuevo flow"}
      </Button>
    </div>
  );
}
