"use client";

import { useState, useEffect } from "react";

export function UpgradeBanner() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Nettoyer ?upgraded=true de l'URL sans recharger la page
    window.history.replaceState({}, "", "/dashboard");

    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
      role="alert"
    >
      <div className="bg-teal-400 text-white rounded-2xl shadow-lg px-5 py-4 flex items-start gap-3">
        {/* Icône */}
        <span className="text-2xl shrink-0 leading-none mt-0.5">🎉</span>

        {/* Texte */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Bienvenue dans Theraflow Pro !</p>
          <p className="text-white/80 text-xs mt-0.5">
            Toutes les fonctionnalités sont désormais débloquées.
          </p>
        </div>

        {/* Fermer */}
        <button
          onClick={() => setVisible(false)}
          className="shrink-0 text-white/70 hover:text-white transition-colors mt-0.5"
          aria-label="Fermer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Barre de progression */}
      <div className="mt-1 h-0.5 bg-teal-200/30 rounded-full overflow-hidden mx-2">
        <div
          className="h-full bg-white/50 rounded-full"
          style={{ animation: "shrink 5s linear forwards" }}
        />
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}
