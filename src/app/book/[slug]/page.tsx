import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { BookingClient } from "./BookingClient";

// ─── Slot generation ──────────────────────────────────────────────────────────

function generateSlots(availability: {
  day_of_week: number[];
  start_time: string;
  end_time: string;
  session_duration: number;
}, bookedStarts: Set<string>) {
  const slots: { dateKey: string; label: string; start: string; end: string; timeLabel: string }[] = [];
  const now = new Date();

  for (let d = 0; d < 28; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() + d);
    const dayOfWeek = date.getDay();

    if (!availability.day_of_week.includes(dayOfWeek)) continue;

    const dateKey = date.toISOString().split("T")[0];
    const dateLabel = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

    // Parse start/end times
    const [sh, sm] = availability.start_time.split(":").map(Number);
    const [eh, em] = availability.end_time.split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;

    for (let t = startMin; t + availability.session_duration <= endMin; t += availability.session_duration) {
      const h = Math.floor(t / 60);
      const m = t % 60;
      const slotDate = new Date(date);
      slotDate.setHours(h, m, 0, 0);

      if (slotDate <= now) continue;

      const isoStart = slotDate.toISOString();
      if (bookedStarts.has(isoStart)) continue;

      const endSlot = new Date(slotDate.getTime() + availability.session_duration * 60000);
      const timeLabel = `${String(h).padStart(2, "0")}h${String(m).padStart(2, "0")}`;

      slots.push({ dateKey, label: dateLabel, start: isoStart, end: endSlot.toISOString(), timeLabel });
    }
  }

  return slots;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>;
}

const SPECIALTY_LABELS: Record<string, string> = {
  psychologue: "Psychologue",
  osteopathe: "Ostéopathe",
  kinesitherapeute: "Kinésithérapeute",
  autre: "Thérapeute",
};

export default async function BookPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createAdminClient();

  // Fetch therapist by slug
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, specialty, email")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .eq("slug" as any, slug)
    .maybeSingle();

  if (!profile) notFound();

  // Fetch availability
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: avail } = await (supabase as any)
    .from("availability")
    .select("day_of_week, start_time, end_time, session_duration")
    .eq("therapist_id", profile.id)
    .maybeSingle();

  // Default availability if none set
  const availability = avail ?? {
    day_of_week: [1, 2, 3, 4, 5],
    start_time: "09:00",
    end_time: "18:00",
    session_duration: 60,
  };

  // Fetch existing appointments (next 28 days)
  const since = new Date().toISOString();
  const until = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString();

  const { data: existingAppts } = await supabase
    .from("appointments")
    .select("start_time")
    .eq("therapist_id", profile.id)
    .neq("status", "cancelled")
    .gte("start_time", since)
    .lte("start_time", until);

  const bookedStarts = new Set((existingAppts ?? []).map(a => a.start_time));

  // Generate slots
  const allSlots = generateSlots(availability, bookedStarts);

  // Group by date
  const grouped = new Map<string, { label: string; slots: { start: string; end: string; label: string }[] }>();
  for (const s of allSlots) {
    if (!grouped.has(s.dateKey)) {
      grouped.set(s.dateKey, { label: s.label, slots: [] });
    }
    grouped.get(s.dateKey)!.slots.push({ start: s.start, end: s.end, label: s.timeLabel });
  }

  const availableDays = Array.from(grouped.entries()).map(([dateKey, v]) => ({
    dateKey,
    label: v.label,
    slots: v.slots,
  }));

  const therapistName = profile.full_name ?? "Votre thérapeute";
  const specialtyLabel = profile.specialty ? (SPECIALTY_LABELS[profile.specialty] ?? profile.specialty) : null;
  const initials = therapistName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E6E0] px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-1.5">
          <span className="font-serif text-lg text-[#0D1F1A]">Theraflow</span>
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-10">
        {/* Therapist card */}
        <div className="bg-white rounded-2xl border border-[#E8E6E0] p-6 mb-8 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-teal-400 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="font-serif text-xl text-[#0D1F1A]">{therapistName}</h1>
            {specialtyLabel && (
              <p className="text-[#7A948C] text-sm mt-0.5">{specialtyLabel}</p>
            )}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              <span className="text-xs text-teal-600 font-medium">Prend des rendez-vous en ligne</span>
            </div>
          </div>
        </div>

        <h2 className="font-serif text-2xl text-[#0D1F1A] mb-6">Choisissez un créneau</h2>

        {availableDays.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8E6E0] p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-[#F7F5F0] flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7A948C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-[#0D1F1A] font-medium mb-1">Aucun créneau disponible</p>
            <p className="text-sm text-[#7A948C]">Ce thérapeute n&apos;a pas encore défini ses disponibilités.</p>
          </div>
        ) : (
          <BookingClient
            therapistId={profile.id}
            therapistName={therapistName}
            therapistEmail={profile.email ?? ""}
            specialty={specialtyLabel}
            availableDays={availableDays}
          />
        )}
      </div>
    </div>
  );
}
