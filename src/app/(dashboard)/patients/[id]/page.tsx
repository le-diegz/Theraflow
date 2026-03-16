import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NotesEditor } from "./NotesEditor";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatEuros(centimes: number | null) {
  if (!centimes) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(centimes / 100);
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Confirmé", className: "bg-teal-50 text-teal-600" },
  completed: { label: "Terminé", className: "bg-ink/5 text-ink/50" },
  cancelled: { label: "Annulé", className: "bg-red-50 text-red-500" },
  no_show: { label: "Absent", className: "bg-orange-50 text-orange-500" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PatientPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Récupérer le patient (avec vérification d'appartenance via RLS)
  const { data: patient, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .eq("therapist_id", user.id)
    .single();

  if (error || !patient) notFound();

  // Historique des séances
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, start_time, end_time, status, price, notes")
    .eq("patient_id", id)
    .eq("therapist_id", user.id)
    .order("start_time", { ascending: false });

  const totalSessions = (appointments ?? []).filter(
    (a) => a.status === "completed"
  ).length;

  const totalRevenue = (appointments ?? [])
    .filter((a) => a.status === "completed")
    .reduce((sum, a) => sum + (a.price ?? 0), 0);

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-ink/40">
        <Link href="/patients" className="hover:text-teal-400 transition-colors">
          Patients
        </Link>
        <span>/</span>
        <span className="text-ink">
          {patient.last_name} {patient.first_name}
        </span>
      </nav>

      {/* En-tête patient */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 text-lg font-bold shrink-0">
              {patient.first_name[0]}{patient.last_name[0]}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-ink">
                {patient.first_name} {patient.last_name}
              </h1>
              <p className="text-ink/50 text-sm mt-0.5">
                Patient depuis le {formatDate(patient.created_at)}
              </p>
            </div>
          </div>
          <Link
            href="/agenda"
            className="flex items-center gap-2 px-4 py-2 bg-teal-400 hover:bg-teal-600 text-white text-sm font-medium rounded-xl transition-colors shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Prendre RDV
          </Link>
        </div>

        {/* Infos de contact */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoField label="Email" value={patient.email ?? "—"} />
          <InfoField label="Téléphone" value={patient.phone ?? "—"} />
          <InfoField label="Date de naissance" value={formatDate(patient.birthdate)} />
          <InfoField label="Âge" value={patient.birthdate ? `${getAge(patient.birthdate)} ans` : "—"} />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <StatCard label="Séances réalisées" value={totalSessions.toString()} />
        <StatCard
          label="Revenus générés"
          value={totalRevenue > 0 ? formatEuros(totalRevenue) : "—"}
        />
        <StatCard
          label="Dernière séance"
          value={
            appointments && appointments.length > 0
              ? formatDate(appointments[0].start_time)
              : "—"
          }
        />
      </div>

      {/* Historique des séances */}
      <div className="bg-white rounded-2xl border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-ink">Historique des séances</h2>
        </div>

        {!appointments || appointments.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-ink/40 text-sm">Aucune séance enregistrée.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {appointments.map((appt) => {
              const status = STATUS_LABELS[appt.status] ?? STATUS_LABELS.confirmed;
              return (
                <li key={appt.id} className="px-6 py-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-sm font-medium text-ink">
                        {formatDateTime(appt.start_time)}
                      </p>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    {appt.notes && (
                      <p className="text-xs text-ink/50 mt-1 line-clamp-2">
                        {appt.notes}
                      </p>
                    )}
                  </div>
                  {appt.price && (
                    <span className="text-sm font-medium text-ink shrink-0">
                      {formatEuros(appt.price)}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Notes cliniques */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink">Notes cliniques</h2>
          <span className="text-xs text-ink/30 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Données confidentielles
          </span>
        </div>
        <NotesEditor patientId={patient.id} initialNotes={patient.notes} />
      </div>
    </div>
  );
}

// ─── Composants locaux ────────────────────────────────────────────────────────

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink/40 font-medium mb-0.5">{label}</p>
      <p className="text-sm text-ink">{value}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-4 text-center">
      <p className="text-2xl font-semibold text-ink">{value}</p>
      <p className="text-xs text-ink/50 mt-1">{label}</p>
    </div>
  );
}

function getAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}
