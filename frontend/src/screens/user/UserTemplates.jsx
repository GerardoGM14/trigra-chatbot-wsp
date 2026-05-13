import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { I } from "../../components/Icons.jsx";
import { useToast } from "../../lib/toast.jsx";
import { TEMPLATES } from "../../lib/data.js";
import { TemplateDetailModal, TemplateEditorModal } from "../../modals";

export function UserTemplates() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [editor, setEditor] = useState(null); // template | "new" | null

  const openComposeFromTemplate = (t) => {
    toast.ok(`Abriendo composición con "${t.name}".`);
    navigate("/u/campaigns?compose=1");
  };

  return (
    <div className="grid gap-4">
      <Header onNew={() => setEditor("new")} />
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {TEMPLATES.map((t) => (
          <TemplateCard
            key={t.id}
            t={t}
            onOpen={() => setDetail(t)}
            onEdit={() => setEditor(t)}
            onUse={() => openComposeFromTemplate(t)}
          />
        ))}
      </div>

      {detail && (
        <TemplateDetailModal
          template={detail}
          onClose={() => setDetail(null)}
          onEdit={(t) => setEditor(t)}
          onUse={openComposeFromTemplate}
        />
      )}
      {editor && (
        <TemplateEditorModal
          template={editor === "new" ? null : editor}
          onClose={() => setEditor(null)}
          onSave={(t) => toast.ok(`Plantilla "${t.name}" guardada.`)}
        />
      )}
    </div>
  );
}

function Header({ onNew }) {
  return (
    <div className="flex justify-between items-end">
      <div>
        <h2 className="m-0 text-[22px] font-semibold" style={{ letterSpacing: "-0.02em" }}>Plantillas</h2>
        <p className="mt-1 mb-0 text-muted text-[13px]">
          Mensajes reutilizables con variables, listas y botones.
        </p>
      </div>
      <Button variant="accent" icon={<I.plus size={14} />} onClick={onNew}>Nueva plantilla</Button>
    </div>
  );
}

function TemplateCard({ t, onOpen, onEdit, onUse }) {
  return (
    <div
      onClick={onOpen}
      className="bg-surface grid gap-2.5 cursor-pointer"
      style={{ border: "1px solid var(--border)", padding: 18, transition: "border-color 160ms" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm font-semibold">{t.name}</div>
          <div className="mono text-[11px] text-muted mt-0.5">{t.id}</div>
        </div>
        <Badge tone="neutral">{t.type}</Badge>
      </div>
      <div
        className="flex items-center justify-center text-center text-xs text-muted bg-surface-2"
        style={{ height: 120, border: "1px solid var(--border)", padding: 10 }}
      >
        vista previa · {t.items} elemento{t.items > 1 ? "s" : ""}
      </div>
      <div className="flex justify-between items-center pt-1.5 border-t border-border">
        <span className="text-xs text-muted">
          Usada <span className="mono text-ink">{t.used}</span> veces
        </span>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" icon={<I.edit size={12} />} onClick={onEdit} />
          <Button size="sm" variant="ghost" icon={<I.send size={12} />} onClick={onUse}>Usar</Button>
        </div>
      </div>
    </div>
  );
}
