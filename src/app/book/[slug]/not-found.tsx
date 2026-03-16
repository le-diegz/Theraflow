import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-white border border-[#E8E6E0] flex items-center justify-center mb-8">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7A948C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <h1 className="font-serif text-4xl text-[#0D1F1A] mb-3">Page introuvable</h1>
      <p className="text-[#7A948C] text-lg max-w-md mb-8">
        Ce lien de réservation n&apos;existe pas ou a été modifié. Vérifiez l&apos;URL avec votre thérapeute.
      </p>
      <Link href="/" className="inline-flex items-center gap-2 bg-teal-400 hover:bg-[#0F6E56] text-white font-medium px-6 py-3 rounded-xl transition-colors">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
