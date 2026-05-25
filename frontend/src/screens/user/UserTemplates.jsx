import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { I } from "../../components/Icons.jsx";
import { useTemplates } from "../../hooks/api/useTemplates.js";
import { useToast } from "../../lib/toast.jsx";
import { TemplateDetailModal, TemplateEditorModal } from "../../modals";

export function UserTemplates() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const templatesQuery = useTemplates();
  const templates = templatesQuery.data ?? [];

  const [detail, setDetail] = useState(null);
  const [editor, setEditor] = useState(null);

  const openComposeFromTemplate = (t) => {
    toast.ok(`Abriendo composición con "${t.name}".`);
    navigate("/u/campaigns?compose=1");
  };

  return (
    <div className="grid gap-4">
      <Header onNew={() => setEditor("new")} />

      {templatesQuery.isLoading ? (
        <Skeleton label="Cargando plantillas…" />
      ) : templatesQuery.isError ? (
        <ErrorPanel onRetry={() => templatesQuery.refetch()} />
      ) : templates.length === 0 ? (
        <Empty onNew={() => setEditor("new")} />
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              t={t}
              onOpen={() => setDetail(t)}
              onEdit={() => setEditor(t)}
              onUse={() => openComposeFromTemplate(t)}
            />
          ))}
        </div>
      )}

      {detail && (
        <TemplateDetailModal
          template={normalizeTemplate(detail)}
          onClose={() => setDetail(null)}
          onEdit={(t) => setEditor(t)}
          onUse={openComposeFromTemplate}
        />
      )}
      {editor && (
        <TemplateEditorModal
          template={editor === "new" ? null : editor}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
}

// El modal de detalle del prototipo espera campos como `items` (número) y
// `used`. Mapeamos del shape del backend.
function normalizeTemplate(t) {
  const itemCount = Array.isArray(t.items) ? t.items.length : 1;
  return {
    id: t.slug ?? t.id,
    name: t.name,
    type: t.type,
    items: itemCount,
    used: t.usedCount ?? 0,
    itemList: Array.isArray(t.items) ? t.items : undefined,
    body: t.body,
  };
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
  const itemCount = Array.isArray(t.items) ? t.items.length : 1;
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
          <div className="mono text-[11px] text-muted mt-0.5">{t.slug}</div>
        </div>
        <Badge tone="neutral">{t.type}</Badge>
      </div>
      <div
        className="flex items-center justify-center text-center text-xs text-muted bg-surface-2"
        style={{ height: 120, border: "1px solid var(--border)", padding: 10 }}
      >
        vista previa · {itemCount} elemento{itemCount > 1 ? "s" : ""}
      </div>
      <div className="flex justify-between items-center pt-1.5 border-t border-border">
        <span className="text-xs text-muted">
          Usada <span className="mono text-ink">{t.usedCount ?? 0}</span> veces
        </span>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" icon={<I.edit size={12} />} onClick={onEdit} />
          <Button size="sm" variant="ghost" icon={<I.send size={12} />} onClick={onUse}>Usar</Button>
        </div>
      </div>
    </div>
  );
}

function Skeleton({ label }) {
  return (
    <div className="bg-surface text-muted text-[13px] text-center" style={{ padding: 32, border: "1px solid var(--border)" }}>
      {label}
    </div>
  );
}
function ErrorPanel({ onRetry }) {
  return (
    <div className="bg-surface text-center" style={{ padding: 32, border: "1px solid var(--border)" }}>
      <div className="text-[13px] text-danger">No se pudieron cargar las plantillas.</div>
      <div className="mt-3">
        <Button size="sm" variant="ghost" onClick={onRetry}>Reintentar</Button>
      </div>
    </div>
  );
}
function Empty({ onNew }) {
  return (
    <div className="bg-surface text-center text-muted text-[13px]" style={{ padding: 32, border: "1px solid var(--border)" }}>
      <div>No tienes plantillas todavía.</div>
      <div className="mt-3">
        <Button size="sm" variant="accent" icon={<I.plus size={14} />} onClick={onNew}>Crear primera</Button>
      </div>
    </div>
  );
}
