import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { I } from "../../components/Icons.jsx";
import { useCampaigns } from "../../hooks/api/useCampaigns.js";
import { useToast } from "../../lib/toast.jsx";
import { EventDetailModal, RescheduleCampaignModal } from "../../modals";

// Calendario de campañas programadas. Se alimenta de /api/campaigns y agrupa
// por día (en zona local) las que tienen `scheduledAt`.

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DAY_HEADERS = ["L", "M", "M", "J", "V", "S", "D"];

const TONE_BY_STATUS = {
  Enviando: "accent",
  Programada: "warn",
  Pausada: "danger",
};

export function UserSchedule() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const campaignsQuery = useCampaigns();

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [pickedEvent, setPickedEvent] = useState(null);
  const [reschedule, setReschedule] = useState(null);

  // Indexa las campañas por día del mes seleccionado.
  const eventsByDay = useMemo(() => {
    const map = {};
    for (const c of campaignsQuery.data ?? []) {
      if (!c.scheduledAt) continue;
      const d = new Date(c.scheduledAt);
      if (d.getMonth() !== month || d.getFullYear() !== year) continue;
      const day = d.getDate();
      const time = d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false });
      (map[day] ??= []).push({ t: time, n: c.name, tone: TONE_BY_STATUS[c.status] ?? "info", campaign: c });
    }
    return map;
  }, [campaignsQuery.data, month, year]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else { setMonth((m) => m - 1); }
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else { setMonth((m) => m + 1); }
  };

  return (
    <div className="grid gap-4">
      <Header
        month={month} year={year}
        onPrev={prevMonth} onNext={nextMonth}
        onNewCampaign={() => navigate("/u/campaigns?compose=1")}
      />
      <CalendarGrid
        month={month}
        year={year}
        events={eventsByDay}
        onPickEvent={(day, ev) => setPickedEvent({ day, event: ev })}
      />

      {pickedEvent && (
        <EventDetailModal
          event={pickedEvent.event}
          day={pickedEvent.day}
          onClose={() => setPickedEvent(null)}
          onReschedule={() => {
            setReschedule({
              id: pickedEvent.event.campaign.slug ?? pickedEvent.event.campaign.id,
              name: pickedEvent.event.n,
            });
            setPickedEvent(null);
          }}
        />
      )}
      {reschedule && (
        <RescheduleCampaignModal
          campaign={reschedule}
          onClose={() => setReschedule(null)}
          onSave={(when) => toast.ok(`Reprogramada para ${when}.`)}
        />
      )}
    </div>
  );
}

function Header({ month, year, onPrev, onNext, onNewCampaign }) {
  return (
    <div className="flex justify-between items-end">
      <div>
        <h2 className="m-0 text-[22px] font-semibold" style={{ letterSpacing: "-0.02em" }}>Calendario de envíos</h2>
        <p className="mt-1 mb-0 text-muted text-[13px]">
          Visualiza tus campañas programadas y recurrentes.
        </p>
      </div>
      <div className="flex gap-2 items-center">
        <Button variant="ghost" icon={<I.chev size={14} style={{ transform: "rotate(180deg)" }} />} onClick={onPrev} />
        <div className="text-sm font-semibold text-center" style={{ minWidth: 140 }}>
          {MONTHS[month]} {year}
        </div>
        <Button variant="ghost" icon={<I.chev size={14} />} onClick={onNext} />
        <Button variant="accent" icon={<I.plus size={14} />} onClick={onNewCampaign}>Nueva campaña</Button>
      </div>
    </div>
  );
}

function CalendarGrid({ month, year, events, onPickEvent }) {
  // Calcula el offset del primer día (lunes como inicio).
  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7; // domingo=6, lunes=0
  const lastDay = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: Math.max(35, offset + lastDay) }, (_, i) => i - offset + 1);

  return (
    <div className="bg-surface" style={{ border: "1px solid var(--border)" }}>
      <div className="grid" style={{ gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid var(--border)" }}>
        {DAY_HEADERS.map((d, i) => (
          <div
            key={i}
            className="text-[11px] font-medium text-muted uppercase"
            style={{ padding: "10px 14px", letterSpacing: "0.04em", borderLeft: "1px solid var(--border)" }}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(7,1fr)" }}>
        {cells.map((c, i) => (
          <DayCell key={i} day={c} index={i} lastDay={lastDay} events={events[c] ?? []} onPickEvent={onPickEvent} />
        ))}
      </div>
    </div>
  );
}

function DayCell({ day, index, lastDay, events, onPickEvent }) {
  const valid = day >= 1 && day <= lastDay;
  return (
    <div
      style={{
        minHeight: 110,
        padding: 10,
        borderLeft: "1px solid var(--border)",
        borderTop: index >= 7 ? "1px solid var(--border)" : "none",
        background: valid ? "var(--surface)" : "var(--surface-2)",
      }}
    >
      <div
        className="mono text-[11px]"
        style={{ color: valid ? "var(--ink-2)" : "var(--muted-2)", marginBottom: 6 }}
      >
        {valid ? String(day).padStart(2, "0") : ""}
      </div>
      {events.map((e, j) => (
        <button
          key={j}
          type="button"
          onClick={() => onPickEvent(day, e)}
          className="text-[11px] block w-full text-left cursor-pointer border-none"
          style={{
            padding: "4px 6px",
            marginBottom: 4,
            background:
              e.tone === "accent" ? "var(--accent-soft)" :
              e.tone === "info" ? "var(--info-soft)" :
              e.tone === "warn" ? "var(--warn-soft)" :
              "var(--danger-soft)",
            borderLeft: `2px solid ${
              e.tone === "accent" ? "var(--accent)" :
              e.tone === "info" ? "var(--info)" :
              e.tone === "warn" ? "var(--warn)" :
              "var(--danger)"
            }`,
            color: "var(--ink)",
          }}
        >
          <span className="mono text-[10px]" style={{ opacity: 0.7 }}>{e.t}</span> · {e.n}
        </button>
      ))}
    </div>
  );
}
