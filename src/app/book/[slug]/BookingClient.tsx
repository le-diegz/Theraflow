"use client";

import { useState } from "react";
import { bookAppointment, type BookingResult } from "./actions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Slot {
  start: string; // ISO string
  end: string;
  label: string; // "09h00"
}

interface DaySlots {
  dateKey: string; // "2024-03-18"
  label: string;   // "Lundi 18 mars"
  slots: Slot[];
}

interface BookingClientProps {
  therapistId: string;
  therapistName: string;
  therapistEmail: string;
  specialty: string | null;
  availableDays: DaySlots[];
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

const MONTH_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAY_SHORT = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];

function Calendar({
  availableDays,
  selectedDate,
  onSelectDate,
}: {
  availableDays: DaySlots[];
  selectedDate: string | null;
  onSelectDate: (key: string) => void;
}) {
  const availableSet = new Set(availableDays.map((d) => d.dateKey));
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startPad = firstDay.getDay(); // 0 = Sun

  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E8E6E0] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-[#F7F5F0] text-[#7A948C] hover:text-[#0D1F1A] transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="font-semibold text-[#0D1F1A] text-sm capitalize">
          {MONTH_FR[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-[#F7F5F0] text-[#7A948C] hover:text-[#0D1F1A] transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_SHORT.map(d => (
          <div key={d} className="text-center text-xs text-[#7A948C] py-1">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;

          const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isPast = new Date(dateKey) < new Date(today.toDateString());
          const isAvailable = availableSet.has(dateKey);
          const isSelected = selectedDate === dateKey;
          const isToday = dateKey === today.toISOString().split("T")[0];

          return (
            <button
              key={i}
              disabled={isPast || !isAvailable}
              onClick={() => onSelectDate(dateKey)}
              className={`
                aspect-square flex items-center justify-center text-sm rounded-lg transition-all
                ${isSelected ? "bg-teal-400 text-white font-semibold" : ""}
                ${!isSelected && isAvailable && !isPast ? "text-[#0D1F1A] hover:bg-teal-50 font-medium cursor-pointer" : ""}
                ${!isAvailable || isPast ? "text-[#7A948C]/30 cursor-default" : ""}
                ${isToday && !isSelected ? "ring-2 ring-teal-400/30" : ""}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Booking form ──────────────────────────────────────────────────────────────

function BookingForm({
  slot,
  therapistId,
  therapistName,
  therapistEmail,
  onSuccess,
  onCancel,
}: {
  slot: Slot;
  therapistId: string;
  therapistName: string;
  therapistEmail: string;
  onSuccess: (result: SuccessResult) => void;
  onCancel: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await bookAppointment({
      therapistId,
      therapistName,
      therapistEmail,
      startTime: slot.start,
      endTime: slot.end,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });

    setLoading(false);

    if ("error" in result) {
      setError(result.error);
    } else if (result.success) {
      onSuccess(result as SuccessResult);
    }
  }

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-[#E8E6E0] bg-white text-[#0D1F1A] placeholder:text-[#7A948C]/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition";

  return (
    <div className="bg-white rounded-2xl border border-[#E8E6E0] p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-[#0D1F1A]">Confirmer le créneau</h3>
        <button onClick={onCancel} className="text-[#7A948C] hover:text-[#0D1F1A] transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="bg-teal-50 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-teal-400 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-teal-700">{slot.label}</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#0D1F1A] mb-1.5">Prénom *</label>
            <input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Marie" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#0D1F1A] mb-1.5">Nom *</label>
            <input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Dupont" className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#0D1F1A] mb-1.5">Email *</label>
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="marie@exemple.fr" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#0D1F1A] mb-1.5">Téléphone *</label>
          <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="06 12 34 56 78" className={inputClass} />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-teal-400 hover:bg-[#0F6E56] disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 mt-2"
        >
          {loading && (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {loading ? "Confirmation…" : "Confirmer ma réservation"}
        </button>
      </form>
    </div>
  );
}

// ─── Success ──────────────────────────────────────────────────────────────────

type SuccessResult = { success: true; patientName: string; therapistName: string; date: string; time: string };

function SuccessView({ result }: { result: SuccessResult }) {
  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-6">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h2 className="font-serif text-3xl text-[#0D1F1A] mb-3">Réservation confirmée ✓</h2>
      <p className="text-[#7A948C] mb-6">
        Bonjour {result.patientName.split(" ")[0]}, votre rendez-vous est confirmé !
      </p>
      <div className="bg-white rounded-2xl border border-[#E8E6E0] p-6 text-left max-w-sm mx-auto mb-6">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <div>
              <p className="text-xs text-[#7A948C]">Avec</p>
              <p className="text-sm font-semibold text-[#0D1F1A]">{result.therapistName}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div>
              <p className="text-xs text-[#7A948C]">Date</p>
              <p className="text-sm font-semibold text-[#0D1F1A] capitalize">{result.date}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <div>
              <p className="text-xs text-[#7A948C]">Heure</p>
              <p className="text-sm font-semibold text-[#0D1F1A]">{result.time}</p>
            </div>
          </div>
        </div>
      </div>
      <p className="text-sm text-[#7A948C]">Un email de confirmation vous a été envoyé.</p>
    </div>
  );
}

// ─── Main client ──────────────────────────────────────────────────────────────

export function BookingClient({
  therapistId,
  therapistName,
  therapistEmail,
  specialty,
  availableDays,
}: BookingClientProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [success, setSuccess] = useState<SuccessResult | null>(null);

  const dayData = availableDays.find(d => d.dateKey === selectedDate);

  if (success) return <SuccessView result={success} />;

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <Calendar
        availableDays={availableDays}
        selectedDate={selectedDate}
        onSelectDate={(key) => { setSelectedDate(key); setSelectedSlot(null); }}
      />

      {/* Time slots */}
      {selectedDate && dayData && !selectedSlot && (
        <div className="bg-white rounded-2xl border border-[#E8E6E0] p-5">
          <p className="text-sm font-semibold text-[#0D1F1A] mb-4 capitalize">{dayData.label}</p>
          {dayData.slots.length === 0 ? (
            <p className="text-sm text-[#7A948C] text-center py-4">Aucun créneau disponible ce jour.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {dayData.slots.map((slot, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedSlot(slot)}
                  className="py-2.5 rounded-xl border-2 border-[#E8E6E0] text-sm font-medium text-[#0D1F1A] hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 transition-all"
                >
                  {slot.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking form */}
      {selectedSlot && (
        <BookingForm
          slot={selectedSlot}
          therapistId={therapistId}
          therapistName={therapistName}
          therapistEmail={therapistEmail}
          onSuccess={setSuccess}
          onCancel={() => setSelectedSlot(null)}
        />
      )}
    </div>
  );
}
