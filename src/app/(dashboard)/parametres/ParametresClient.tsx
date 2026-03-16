"use client";

import { useActionState, useState } from "react";
import { updateProfile, type ProfileActionState } from "./actions";

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

interface Props {
  profile: ProfileData;
  subscription: SubscriptionData | null;
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

// ─── Composant principal ──────────────────────────────────────────────────────

export function ParametresClient({ profile, subscription }: Props) {
  const plan = subscription?.plan ?? "free";
  const isPro = plan === "pro";

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-serif text-ink">Paramètres</h1>
        <p className="text-ink/50 text-sm mt-0.5">Gérez votre profil et votre abonnement</p>
      </div>

      <ProfileSection profile={profile} />
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
        {/* Nom complet */}
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

        {/* Spécialité */}
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

        {/* Téléphone */}
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

        {/* Email (lecture seule) */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Email{" "}
            <span className="text-ink/30 font-normal">(non modifiable)</span>
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
        // ── Plan Pro actif ──────────────────────────────────────────────────
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
        // ── Plan Gratuit → carte upgrade ────────────────────────────────────
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
