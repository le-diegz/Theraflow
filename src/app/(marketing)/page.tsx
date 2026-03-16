import Link from "next/link";

// ─── Navbar ──────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-cream/90 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-400 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 2C5.13 2 2 5.13 2 9s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm1 10H8V8h2v4zm0-6H8V4h2v2z"
                fill="white"
              />
            </svg>
          </div>
          <span className="font-semibold text-ink text-lg">Theraflow</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-ink/70">
          <Link href="#fonctionnalites" className="hover:text-teal-400 transition-colors">
            Fonctionnalités
          </Link>
          <Link href="#tarifs" className="hover:text-teal-400 transition-colors">
            Tarifs
          </Link>
          <Link href="#faq" className="hover:text-teal-400 transition-colors">
            FAQ
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-ink/70 hover:text-ink transition-colors px-3 py-1.5"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-teal-400 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Commencer gratuitement
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-600 text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-teal-400/20">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
          Conforme RGPD · Données hébergées en Europe
        </div>

        <h1 className="font-serif text-5xl md:text-6xl text-ink leading-tight mb-6">
          Gérez votre cabinet
          <br />
          <span className="text-teal-400">en 5 minutes par jour</span>
        </h1>

        <p className="text-xl text-ink/60 max-w-2xl mx-auto mb-10 leading-relaxed">
          Theraflow remplace Excel, WhatsApp et les carnets papier par un outil
          simple et beau. Agenda, patients, rappels SMS et facturation — tout en
          un.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center text-base font-medium bg-teal-400 hover:bg-teal-600 text-white px-8 h-12 rounded-xl shadow-lg shadow-teal-400/25 transition-colors"
          >
            Commencer gratuitement
          </Link>
          <Link
            href="#fonctionnalites"
            className="inline-flex items-center justify-center text-base font-medium border border-border bg-white hover:bg-teal-50 text-ink px-8 h-12 rounded-xl transition-colors"
          >
            Voir la démo →
          </Link>
        </div>

        <p className="text-sm text-ink/40 mt-5">
          Gratuit pour 3 patients · Aucune carte bancaire requise
        </p>

        {/* App preview placeholder */}
        <div className="mt-16 relative">
          <div className="bg-white rounded-2xl shadow-2xl shadow-ink/10 border border-border overflow-hidden">
            <div className="h-10 bg-teal-50 border-b border-border flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-300"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-300"></div>
              <div className="w-3 h-3 rounded-full bg-green-300"></div>
              <div className="mx-auto text-xs text-ink/30 font-mono">
                app.theraflow.fr/dashboard
              </div>
            </div>
            <div className="h-80 bg-gradient-to-br from-teal-50 to-white flex items-center justify-center">
              <p className="text-ink/30 text-sm">Aperçu de l&apos;application</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Social proof ─────────────────────────────────────────────────────────────

function SocialProof() {
  const specialties = [
    "Psychologues",
    "Ostéopathes",
    "Kinésithérapeutes",
    "Naturopathes",
    "Sophrologues",
    "Nutritionnistes",
  ];

  return (
    <section className="py-12 border-y border-border bg-white/50">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-sm text-ink/40 mb-6 uppercase tracking-wider font-medium">
          Conçu pour les thérapeutes libéraux
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {specialties.map((s) => (
            <span
              key={s}
              className="text-ink/60 text-sm font-medium px-4 py-2 bg-white rounded-full border border-border"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const features = [
  {
    icon: "📅",
    title: "Agenda intelligent",
    description:
      "Vue semaine et mois, glisser-déposer, rappels automatiques 24h avant chaque séance par SMS et email.",
  },
  {
    icon: "👤",
    title: "Fiches patients complètes",
    description:
      "Historique des séances, notes cliniques sécurisées, documents partagés. Tout sur une seule page.",
  },
  {
    icon: "💶",
    title: "Facturation en 1 clic",
    description:
      "Générez et envoyez vos factures PDF directement depuis l'application. Suivez les paiements en temps réel.",
  },
  {
    icon: "📱",
    title: "Rappels SMS automatiques",
    description:
      "Réduisez les no-shows jusqu'à 80%. Vos patients reçoivent un rappel automatique avant leur rendez-vous.",
  },
  {
    icon: "🔒",
    title: "Conforme RGPD",
    description:
      "Données chiffrées, hébergées en Europe. Conforme aux exigences de secret professionnel et RGPD.",
  },
  {
    icon: "📊",
    title: "Tableau de bord revenus",
    description:
      "Visualisez vos revenus, taux de remplissage et statistiques mensuelles d'un coup d'œil.",
  },
];

function Features() {
  return (
    <section id="fonctionnalites" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl text-ink mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-ink/60 text-lg max-w-xl mx-auto">
            Pas de fonctionnalités inutiles. Juste ce qui compte pour bien gérer
            votre cabinet au quotidien.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-6 border border-border hover:border-teal-400/40 hover:shadow-md transition-all"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="font-semibold text-ink text-lg mb-2">
                {feature.title}
              </h3>
              <p className="text-ink/60 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

const checkIcon = (
  <span className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
      <path
        d="M1 4l3 3 5-6"
        stroke="#1D9E75"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

function Pricing() {
  return (
    <section id="tarifs" className="py-24 px-4 bg-white border-y border-border">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl text-ink mb-4">
            Un tarif simple et transparent
          </h2>
          <p className="text-ink/60 text-lg">
            Commencez gratuitement, passez en Pro quand vous êtes prêt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free */}
          <div className="rounded-2xl border border-border p-8">
            <div className="mb-6">
              <h3 className="font-semibold text-ink text-xl mb-1">Gratuit</h3>
              <p className="text-ink/50 text-sm">Pour découvrir Theraflow</p>
            </div>
            <div className="mb-8">
              <span className="text-4xl font-bold text-ink">0€</span>
              <span className="text-ink/40 ml-1">/mois</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                "3 patients maximum",
                "Agenda de base",
                "Fiches patients",
                "Facturation manuelle",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-ink/70">
                  {checkIcon}
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center text-sm font-medium border border-border bg-white hover:bg-teal-50 text-ink px-6 py-2.5 rounded-xl transition-colors"
            >
              Commencer gratuitement
            </Link>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border-2 border-teal-400 p-8 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal-400 text-white text-xs font-semibold px-4 py-1 rounded-full">
              Le plus populaire
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-ink text-xl mb-1">Pro</h3>
              <p className="text-ink/50 text-sm">Pour les cabinets actifs</p>
            </div>
            <div className="mb-8">
              <span className="text-4xl font-bold text-ink">39€</span>
              <span className="text-ink/40 ml-1">/mois</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                "Patients illimités",
                "Rappels SMS automatiques",
                "Factures PDF en 1 clic",
                "Envoi factures par email",
                "Tableau de bord revenus",
                "Support prioritaire",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-ink/70">
                  {checkIcon}
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center text-sm font-medium bg-teal-400 hover:bg-teal-600 text-white px-6 py-2.5 rounded-xl transition-colors shadow-lg shadow-teal-400/25"
            >
              Commencer l&apos;essai gratuit
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-ink/40 mt-8">
          14 jours d&apos;essai gratuit sur le plan Pro · Aucun engagement · Résiliation
          en ligne
        </p>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const faqs = [
  {
    q: "Mes données patients sont-elles sécurisées ?",
    a: "Oui. Toutes les données sont chiffrées et hébergées sur des serveurs en Europe. Theraflow est conforme au RGPD et respecte le secret professionnel. Seul vous avez accès à vos données.",
  },
  {
    q: "Puis-je importer mes patients existants ?",
    a: "Oui, vous pouvez importer vos patients depuis un fichier CSV (Excel). Nous guidons l'import étape par étape.",
  },
  {
    q: "Les rappels SMS fonctionnent-ils vraiment ?",
    a: "Les rappels SMS sont envoyés automatiquement 24h avant chaque rendez-vous confirmé. Nos utilisateurs constatent en moyenne 70% de no-shows en moins.",
  },
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui, sans conditions. Vous pouvez annuler votre abonnement Pro à tout moment depuis votre espace. Vous conservez l'accès jusqu'à la fin de la période payée.",
  },
  {
    q: "Theraflow fonctionne-t-il sur mobile ?",
    a: "L'application est entièrement responsive et fonctionne sur tous les appareils. Une application mobile native est en cours de développement.",
  },
  {
    q: "Que se passe-t-il si je dépasse 3 patients en version gratuite ?",
    a: "Vous pourrez consulter vos patients existants mais ne pourrez pas en ajouter de nouveaux. Passez en Pro pour lever cette limite instantanément.",
  },
];

function FAQ() {
  return (
    <section id="faq" className="py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl text-ink mb-4">
            Questions fréquentes
          </h2>
          <p className="text-ink/60 text-lg">
            Une question non listée ?{" "}
            <a
              href="mailto:hello@theraflow.fr"
              className="text-teal-400 hover:underline"
            >
              Écrivez-nous
            </a>
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group bg-white rounded-2xl border border-border p-6 cursor-pointer"
            >
              <summary className="flex items-center justify-between font-medium text-ink list-none">
                {faq.q}
                <span className="ml-4 flex-shrink-0 text-teal-400 transition-transform group-open:rotate-45 text-xl leading-none">
                  +
                </span>
              </summary>
              <p className="mt-4 text-ink/60 text-sm leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA final ───────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-3xl mx-auto text-center bg-teal-400 rounded-3xl p-12">
        <h2 className="font-serif text-4xl text-white mb-4">
          Prêt à simplifier votre cabinet ?
        </h2>
        <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto">
          Rejoignez les thérapeutes qui gagnent du temps et se concentrent sur
          l&apos;essentiel : leurs patients.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center text-base font-semibold bg-white text-teal-600 hover:bg-teal-50 px-8 h-12 rounded-xl transition-colors"
        >
          Commencer gratuitement →
        </Link>
        <p className="text-white/60 text-sm mt-4">
          Gratuit pour 3 patients · Aucune carte bancaire
        </p>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border py-12 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-400 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 2C5.13 2 2 5.13 2 9s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm1 10H8V8h2v4zm0-6H8V4h2v2z"
                fill="white"
              />
            </svg>
          </div>
          <span className="font-semibold text-ink">Theraflow</span>
        </div>

        <div className="flex items-center gap-6 text-sm text-ink/50">
          <Link href="#" className="hover:text-ink transition-colors">
            Mentions légales
          </Link>
          <Link href="#" className="hover:text-ink transition-colors">
            Politique de confidentialité
          </Link>
          <Link href="#" className="hover:text-ink transition-colors">
            CGU
          </Link>
          <a
            href="mailto:hello@theraflow.fr"
            className="hover:text-ink transition-colors"
          >
            Contact
          </a>
        </div>

        <p className="text-sm text-ink/30">© 2025 Theraflow. Fait en France.</p>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <Hero />
      <SocialProof />
      <Features />
      <Pricing />
      <FAQ />
      <CTASection />
      <Footer />
    </div>
  );
}
