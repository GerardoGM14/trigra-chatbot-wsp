import { useState } from "react";
import { I } from "../components/Icons.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Field } from "../components/ui/Field.jsx";
import { Input } from "../components/ui/Input.jsx";
import { ModalShell } from "../components/overlays/ModalShell.jsx";

export function RescheduleCampaignModal({ campaign, onClose, onSave }) {
  const [date, setDate] = useState("12/05/2026");
  const [time, setTime] = useState("09:00");
  return (
    <ModalShell
      title={`Reprogramar · ${campaign.name}`}
      subtitle={<span className="mono">{campaign.id}</span>}
      width={460}
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button variant="primary" onClick={() => { onSave?.(`${date} ${time}`); close(); }}>
            Reprogramar envío
          </Button>
        </>
      )}
    >
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Field label="Nueva fecha">
          <Input value={date} onChange={(e) => setDate(e.target.value)} icon={<I.cal size={14} />} />
        </Field>
        <Field label="Hora (UTC−5)">
          <Input value={time} onChange={(e) => setTime(e.target.value)} icon={<I.clock size={14} />} />
        </Field>
      </div>
    </ModalShell>
  );
}
