import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UpgradeBanner } from "@/components/dashboard/UpgradeBanner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEuros(centimes: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(centimes / 100);
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Confirmé", className: "bg-teal-50 text-teal-600" },
  completed: { label: "Terminé", className: "bg-ink/5 text-ink/50" },
  cancelled: { label: "Annulé", className: "bg-red-50 text-red-500" },
  no_show: { label: "Absent", className: "bg-orange-50 text-orange-500" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

interface DashboardPageProps {
  searchParams: Promise<{ upgraded?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const showBanner = params.upgraded === "true";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
  ).toISOString();
  const todayEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59)
  ).toISOString();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  )
    .toISOString()
    .split("T")[0];

  // ── Requêtes parallèles ───────────────────────────────────────────────────
  const [
    { count: todayCount },
    { count: patientCount },
    { data: paidInvoices },
    { data: todayAppts },
    { data: nextApptData },
    { data: profile },
  ] = await Promise.all([
    // RDV aujourd'hui
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("therapist_id", user.id)
      .gte("start_time", todayStart)
      .lte("start_time", todayEnd)
      .neq("status", "cancelled"),

    // Patients actifs
    supabase
      .from("patients")
      .select("*", { count: "exact", head: true })
      .eq("therapist_id", user.id),

    // Revenus du mois (factures payées)
    supabase
      .from("invoices")
      .select("amount")
      .eq("therapist_id", user.id)
      .eq("status", "paid")
      .gte("issued_at", monthStart),

    // Liste RDV du jour
    supabase
      .from("appointments")
      .select("id, start_time, end_time, status, price, patient_id")
      .eq("therapist_id", user.id)
      .gte("start_time", todayStart)
      .lte("start_time", todayEnd)
      .order("start_time", { ascending: true }),

    // Prochain RDV (après maintenant)
    supabase
      .from("appointments")
      .select("id, start_time, patient_id")
      .eq("therapist_id", user.id)
      .eq("status", "confirmed")
      .gte("start_time", now.toISOString())
      .order("start_time", { ascending: true })
      .limit(1)
      .maybeSingle(),

    // Profil
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single(),
  ]);

  // Calcul revenus du mois
  const monthRevenue = (paidInvoices ?? []).reduce(
    (sum, inv) => sum + (inv.amount ?? 0),
    0
  );

  // Récupérer les noms des patients pour les RDV du jour
  const patientIds = [
    ...(todayAppts ?? []).map((a) => a.patient_id),
    nextApptData?.patient_id,
  ].filter(Boolean) as string[];

  const { data: patientsForAppts } =
    patientIds.length > 0
      ? await supabase
          .from("patients")
          .select("id, first_name, last_name")
          .in("id", [...new Set(patientIds)])
      : { data: [] };

  const patientMap = new Map(
    (patientsForAppts ?? []).map((p) => [
      p.id,
      `${p.first_name} ${p.last_name}`,
    ])
  );

  const nextPatientName = nextApptData
    ? patientMap.get(nextApptData.patient_id) ?? "—"
    : null;

  const profileData = profile as { full_name: string | null } | null;
  const firstName = profileData?.full_name?.split(" ")[0] ?? user.email?.split("@")[0] ?? "Thérapeute";

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
      {showBanner && <UpgradeBanner />}
      {/* En-tête */}
      <div>
        <h1 className="font-serif text-3xl text-ink">
          Bonjour, {firstName} 👋
        </h1>
        <p className="text-ink/50 text-sm mt-1 capitalize">
          {formatDate(now.toISOString())}
        </p>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="RDV aujourd'hui"
          value={todayCount?.toString() ?? "—"}
          sub={todayCount === 0 ? "Aucun RDV prévu" : `${todayCount} séance${(todayCount ?? 0) > 1 ? "s" : ""}`}
          iconBg="bg-teal-50"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
        <MetricCard
          label="Patients actifs"
          value={patientCount?.toString() ?? "—"}
          sub="patients enregistrés"
          iconBg="bg-purple-50"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <MetricCard
          label="Revenus ce mois"
          value={monthRevenue > 0 ? formatEuros(monthRevenue) : "—"}
          sub="factures payées"
          iconBg="bg-green-50"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <MetricCard
          label="Prochain RDV"
          value={nextApptData ? formatTime(nextApptData.start_time) : "—"}
          sub={nextPatientName ?? "Aucun RDV à venir"}
          iconBg="bg-amber-50"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
      </div>

      {/* Accès rapides */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/agenda" className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3 hover:border-teal-400/40 hover:bg-teal-50/30 transition-all group">
          <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 group-hover:bg-teal-100 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="12" y1="14" x2="12" y2="18" /><line x1="10" y1="16" x2="14" y2="16" />
            </svg>
          </div>
          <span className="text-sm font-medium text-ink">Nouveau RDV</span>
        </Link>
        <Link href="/patients" className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3 hover:border-purple-400/40 hover:bg-purple-50/30 transition-all group">
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 group-hover:bg-purple-100 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <span className="text-sm font-medium text-ink">Nouveau patient</span>
        </Link>
        <Link href="/facturation" className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3 hover:border-green-400/40 hover:bg-green-50/30 transition-all group">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <span className="text-sm font-medium text-ink">Nouvelle facture</span>
        </Link>
      </div>

      {/* RDV du jour */}
      <div className="bg-white rounded-2xl border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-ink">Rendez-vous du jour</h2>
          <Link
            href="/agenda"
            className="text-sm text-teal-400 hover:text-teal-600 font-medium transition-colors"
          >
            Voir l'agenda →
          </Link>
        </div>

        {!todayAppts || todayAppts.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-ink/40 text-sm">Aucun rendez-vous aujourd'hui.</p>
            <Link
              href="/agenda"
              className="inline-block mt-3 text-sm text-teal-400 hover:text-teal-600 font-medium"
            >
              Planifier un RDV →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {todayAppts.map((appt) => {
              const status = STATUS_LABELS[appt.status] ?? STATUS_LABELS.confirmed;
              const patientName = patientMap.get(appt.patient_id) ?? "Patient inconnu";
              return (
                <li key={appt.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-16 text-sm font-medium text-ink/70 shrink-0">
                    {formatTime(appt.start_time)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {patientName}
                    </p>
                    <p className="text-xs text-ink/40">
                      {formatTime(appt.start_time)} – {formatTime(appt.end_time)}
                      {appt.price ? ` · ${formatEuros(appt.price)}` : ""}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${status.className}`}
                  >
                    {status.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Composants locaux ────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  icon,
  iconBg = "bg-teal-50",
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  iconBg?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-ink/50 uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-semibold text-ink mb-0.5">{value}</p>
      <p className="text-xs text-ink/40 truncate">{sub}</p>
    </div>
  );
}
