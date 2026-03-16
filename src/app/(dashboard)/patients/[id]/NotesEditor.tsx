"use client";

import { useState, useTransition } from "react";
import { updatePatientNotes } from "../actions";

interface NotesEditorProps {
  patientId: string;
  initialNotes: string | null;
}

export function NotesEditor({ patientId, initialNotes }: NotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updatePatientNotes(patientId, notes);
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  return (
    <div className="space-y-3">
      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setSaved(false);
        }}
        placeholder="Notes cliniques, observations, historique… (jamais partagées avec le patient)"
        rows={8}
        className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink placeholder:text-ink/25 transition text-sm resize-none leading-relaxed"
      />

      <div className="flex items-center justify-between">
        <div className="text-xs text-ink/40">
          {notes.length > 0 && `${notes.length} caractères`}
        </div>
        <div className="flex items-center gap-3">
          {error && <p className="text-xs text-red-500">{error}</p>}
          {saved && (
            <p className="text-xs text-teal-500 flex items-center gap-1">
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <path
                  d="M1 5l3.5 3.5L11 1"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Sauvegardé
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-2 bg-teal-400 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isPending && (
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isPending ? "Sauvegarde…" : "Sauvegarder"}
          </button>
        </div>
      </div>
    </div>
  );
}
