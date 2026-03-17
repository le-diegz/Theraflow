"use client";

import { useActionState, useState } from "react";
import { updateProfile, updateSmsSettings, type ProfileActionState, type SmsActionState } from "./actions";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProfileData = {
  full_name: string | null;
  specialty: string | null;
  phone: string | null;
  email: string;
};

export type SubscriptionData = {
  plan: "free" | "pro";
  status: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
};

export type SmsSettings = {
  enabled: boolean;
  delay: number; // heures avant RDV
};

interface Props {
  profile: ProfileData;
  subscription: SubscriptionData | null;
  smsSettings: SmsSettings;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const SPECIALTY_OPTIONS = [
  { value: "", label: "Non renseignée" },
  { value: "psychologue", label: "Psychologue" },
  { value: "osteopathe", label: "Ostéopathe" },
  { value: "kinesitherapeute", label: "Kinésithérapeute" },
  { value: "autre", label: "Autre" },
];

const PRO_FEATURES = [
  "Patients illimités",
  "Rappels SMS automatiques 24h avant",
  "Génération de factures PDF",
  "Accès prioritaire au support",
  "Toutes les futures fonctionnalités",
];

const SMS_DELAY_OPTIONS = [
  { value: 1, label: "1h avant" },
  { value: 24, label: "24h avant" },
  { value: 48, label: "48h avant" },
];

// ─── Composant principal ──────────────────────────────────────────────────────

export function ParametresClient({ profile, subscription, smsSettings }: Props) {
  const plan = subscription?.plan ?? "free";
  const isPro = plan === "pro";

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-serif text-ink">Paramètres</h1>
        <p className="text-ink/50 text-sm mt-0.5">Gérez votre profil et votre abonnement</p>
      </div>

      <ProfileSection profile={profile} />
      <SmsSection settings={smsSettings} isPro={isPro} />
      <ExportSection />
      <SubscriptionSection isPro={isPro} subscription={subscription} />
    </div>
  );
}

// ─── Section Profil ───────────────────────────────────────────────────────────

function ProfileSection({ profile }: { profile: ProfileData }) {
  const [state, action, pending] = useActionState<ProfileActionState, FormData>(
    updateProfile,
    null
  );

  return (
    <section className="bg-white rounded-2xl border border-border p-6">
      <h2 className="font-semibold text-ink mb-5">Informations du profil</h2>

      {state?.error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mb-4 px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl text-sm text-teal-700">
          Profil mis à jour avec succès.
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Nom complet</label>
          <input
            name="full_name"
            type="text"
            defaultValue={profile.full_name ?? ""}
            placeholder="Marie Dupont"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink placeholder:text-ink/30 text-sm transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Spécialité</label>
          <select
            name="specialty"
            defaultValue={profile.specialty ?? ""}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink text-sm transition"
          >
            {SPECIALTY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Téléphone</label>
          <input
            name="phone"
            type="tel"
            defaultValue={profile.phone ?? ""}
            placeholder="06 12 34 56 78"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink placeholder:text-ink/30 text-sm transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Email <span className="text-ink/30 font-normal">(non modifiable)</span>
          </label>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-ink/[0.03] text-ink/40 text-sm cursor-not-allowed"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={pending}
            className="px-6 py-2.5 bg-teal-400 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            {pending && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {pending ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
        </div>
      </form>
    </section>
  );
}

// ─── Section Rappels SMS ──────────────────────────────────────────────────────

function SmsSection({ settings, isPro }: { settings: SmsSettings; isPro: boolean }) {
  const [enabled, setEnabled] = useState(settings.enabled);
  const [delay, setDelay] = useState(settings.delay);
  const [state, action, pending] = useActionState<SmsActionState, FormData>(
    updateSmsSettings,
    null
  );

  // Message SMS preview
  const previewDelay = SMS_DELAY_OPTIONS.find((o) => o.value === delay)?.label ?? "24h avant";
  const preview = `Bonjour [Prénom], rappel de votre RDV avec [Thérapeute] ${
    delay === 1 ? "dans 1 heure" : delay === 24 ? "demain" : "dans 2 jours"
  } à [heure]. Pour annuler : [lien]\n- Theraflow`;

  return (
    <section className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </div>
        <h2 className="font-semibold text-ink">Rappels SMS</h2>
        {!isPro && (
          <span className="ml-auto text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
            Pro uniquement
          </span>
        )}
      </div>

      {!isPro ? (
        <p className="text-sm text-ink/50">
          Passez en plan Pro pour activer les rappels SMS automatiques à vos patients.
        </p>
      ) : (
        <>
          {state?.error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {state.error}
            </div>
          )}
          {state?.success && (
            <div className="mb-4 px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl text-sm text-teal-700">
              Paramètres SMS sauvegardés.
            </div>
          )}

          <form action={action} className="space-y-5">
            {/* Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Activer les rappels SMS</p>
                <p className="text-xs text-ink/40 mt-0.5">Envoie un SMS automatique aux patients avant leur RDV</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="sms_enabled"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-ink/20 peer-checked:bg-teal-400 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-teal-400/30" />
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </label>
            </div>

            {/* Délai */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Délai avant le RDV</label>
              <div className="flex gap-2">
                {SMS_DELAY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDelay(opt.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      delay === opt.value
                        ? "bg-teal-400 text-white border-teal-400"
                        : "border-border text-ink/60 hover:border-teal-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                <input type="hidden" name="sms_delay" value={delay} />
              </div>
            </div>

            {/* Prévisualisation */}
            <div>
              <p className="text-xs font-medium text-ink/50 mb-2 uppercase tracking-wide">
                Aperçu du message ({previewDelay})
              </p>
              <div className="bg-ink/[0.03] rounded-xl px-4 py-3 text-sm text-ink/70 whitespace-pre-line leading-relaxed">
                {preview}
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="px-6 py-2.5 bg-teal-400 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              {pending && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {pending ? "Enregistrement…" : "Sauvegarder"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}

// ─── Section Export ───────────────────────────────────────────────────────────

function ExportSection() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  async function downloadFile(url: string, setLoading: (v: boolean) => void) {
    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur serveur");
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      const cd = res.headers.get("content-disposition") ?? "";
      const match = cd.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? "export";
      a.click();
      URL.revokeObjectURL(href);
    } catch {
      alert("Une erreur est survenue lors du téléchargement.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <h2 className="font-semibold text-ink">Export de données</h2>
      </div>

      <div className="space-y-4">
        {/* Export patients CSV */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-ink/[0.02] border border-border">
          <div>
            <p className="text-sm font-medium text-ink">Mes patients</p>
            <p className="text-xs text-ink/40 mt-0.5">Prénom, nom, email, téléphone, historique</p>
          </div>
          <button
            onClick={() => downloadFile("/api/export/patients", setLoadingPatients)}
            disabled={loadingPatients}
            className="px-4 py-2 rounded-xl bg-white border border-border text-sm font-medium text-ink/70 hover:text-ink hover:border-teal-400 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loadingPatients ? (
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            CSV
          </button>
        </div>

        {/* Récap mensuel PDF */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-ink/[0.02] border border-border gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">Récapitulatif mensuel</p>
            <p className="text-xs text-ink/40 mt-0.5">Séances, revenus, patients — format PDF</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400"
            />
            <button
              onClick={() =>
                downloadFile(`/api/export/monthly?month=${selectedMonth}`, setLoadingMonthly)
              }
              disabled={loadingMonthly}
              className="px-4 py-2 rounded-xl bg-white border border-border text-sm font-medium text-ink/70 hover:text-ink hover:border-teal-400 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loadingMonthly ? (
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              PDF
            </button>
          </div>
        </div>

        {/* Export factures CSV */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-ink/[0.02] border border-border">
          <div>
            <p className="text-sm font-medium text-ink">Toutes mes factures</p>
            <p className="text-xs text-ink/40 mt-0.5">Numéro, montant, statut, date</p>
          </div>
          <button
            onClick={() => downloadFile("/api/export/invoices", setLoadingInvoices)}
            disabled={loadingInvoices}
            className="px-4 py-2 rounded-xl bg-white border border-border text-sm font-medium text-ink/70 hover:text-ink hover:border-teal-400 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loadingInvoices ? (
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            CSV
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Section Abonnement ───────────────────────────────────────────────────────

function SubscriptionSection({
  isPro,
  subscription,
}: {
  isPro: boolean;
  subscription: SubscriptionData | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Erreur lors de la redirection vers le paiement.");
      }
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Impossible d'accéder au portail.");
      }
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  const renewalDate = subscription?.current_period_end
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(subscription.current_period_end))
    : null;

  return (
    <section className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-ink">Abonnement</h2>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${
            isPro
              ? "bg-teal-50 text-teal-600 border border-teal-200"
              : "bg-ink/5 text-ink/50 border border-border"
          }`}
        >
          {isPro ? "Plan Pro" : "Plan Gratuit"}
        </span>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {isPro ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl border border-teal-100">
            <div className="w-9 h-9 rounded-full bg-teal-400/20 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-teal-700">Theraflow Pro actif</p>
              {renewalDate && (
                <p className="text-xs text-teal-600/70 mt-0.5">
                  Renouvellement le {renewalDate}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handlePortal}
            disabled={loading}
            className="w-full py-2.5 rounded-xl border border-border text-sm font-medium text-ink/60 hover:text-ink hover:bg-ink/5 disabled:opacity-50 transition-colors"
          >
            {loading ? "Chargement…" : "Gérer mon abonnement →"}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="p-5 rounded-xl bg-gradient-to-br from-teal-50 to-teal-50/30 border border-teal-100">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="font-semibold text-ink">Theraflow Pro</p>
                <p className="text-2xl font-bold text-teal-400 mt-1">
                  39€
                  <span className="text-sm font-normal text-ink/40"> / mois</span>
                </p>
              </div>
              <div className="shrink-0 text-3xl">✨</div>
            </div>

            <ul className="space-y-2 mb-5">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-ink/70">
                  <svg
                    className="text-teal-400 shrink-0"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-teal-400 hover:bg-teal-600 disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Redirection…
                </>
              ) : (
                "Passer en Pro — 39€/mois"
              )}
            </button>
          </div>

          <p className="text-xs text-ink/30 text-center">
            Paiement sécurisé par Stripe · Annulation à tout moment
          </p>
        </div>
      )}
    </section>
  );
}
