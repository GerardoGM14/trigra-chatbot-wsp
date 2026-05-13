import { useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Field } from "../../components/ui/Field.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Panel } from "../../components/ui/Panel.jsx";
import { I } from "../../components/Icons.jsx";
import { useToast } from "../../lib/toast.jsx";
import { GROUPS } from "../../lib/data.js";
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

const INITIAL_ITEMS = [
  { title: "Catálogo completo", desc: "Más de 120 productos en oferta" },
  { title: "Promos por categoría", desc: "Hogar, tecnología, salud, otros" },
  { title: "Hablar con un asesor", desc: "Te contactamos en menos de 10 min" },
];

export function UserCompose({ onBack }) {
  const { toast } = useToast();
  const [step, setStep] = useState(2);
  const [name, setName] = useState("Promo Mayo — Clientes A");
  const [testOpen, setTestOpen] = useState(false);
  const [type, setType] = useState("list");
  const [body, setBody] = useState(
    "Hola {{nombre}} 👋\n\nTenemos novedades para ti este mes. Selecciona una opción para ver más detalle:",
  );
  const [header, setHeader] = useState("Promociones de Mayo");
  const [footer, setFooter] = useState("Empresa S.A.C. · Responde STOP para no recibir más.");
  const [buttonText, setButtonText] = useState("Ver opciones");
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [selectedGroups, setSelectedGroups] = useState(["grp_clientes_a"]);
  const [whenMode, setWhenMode] = useState("schedule");
  const totalRecipients = GROUPS.filter((g) => selectedGroups.includes(g.id)).reduce((a, g) => a + g.count, 0);

  return (
    <div className="grid gap-4">
      <ComposeHeader
        onBack={onBack}
        onSaveDraft={() => toast.ok("Borrador guardado.")}
        onSendTest={() => setTestOpen(true)}
        onSchedule={() => { toast.ok(`Campaña "${name}" programada.`); onBack(); }}
      />

      <ComposeStepper step={step} onStep={setStep} />

      <div className="grid gap-3 items-start" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <div className="grid gap-3">
          {step === 1 && <DetailsStep name={name} setName={setName} />}
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
              selectedGroups={selectedGroups}
              setSelectedGroups={setSelectedGroups}
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

function ComposeHeader({ onBack, onSaveDraft, onSendTest, onSchedule }) {
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
      <Button variant="ghost" onClick={onSaveDraft}>Guardar borrador</Button>
      <Button variant="ghost" icon={<I.send size={12} />} onClick={onSendTest}>Enviar prueba</Button>
      <Button variant="accent" icon={<I.send size={12} />} onClick={onSchedule}>Programar envío</Button>
    </div>
  );
}

function DetailsStep({ name, setName }) {
  return (
    <Panel title="Detalles de la campaña" subtitle="Identifícala para encontrarla más tarde en la lista.">
      <div className="grid gap-3.5">
        <Field label="Nombre de la campaña" hint="Solo visible internamente.">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Tipo de audiencia">
          <Input value="Clientes A — Lima · 1.204 contactos" />
        </Field>
      </div>
    </Panel>
  );
}
