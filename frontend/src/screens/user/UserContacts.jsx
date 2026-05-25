import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Panel } from "../../components/ui/Panel.jsx";
import { Stat } from "../../components/ui/Stat.jsx";
import { Table } from "../../components/ui/Table.jsx";
import { Menu } from "../../components/overlays/Menu.jsx";
import { I } from "../../components/Icons.jsx";
import { useGroups, useDeleteGroup } from "../../hooks/api/useGroups.js";
import { useContacts, useDeleteContact } from "../../hooks/api/useContacts.js";
import { useMutationError } from "../../hooks/useMutationFeedback.js";
import { useToast } from "../../lib/toast.jsx";
import { num } from "../../lib/format.js";
import { ImportCsvModal, NewGroupModal, EditGroupModal, ConfirmModal } from "../../modals";

export function UserContacts() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const onMutationError = useMutationError();

  const groupsQuery = useGroups();
  const deleteGroupMutation = useDeleteGroup();
  const deleteContactMutation = useDeleteContact();

  const groups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data]);
  const [activeId, setActiveId] = useState(null);

  // Cuando llegan los grupos por primera vez, elegimos el primero.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!activeId && groups.length > 0) setActiveId(groups[0].id);
  }, [activeId, groups]);

  const activeGroup = groups.find((g) => g.id === activeId);

  const [showImport, setShowImport] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [contactQuery, setContactQuery] = useState("");

  const contactsQuery = useContacts({
    groupId: activeId,
    q: contactQuery || undefined,
    take: 100,
  });
  const contacts = contactsQuery.data?.rows ?? [];

  const startCampaignWithGroup = () => {
    toast.ok(`Audiencia "${activeGroup?.name ?? ""}" preseleccionada en la nueva campaña.`);
    navigate("/u/campaigns?compose=1");
  };

  return (
    <div className="grid gap-4">
      <Header onImport={() => setShowImport(true)} onNew={() => setShowNew(true)} />

      <div className="grid gap-3 items-start" style={{ gridTemplateColumns: "320px 1fr" }}>
        <GroupSidebar
          groups={groups}
          loading={groupsQuery.isLoading}
          active={activeId}
          onSelect={setActiveId}
          onNew={() => setShowNew(true)}
        />
        <div className="grid gap-3">
          {activeGroup ? (
            <>
              <KpiRow g={activeGroup} />
              <ContactsPanel
                g={activeGroup}
                contactQuery={contactQuery}
                setContactQuery={setContactQuery}
                visibleContacts={contacts}
                loading={contactsQuery.isLoading}
                onEditGroup={() => setShowEditGroup(true)}
                onStartCampaign={startCampaignWithGroup}
                onExport={() => toast.ok(`Exportando ${activeGroup.name}…`)}
                onImport={() => setShowImport(true)}
                onValidate={() => toast.info("Validación en cola.")}
                onDeleteGroup={() => setConfirmDelete(activeGroup)}
                onContactAction={(label) => toast.ok(label)}
                onDeleteContact={(c) =>
                  deleteContactMutation.mutate(c.id, {
                    onSuccess: () => toast.warn(`${c.name ?? c.phone} eliminado.`),
                    onError: onMutationError,
                  })
                }
              />
            </>
          ) : (
            <div className="text-muted text-[13px] text-center bg-surface" style={{ padding: 32, border: "1px solid var(--border)" }}>
              {groupsQuery.isLoading
                ? "Cargando grupos…"
                : groupsQuery.isError
                  ? "No se pudieron cargar los grupos."
                  : "Selecciona o crea un grupo a la izquierda."}
            </div>
          )}
        </div>
      </div>

      {showImport && (
        <ImportCsvModal
          onClose={() => setShowImport(false)}
          onDone={() => {
            // El modal real hace POST a /api/groups/import-csv (no implementado
            // todavía en el backend; lo dejamos como toast por ahora).
            toast.ok("Importación en cola.");
            groupsQuery.refetch();
          }}
        />
      )}
      {showNew && (
        <NewGroupModal
          onClose={() => setShowNew(false)}
          onCreated={(g) => {
            setActiveId(g.id);
          }}
        />
      )}
      {showEditGroup && activeGroup && (
        <EditGroupModal
          group={activeGroup}
          onClose={() => setShowEditGroup(false)}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          title="Eliminar grupo"
          message={`Vas a eliminar "${confirmDelete.name}" con ${num(confirmDelete.count)} contactos. Los contactos no se borran de tu cuenta, solo este agrupamiento.`}
          confirmLabel="Eliminar grupo"
          tone="danger"
          onClose={() => setConfirmDelete(null)}
          onConfirm={() =>
            deleteGroupMutation.mutate(confirmDelete.id, {
              onSuccess: () => {
                toast.warn(`Grupo "${confirmDelete.name}" eliminado.`);
                if (activeId === confirmDelete.id) setActiveId(null);
              },
              onError: onMutationError,
            })
          }
        />
      )}
    </div>
  );
}

function Header({ onImport, onNew }) {
  return (
    <div className="flex justify-between items-end">
      <div>
        <h2 className="m-0 text-[22px] font-semibold" style={{ letterSpacing: "-0.02em" }}>Contactos</h2>
        <p className="mt-1 mb-0 text-muted text-[13px]">
          Agrupa tus números para enviar campañas más rápido. Importa desde CSV o vCard.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" icon={<I.upload size={14} />} onClick={onImport}>Importar CSV</Button>
        <Button variant="accent" icon={<I.plus size={14} />} onClick={onNew}>Nuevo grupo</Button>
      </div>
    </div>
  );
}

function GroupSidebar({ groups, loading, active, onSelect, onNew }) {
  return (
    <Panel
      title="Grupos"
      padding={0}
      action={<Button size="sm" variant="ghost" icon={<I.plus size={12} />} onClick={onNew} />}
    >
      <div>
        {loading ? (
          <div className="text-muted text-[13px] text-center" style={{ padding: "20px 0" }}>Cargando…</div>
        ) : groups.length === 0 ? (
          <div className="text-muted text-[13px] text-center" style={{ padding: "20px 0" }}>
            Sin grupos. Crea el primero.
          </div>
        ) : (
          groups.map((gr, i) => (
            <button
              key={gr.id}
              onClick={() => onSelect(gr.id)}
              className="w-full text-left flex items-center gap-2.5 cursor-pointer border-none"
              style={{
                padding: "12px 18px",
                borderTop: i > 0 ? "1px solid var(--border)" : "none",
                background: active === gr.id ? "var(--surface-2)" : "transparent",
              }}
            >
              <span
                className="self-stretch"
                style={{ width: 4, background: active === gr.id ? "var(--accent)" : "transparent" }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {gr.name}
                </div>
                <div className="text-[11px] text-muted mt-0.5">
                  {gr.tag}
                </div>
              </div>
              <span className="mono text-xs text-muted">{num(gr.count)}</span>
            </button>
          ))
        )}
      </div>
    </Panel>
  );
}

function KpiRow({ g }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
      <Stat label="Contactos" value={num(g.count)} />
      <Stat label="Válidos WSP" value="—" sub="Pronto" />
      <Stat label="Opt-out" value="—" sub="Pronto" />
      <Stat label="Últ. campaña" value="—" sub="Pronto" />
    </div>
  );
}

function ContactsPanel({
  g, contactQuery, setContactQuery, visibleContacts, loading,
  onEditGroup, onStartCampaign, onExport, onImport, onValidate, onDeleteGroup,
  onContactAction, onDeleteContact,
}) {
  return (
    <Panel
      title={g.name}
      subtitle={`${num(g.count)} contactos · etiqueta ${g.tag}`}
      action={
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" icon={<I.edit size={12} />} onClick={onEditGroup}>Editar grupo</Button>
          <Button size="sm" variant="ghost" icon={<I.send size={12} />} onClick={onStartCampaign}>Crear campaña</Button>
          <Menu
            items={[
              { label: "Exportar contactos", icon: <I.download size={12} />, onClick: onExport },
              { label: "Importar más contactos", icon: <I.upload size={12} />, onClick: onImport },
              { label: "Validar números", icon: <I.refresh size={12} />, onClick: onValidate },
              { divider: true },
              { label: "Eliminar grupo", icon: <I.trash size={12} />, onClick: onDeleteGroup, danger: true },
            ]}
          />
        </div>
      }
    >
      <div className="flex gap-2.5 mb-3">
        <Input
          value={contactQuery}
          onChange={(e) => setContactQuery(e.target.value)}
          placeholder="Buscar dentro del grupo…"
          icon={<I.search size={14} />}
          style={{ flex: 1 }}
        />
        <Button
          variant="ghost"
          size="md"
          icon={<I.filter size={14} />}
          onClick={() => onContactAction("Filtros por etiqueta llegan pronto.")}
        >
          Etiquetas
        </Button>
      </div>
      {loading ? (
        <div className="text-muted text-[13px] text-center" style={{ padding: "24px 0" }}>Cargando contactos…</div>
      ) : visibleContacts.length === 0 ? (
        <div className="text-muted text-[13px] text-center" style={{ padding: "24px 0" }}>
          Sin contactos en este grupo todavía.
        </div>
      ) : (
        <Table columns={buildColumns(onContactAction, onDeleteContact)} rows={visibleContacts} />
      )}
      <div className="flex justify-between text-xs text-muted" style={{ padding: "12px 0 0" }}>
        <span>Mostrando {visibleContacts.length} de {num(g.count)}</span>
      </div>
    </Panel>
  );
}

function buildColumns(onContactAction, onDeleteContact) {
  return [
    {
      label: "",
      render: () => (
        <span style={{ width: 14, height: 14, border: "1.5px solid var(--border-strong)", display: "inline-block" }} />
      ),
    },
    { label: "Número", render: (r) => <span className="mono text-[13px]">{r.phone}</span> },
    { label: "Nombre", render: (r) => <span className="text-[13px] font-medium">{r.name ?? "—"}</span> },
    {
      label: "Etiquetas",
      render: (r) => (
        <div className="flex gap-1 flex-wrap">
          {(r.tags ?? []).map((t) => <Badge key={t} tone="neutral">{t}</Badge>)}
        </div>
      ),
    },
    {
      label: "Estado",
      render: (r) => (
        <Badge tone={r.optedOut ? "warn" : "info"}>
          <span style={{ width: 6, height: 6, background: "currentColor", display: "inline-block" }} />
          {r.optedOut ? "Opt-out" : "Válido"}
        </Badge>
      ),
    },
    {
      label: "",
      align: "right",
      render: (r) => (
        <Menu
          items={[
            { label: "Enviar mensaje directo", icon: <I.send size={12} />, onClick: () => onContactAction(`Abriendo chat con ${r.name ?? r.phone}…`) },
            { label: "Editar contacto", icon: <I.edit size={12} />, onClick: () => onContactAction(`Edición (pronto)`) },
            { label: "Quitar del grupo", icon: <I.x size={12} />, onClick: () => onDeleteContact(r) },
          ]}
        />
      ),
    },
  ];
}
