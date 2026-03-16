"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPassword, type AuthState } from "../actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    forgotPassword,
    null
  );

  if (state?.success) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
          <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1D9E75"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-ink mb-2">
            Email envoyé !
          </h2>
          <p className="text-ink/60 text-sm leading-relaxed max-w-xs mx-auto">
            {state.success}
          </p>
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
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-ink mb-1">
            Mot de passe oublié
          </h1>
          <p className="text-ink/50 text-sm">
            Entrez votre email pour recevoir un lien de réinitialisation.
          </p>
        </div>

        {state?.error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-ink mb-1.5"
            >
              Email
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

          <button
            type="submit"
            disabled={pending}
            className="w-full h-11 bg-teal-400 hover:bg-teal-600 disabled:opacity-60 text-white font-medium rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            {pending && (
              <svg
                className="animate-spin w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {pending ? "Envoi en cours…" : "Envoyer le lien"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-ink/50 mt-6">
        <Link
          href="/login"
          className="text-teal-400 hover:text-teal-600 font-medium transition-colors"
        >
          ← Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
