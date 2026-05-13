import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { I } from "../../components/Icons.jsx";
import { useToast } from "../../lib/toast.jsx";
import { EventDetailModal, RescheduleCampaignModal } from "../../modals";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DAY_HEADERS = ["L", "M", "M", "J", "V", "S", "D"];

// Eventos hardcoded para Mayo 2026. Si navegas a otros meses queda vacío — el
// mock no cubre más allá.
const MAY_2026_EVENTS = {
  5: [{ t: "09:00", n: "Encuesta NPS Abril", tone: "warn" }],
  8: [{ t: "10:00", n: "Catálogo Q2 — PDF", tone: "warn" }],
  12: [{ t: "14:30", n: "Promo Mayo — Clientes A", tone: "accent" }],
  14: [{ t: "09:00", n: "Recurrente: Bienvenida leads", tone: "info" }],
  21: [{ t: "09:00", n: "Recurrente: Bienvenida leads", tone: "info" }],
  24: [{ t: "16:00", n: "Reactivación inactivos", tone: "warn" }],
};

const EVENT_BG = { accent: "var(--accent-soft)", info: "var(--info-soft)", warn: "var(--warn-soft)" };
const EVENT_BORDER = { accent: "var(--accent)", info: "var(--info)", warn: "var(--warn)" };

export function UserSchedule() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [month, setMonth] = useState(4); // 4 = Mayo
  const [year, setYear] = useState(2026);
  const [pickedEvent, setPickedEvent] = useState(null);
  const [reschedule, setReschedule] = useState(null);

  const events = month === 4 && year === 2026 ? MAY_2026_EVENTS : {};

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
      <CalendarGrid events={events} onPickEvent={(day, ev) => setPickedEvent({ day, event: ev })} />

      {pickedEvent && (
        <EventDetailModal
          event={pickedEvent.event}
          day={pickedEvent.day}
          onClose={() => setPickedEvent(null)}
          onReschedule={() => {
            setReschedule({ id: "camp_evt", name: pickedEvent.event.n });
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

function CalendarGrid({ events, onPickEvent }) {
  const cells = Array.from({ length: 35 }, (_, i) => i - 3); // offset
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
          <DayCell key={i} day={c} index={i} events={events[c] || []} onPickEvent={onPickEvent} />
        ))}
      </div>
    </div>
  );
}

function DayCell({ day, index, events, onPickEvent }) {
  const valid = day >= 1 && day <= 31;
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
            background: EVENT_BG[e.tone],
            borderLeft: `2px solid ${EVENT_BORDER[e.tone]}`,
            color: "var(--ink)",
          }}
        >
          <span className="mono text-[10px]" style={{ opacity: 0.7 }}>{e.t}</span> · {e.n}
        </button>
      ))}
    </div>
  );
}
