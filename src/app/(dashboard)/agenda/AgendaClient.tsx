"use client";

import "./agenda.css";
import { useMemo, useState, useTransition, useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer, type View, type SlotInfo } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import { createAppointment, updateAppointmentStatus, type AppointmentActionState } from "./actions";

// ─── Localizer (français, semaine commence lundi) ─────────────────────────────

const locales = { fr };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const messages: Record<string, unknown> = {
  allDay: "Journée",
  previous: "‹",
  next: "›",
  today: "Aujourd'hui",
  month: "Mois",
  week: "Semaine",
  day: "Jour",
  agenda: "Liste",
  date: "Date",
  time: "Heure",
  event: "Événement",
  noEventsInRange: "Aucun rendez-vous sur cette période.",
  showMore: (total: number) => `+${total} de plus`,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type RawEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  status: string;
  notes: string | null;
  price: number | null;
  patientId: string | null;
};

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    status: string;
    notes: string | null;
    price: number | null;
    patientId: string | null;
  };
};

export type Patient = {
  id: string;
  first_name: string;
  last_name: string;
};

// ─── Couleurs par statut ──────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; border: string }> = {
  confirmed: { bg: "#1D9E75", border: "#0F6E56" },
  completed: { bg: "#0F6E56", border: "#0a4f3e" },
  cancelled: { bg: "#9ca3af", border: "#6b7280" },
  no_show: { bg: "#f87171", border: "#ef4444" },
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmé",
  completed: "Terminé",
  cancelled: "Annulé",
  no_show: "Absent",
};

function formatEuros(centimes: number | null) {
  if (!centimes) return null;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(centimes / 100);
}

function formatDateTimeFr(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// ─── Modal Nouveau RDV ────────────────────────────────────────────────────────

interface NewAppointmentModalProps {
  onClose: () => void;
  patients: Patient[];
  initialDate?: string;
  initialTime?: string;
}

function NewAppointmentModal({
  onClose,
  patients,
  initialDate,
  initialTime,
}: NewAppointmentModalProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState<AppointmentActionState, FormData>(
    createAppointment,
    null
  );

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      onCloseRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  const today = initialDate ?? format(new Date(), "yyyy-MM-dd");
  const now = initialTime ?? format(new Date(), "HH:mm");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-border w-full max-w-md p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-ink">Nouveau rendez-vous</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-ink/40 hover:text-ink transition-colors rounded-lg hover:bg-ink/5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {patients.length === 0 && (
          <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            Vous n'avez pas encore de patients.{" "}
            <a href="/patients" className="underline font-medium">Créer un patient →</a>
          </div>
        )}

        {state?.error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-4">
          {/* Patient */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Patient <span className="text-red-400">*</span>
            </label>
            <select
              name="patient_id"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink text-sm transition"
            >
              <option value="">Choisir un patient…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.last_name} {p.first_name}
                </option>
              ))}
            </select>
          </div>

          {/* Date + Heure */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Date <span className="text-red-400">*</span>
              </label>
              <input
                name="date"
                type="date"
                required
                defaultValue={today}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink text-sm transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Heure <span className="text-red-400">*</span>
              </label>
              <input
                name="time"
                type="time"
                required
                defaultValue={now}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink text-sm transition"
              />
            </div>
          </div>

          {/* Durée + Prix */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Durée</label>
              <select
                name="duration"
                defaultValue="60"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink text-sm transition"
              >
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">1 heure</option>
                <option value="90">1h30</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Prix (€)
              </label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.5"
                defaultValue="60"
                placeholder="60"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink placeholder:text-ink/30 text-sm transition"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Notes <span className="text-ink/30 font-normal">(optionnel)</span>
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Motif de consultation, rappels…"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink placeholder:text-ink/30 text-sm transition resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={pending || patients.length === 0}
              className="flex-1 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {pending && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {pending ? "Création…" : "Confirmer le RDV"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Détail RDV ─────────────────────────────────────────────────────────

interface AppointmentDetailModalProps {
  event: CalendarEvent;
  onClose: () => void;
}

function AppointmentDetailModal({ event, onClose }: AppointmentDetailModalProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const status = event.resource.status;
  const isActive = status === "confirmed";
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.confirmed;

  function handleUpdateStatus(newStatus: "completed" | "cancelled" | "no_show") {
    setError(null);
    startTransition(async () => {
      const result = await updateAppointmentStatus(event.id, newStatus);
      if (result?.success) {
        router.refresh();
        onClose();
      }
      if (result?.error) setError(result.error);
    });
  }

  const duration = Math.round((event.end.getTime() - event.start.getTime()) / 60000);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-border w-full max-w-sm p-6 z-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-semibold text-ink">{event.title}</h2>
            <span
              className="inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: color.bg }}
            >
              {STATUS_LABELS[status] ?? status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink/40 hover:text-ink transition-colors rounded-lg hover:bg-ink/5 shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Infos */}
        <div className="space-y-3 mb-5">
          <InfoRow icon="calendar" label={formatDateTimeFr(event.start)} />
          <InfoRow icon="clock" label={`${duration} min`} />
          {event.resource.price && (
            <InfoRow icon="euro" label={formatEuros(event.resource.price) ?? ""} />
          )}
          {event.resource.notes && (
            <div className="mt-2 p-3 bg-cream rounded-xl text-sm text-ink/70">
              {event.resource.notes}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {isActive && (
            <>
              <button
                onClick={() => handleUpdateStatus("completed")}
                disabled={pending}
                className="w-full py-2.5 rounded-xl bg-teal-400 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {pending ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                Marquer comme terminé
              </button>
              <button
                onClick={() => handleUpdateStatus("no_show")}
                disabled={pending}
                className="w-full py-2.5 rounded-xl border border-orange-200 text-orange-500 hover:bg-orange-50 disabled:opacity-60 text-sm font-medium transition-colors"
              >
                Patient absent
              </button>
              <button
                onClick={() => handleUpdateStatus("cancelled")}
                disabled={pending}
                className="w-full py-2.5 rounded-xl border border-border text-ink/50 hover:text-red-500 hover:border-red-200 hover:bg-red-50 disabled:opacity-60 text-sm font-medium transition-colors"
              >
                Annuler le RDV
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-border text-sm font-medium text-ink/50 hover:text-ink hover:bg-ink/5 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label }: { icon: "calendar" | "clock" | "euro"; label: string }) {
  const icons = {
    calendar: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    clock: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    euro: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="9" x2="5" y2="9" /><line x1="19" y1="15" x2="5" y2="15" /><path d="M6 20c6.667 0 10-4 10-8s-3.333-8-10-8" />
      </svg>
    ),
  };

  return (
    <div className="flex items-center gap-2.5 text-sm text-ink/70">
      <span className="text-ink/30 shrink-0">{icons[icon]}</span>
      {label}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface AgendaClientProps {
  initialEvents: RawEvent[];
  patients: Patient[];
}

export function AgendaClient({ initialEvents, patients }: AgendaClientProps) {
  const [view, setView] = useState<View>("week");
  const [newApptModal, setNewApptModal] = useState<{
    open: boolean;
    date?: string;
    time?: string;
  }>({ open: false });
  const [detailModal, setDetailModal] = useState<CalendarEvent | null>(null);

  const calendarEvents = useMemo<CalendarEvent[]>(
    () =>
      initialEvents.map((e) => ({
        id: e.id,
        title: e.title,
        start: new Date(e.start),
        end: new Date(e.end),
        resource: {
          status: e.status,
          notes: e.notes,
          price: e.price,
          patientId: e.patientId,
        },
      })),
    [initialEvents]
  );

  function handleSelectSlot(slot: SlotInfo) {
    const date = format(slot.start, "yyyy-MM-dd");
    const time = format(slot.start, "HH:mm");
    setNewApptModal({ open: true, date, time });
  }

  function handleSelectEvent(event: CalendarEvent) {
    setDetailModal(event);
  }

  function eventPropGetter(event: CalendarEvent) {
    const color = STATUS_COLORS[event.resource.status] ?? STATUS_COLORS.confirmed;
    return {
      style: {
        backgroundColor: color.bg,
        borderColor: color.border,
        color: "white",
      },
    };
  }

  return (
    <>
      {/* Modals */}
      {newApptModal.open && (
        <NewAppointmentModal
          onClose={() => setNewApptModal({ open: false })}
          patients={patients}
          initialDate={newApptModal.date}
          initialTime={newApptModal.time}
        />
      )}
      {detailModal && (
        <AppointmentDetailModal
          event={detailModal}
          onClose={() => setDetailModal(null)}
        />
      )}

      <div className="px-6 py-8 max-w-6xl mx-auto space-y-5">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-ink">Agenda</h1>
            <p className="text-ink/50 text-sm mt-0.5">
              {calendarEvents.filter((e) => e.resource.status === "confirmed").length} RDV à venir
            </p>
          </div>
          <button
            onClick={() => setNewApptModal({ open: true })}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-400 hover:bg-teal-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nouveau RDV
          </button>
        </div>

        {/* Légende statuts */}
        <div className="flex items-center gap-4 flex-wrap">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-ink/60">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: STATUS_COLORS[key]?.bg }}
              />
              {label}
            </div>
          ))}
        </div>

        {/* Calendrier */}
        <div style={{ height: "calc(100vh - 240px)", minHeight: 500 }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            defaultView="week"
            view={view}
            onView={setView}
            views={["month", "week", "day"]}
            step={30}
            timeslots={2}
            min={new Date(0, 0, 0, 7, 0, 0)}
            max={new Date(0, 0, 0, 21, 0, 0)}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventPropGetter}
            messages={messages}
            culture="fr"
            style={{ height: "100%" }}
          />
        </div>
      </div>
    </>
  );
}
