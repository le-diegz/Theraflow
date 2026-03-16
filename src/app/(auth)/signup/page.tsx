"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signup, type AuthState } from "../actions";

const SPECIALTIES = [
  { value: "psychologue", label: "Psychologue" },
  { value: "osteopathe", label: "Ostéopathe" },
  { value: "kinesitherapeute", label: "Kinésithérapeute" },
  { value: "autre", label: "Autre" },
];

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function SignupPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signup,
    null
  );
  const [showPassword, setShowPassword] = useState(false);

  // Succès : email de confirmation envoyé
  if (state?.success) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
          <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-ink mb-2">
            Vérifiez votre email
          </h2>
          <p className="text-ink/60 text-sm leading-relaxed">{state.success}</p>
          <Link
            href="/login"
            className="inline-block mt-6 text-sm text-teal-400 hover:text-teal-600 font-medium transition-colors"
          >
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
        {/* Titre */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-ink mb-1">
            Créer un compte
          </h1>
          <p className="text-ink/50 text-sm">
            Gratuit pour 3 patients · Aucune carte bancaire
          </p>
        </div>

        {/* Erreur globale */}
        {state?.error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-5">
          {/* Prénom + Nom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="first_name"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Prénom
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                autoComplete="given-name"
                required
                placeholder="Marie"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink placeholder:text-ink/30 transition text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="last_name"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Nom
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                autoComplete="family-name"
                required
                placeholder="Dupont"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink placeholder:text-ink/30 transition text-sm"
              />
            </div>
          </div>

          {/* Spécialité */}
          <div>
            <label
              htmlFor="specialty"
              className="block text-sm font-medium text-ink mb-1.5"
            >
              Spécialité
            </label>
            <div className="relative">
              <select
                id="specialty"
                name="specialty"
                required
                defaultValue=""
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink transition text-sm appearance-none"
              >
                <option value="" disabled>
                  Choisir votre spécialité…
                </option>
                {SPECIALTIES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/30"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-ink mb-1.5"
            >
              Email professionnel
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="vous@exemple.fr"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink placeholder:text-ink/30 transition text-sm"
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-ink mb-1.5"
            >
              Mot de passe
              <span className="font-normal text-ink/40 ml-1">(6 caractères min.)</span>
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 pr-11 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink placeholder:text-ink/30 transition text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 transition-colors"
                tabIndex={-1}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {/* CGU */}
          <p className="text-xs text-ink/40 leading-relaxed">
            En créant un compte, vous acceptez nos{" "}
            <Link href="#" className="text-teal-400 hover:underline">
              Conditions générales
            </Link>{" "}
            et notre{" "}
            <Link href="#" className="text-teal-400 hover:underline">
              Politique de confidentialité
            </Link>
            .
          </p>

          {/* Bouton */}
          <button
            type="submit"
            disabled={pending}
            className="w-full h-11 bg-teal-400 hover:bg-teal-600 disabled:opacity-60 text-white font-medium rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            {pending && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {pending ? "Création du compte…" : "Commencer gratuitement"}
          </button>
        </form>
      </div>

      {/* Lien connexion */}
      <p className="text-center text-sm text-ink/50 mt-6">
        Déjà un compte ?{" "}
        <Link
          href="/login"
          className="text-teal-400 hover:text-teal-600 font-medium transition-colors"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
