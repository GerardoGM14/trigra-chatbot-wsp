import { useMemo, useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Field } from "../../components/ui/Field.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Panel } from "../../components/ui/Panel.jsx";
import { I } from "../../components/Icons.jsx";
import { useGroups } from "../../hooks/api/useGroups.js";
import { useCreateCampaign } from "../../hooks/api/useCampaigns.js";
import { useMutationError } from "../../hooks/useMutationFeedback.js";
import { useAuth } from "../../lib/auth.jsx";
import { useToast } from "../../lib/toast.jsx";
import { SendTestModal } from "../../modals";
import { ComposeStepper } from "./compose/ComposeStepper.jsx";
import { MessageTypePicker } from "./compose/MessageTypePicker.jsx";
import { MessageContentEditor } from "./compose/MessageContentEditor.jsx";
import { RecipientsStep } from "./compose/RecipientsStep.jsx";
import { ScheduleStep } from "./compose/ScheduleStep.jsx";
import { ComposePreview } from "./compose/ComposePreview.jsx";

const TYPE_LABELS = {
  text: "Texto",
  image: "Imagen",
  video: "Video",
  doc: "Documento",
  list: "Lista cliceable",
  btns: "Botones rápidos",
};

// Mapeo del tipo interno del editor al enum del backend.
const TYPE_TO_BACKEND = {
  text: "Texto",
  image: "Imagen",
  video: "Video",
  doc: "Documento",
  list: "Lista",
  btns: "Botones",
};

const INITIAL_ITEMS = [
  { title: "Catálogo completo", desc: "Más de 120 productos en oferta" },
  { title: "Promos por categoría", desc: "Hogar, tecnología, salud, otros" },
  { title: "Hablar con un asesor", desc: "Te contactamos en menos de 10 min" },
];

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || `camp_${Date.now().toString().slice(-5)}`;
}

export function UserCompose({ onBack }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const onMutationError = useMutationError("No se pudo guardar la campaña.");

  const groupsQuery = useGroups();
  const createMutation = useCreateCampaign();

  const groups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data]);
  const groupsForStep = useMemo(
    () => groups.map((g) => ({ id: g.id, slug: g.slug, name: g.name, tag: g.tag, count: g.count, updated: g.updated })),
    [groups],
  );

  const [step, setStep] = useState(2);
  const [name, setName] = useState("Nueva campaña");
  const [testOpen, setTestOpen] = useState(false);
  const [type, setType] = useState("list");
  const [body, setBody] = useState(
    "Hola {{nombre}} 👋\n\nTenemos novedades para ti este mes. Selecciona una opción para ver más detalle:",
  );
  const [header, setHeader] = useState("Promociones de Mayo");
  const [footer, setFooter] = useState("Empresa S.A.C. · Responde STOP para no recibir más.");
  const [buttonText, setButtonText] = useState("Ver opciones");
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [whenMode, setWhenMode] = useState("schedule");

  const totalRecipients = groups
    .filter((g) => selectedGroupIds.includes(g.id))
    .reduce((a, g) => a + (g.count ?? 0), 0);

  const save = (status) => {
    if (!name.trim() || !user?.id || createMutation.isPending) return;
    createMutation.mutate(
      {
        slug: `camp_${slugify(name)}_${Date.now().toString().slice(-4)}`,
        name: name.trim(),
        type: TYPE_TO_BACKEND[type] ?? "Texto",
        body,
        ownerId: user.id,
        groupIds: selectedGroupIds,
        items: type === "list" || type === "btns" ? items : undefined,
        // scheduledAt no se envía en borrador. Cuando whenMode === "schedule"
        // y haya selector de fecha real, lo pasamos en formato ISO.
        ...(status === "Programada" && whenMode === "schedule" ? { scheduledAt: new Date().toISOString() } : {}),
      },
      {
        onSuccess: () => {
          toast.ok(status === "Borrador" ? "Borrador guardado." : `Campaña "${name}" programada.`);
          onBack();
        },
        onError: onMutationError,
      },
    );
  };

  return (
    <div className="grid gap-4">
      <ComposeHeader
        onBack={onBack}
        onSaveDraft={() => save("Borrador")}
        onSendTest={() => setTestOpen(true)}
        onSchedule={() => save("Programada")}
        saving={createMutation.isPending}
      />

      <ComposeStepper step={step} onStep={setStep} />

      <div className="grid gap-3 items-start" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <div className="grid gap-3">
          {step === 1 && <DetailsStep name={name} setName={setName} totalRecipients={totalRecipients} />}
          {step === 2 && (
            <>
              <MessageTypePicker type={type} setType={setType} />
              <MessageContentEditor
                type={type}
                body={body} setBody={setBody}
                header={header} setHeader={setHeader}
                footer={footer} setFooter={setFooter}
                buttonText={buttonText} setButtonText={setButtonText}
                items={items} setItems={setItems}
              />
            </>
          )}
          {step === 3 && (
            <RecipientsStep
              groups={groupsForStep}
              loading={groupsQuery.isLoading}
              selectedGroups={selectedGroupIds}
              setSelectedGroups={setSelectedGroupIds}
              totalRecipients={totalRecipients}
            />
          )}
          {step === 4 && <ScheduleStep whenMode={whenMode} setWhenMode={setWhenMode} />}
        </div>

        <ComposePreview
          type={type} body={body} header={header} footer={footer}
          buttonText={buttonText} items={items} name={name}
          totalRecipients={totalRecipients} whenMode={whenMode}
          typeLabels={TYPE_LABELS}
        />
      </div>

      {testOpen && (
        <SendTestModal
          name={name}
          onClose={() => setTestOpen(false)}
          onSend={(phone) => toast.ok(`Mensaje de prueba enviado a ${phone}.`)}
        />
      )}
    </div>
  );
}

function ComposeHeader({ onBack, onSaveDraft, onSendTest, onSchedule, saving }) {
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        icon={<I.chev size={14} style={{ transform: "rotate(180deg)" }} />}
      >
        Campañas
      </Button>
      <span className="text-muted-2">/</span>
      <h2 className="m-0 text-lg font-semibold" style={{ letterSpacing: "-0.01em" }}>Nueva campaña</h2>
      <Badge tone="warn">Borrador</Badge>
      <div className="flex-1" />
      <Button variant="ghost" onClick={onSaveDraft} disabled={saving}>
        {saving ? "Guardando…" : "Guardar borrador"}
      </Button>
      <Button variant="ghost" icon={<I.send size={12} />} onClick={onSendTest}>Enviar prueba</Button>
      <Button variant="accent" icon={<I.send size={12} />} onClick={onSchedule} disabled={saving}>
        {saving ? "Guardando…" : "Programar envío"}
      </Button>
    </div>
  );
}

function DetailsStep({ name, setName, totalRecipients }) {
  return (
    <Panel title="Detalles de la campaña" subtitle="Identifícala para encontrarla más tarde en la lista.">
      <div className="grid gap-3.5">
        <Field label="Nombre de la campaña" hint="Solo visible internamente.">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Audiencia">
          <Input value={`${totalRecipients} contactos`} />
        </Field>
      </div>
    </Panel>
  );
}
