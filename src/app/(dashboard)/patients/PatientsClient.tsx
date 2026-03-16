"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPatient, type PatientActionState } from "./actions";
import type { Tables } from "@/types/database.types";

type Patient = Pick<
  Tables<"patients">,
  "id" | "first_name" | "last_name" | "email" | "phone" | "created_at"
>;

interface PatientsClientProps {
  initialPatients: Patient[];
  plan: "free" | "pro";
}

// ─── Modal nouveau patient ─────────────────────────────────────────────────────

function NewPatientModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<PatientActionState, FormData>(
    createPatient,
    null
  );

  // useRef pour éviter le problème de référence instable de onClose
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Fermer et rafraîchir après succès
  useEffect(() => {
    if (state?.success) {
      router.refresh();
      onCloseRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl border border-border w-full max-w-md p-6 z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-ink">Nouveau patient</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-ink/40 hover:text-ink transition-colors rounded-lg hover:bg-ink/5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {state?.error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Prénom <span className="text-red-400">*</span>
              </label>
              <input
                name="first_name"
                type="text"
                required
                placeholder="Marie"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink placeholder:text-ink/30 text-sm transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Nom <span className="text-red-400">*</span>
              </label>
              <input
                name="last_name"
                type="text"
                required
                placeholder="Dupont"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink placeholder:text-ink/30 text-sm transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Email
            </label>
            <input
              name="email"
              type="email"
              placeholder="marie.dupont@exemple.fr"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink placeholder:text-ink/30 text-sm transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Téléphone
            </label>
            <input
              name="phone"
              type="tel"
              placeholder="06 12 34 56 78"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink placeholder:text-ink/30 text-sm transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Date de naissance
            </label>
            <input
              name="birthdate"
              type="date"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink text-sm transition"
            />
          </div>

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
              disabled={pending}
              className="flex-1 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {pending && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {pending ? "Création…" : "Créer le patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Upgrade ─────────────────────────────────────────────────────────────

function UpgradeModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    const res = await fetch("/api/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-border w-full max-w-sm p-6 z-10 text-center">
        <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-ink mb-2">
          Limite du plan gratuit atteinte
        </h2>
        <p className="text-sm text-ink/60 mb-6">
          Passez en Pro pour ajouter des patients illimités, envoyer des rappels SMS et générer des factures PDF.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-teal-400 hover:bg-teal-600 disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : "✨"}
            {loading ? "Redirection…" : "Passer en Pro — 39€/mois"}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-border text-sm text-ink/50 hover:text-ink hover:bg-ink/5 transition-colors"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

const FREE_PATIENT_LIMIT = 3;

export function PatientsClient({ initialPatients, plan }: PatientsClientProps) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  function handleNewPatient() {
    if (plan === "free" && initialPatients.length >= FREE_PATIENT_LIMIT) {
      setShowUpgrade(true);
    } else {
      setShowModal(true);
    }
  }

  const filtered = initialPatients.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.first_name.toLowerCase().includes(q) ||
      p.last_name.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phone?.includes(q)
    );
  });

  function formatDate(iso: string) {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  }

  return (
    <>
      {showModal && <NewPatientModal onClose={() => setShowModal(false)} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      <div className="px-6 py-8 max-w-5xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-ink">Mes patients</h1>
            <p className="text-ink/50 text-sm mt-0.5">
              {initialPatients.length} patient{initialPatients.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={handleNewPatient}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-400 hover:bg-teal-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nouveau patient
          </button>
        </div>

        {/* Recherche */}
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un patient…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink placeholder:text-ink/30 text-sm transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border px-6 py-16 text-center">
            {search ? (
              <>
                <p className="text-ink/40 text-sm">
                  Aucun résultat pour «&nbsp;{search}&nbsp;»
                </p>
                <button
                  onClick={() => setSearch("")}
                  className="mt-2 text-sm text-teal-400 hover:underline"
                >
                  Effacer la recherche
                </button>
              </>
            ) : (
              <>
                <p className="text-ink/40 text-sm">
                  Vous n'avez pas encore de patients.
                </p>
                <button
                  onClick={handleNewPatient}
                  className="mt-3 text-sm text-teal-400 hover:text-teal-600 font-medium"
                >
                  Ajouter votre premier patient →
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            {/* Header table — masqué sur mobile */}
            <div className="hidden md:grid grid-cols-[2fr_2fr_1.5fr_1fr] gap-4 px-6 py-3 border-b border-border bg-cream/50">
              <span className="text-xs font-medium text-ink/50 uppercase tracking-wide">Nom</span>
              <span className="text-xs font-medium text-ink/50 uppercase tracking-wide">Email</span>
              <span className="text-xs font-medium text-ink/50 uppercase tracking-wide">Téléphone</span>
              <span className="text-xs font-medium text-ink/50 uppercase tracking-wide">Ajouté le</span>
            </div>

            <ul className="divide-y divide-border">
              {filtered.map((patient) => (
                <li key={patient.id}>
                  <Link
                    href={`/patients/${patient.id}`}
                    className="grid md:grid-cols-[2fr_2fr_1.5fr_1fr] gap-2 md:gap-4 px-6 py-4 hover:bg-teal-50/40 transition-colors items-center"
                  >
                    {/* Nom */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center shrink-0 text-teal-600 text-xs font-semibold">
                        {patient.first_name[0]}{patient.last_name[0]}
                      </div>
                      <span className="text-sm font-medium text-ink">
                        {patient.last_name} {patient.first_name}
                      </span>
                    </div>

                    {/* Email */}
                    <span className="text-sm text-ink/60 truncate hidden md:block">
                      {patient.email ?? <span className="text-ink/25">—</span>}
                    </span>

                    {/* Téléphone */}
                    <span className="text-sm text-ink/60 hidden md:block">
                      {patient.phone ?? <span className="text-ink/25">—</span>}
                    </span>

                    {/* Date ajout */}
                    <span className="text-sm text-ink/40 hidden md:block">
                      {formatDate(patient.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
