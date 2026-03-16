"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(navRef.current, {
        y: -24,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
      });
    });

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      ctx.revert();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white shadow-sm shadow-ink/5 border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="font-serif text-xl text-ink tracking-tight">Theraflow</span>
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mb-0.5"></span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-ink/60 font-medium">
          <a href="#fonctionnalites" className="hover:text-ink transition-colors">Fonctionnalités</a>
          <a href="#tarifs" className="hover:text-ink transition-colors">Tarifs</a>
          <a href="#faq" className="hover:text-ink transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:block text-sm font-medium text-ink/60 hover:text-ink transition-colors px-3 py-1.5"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-teal-400 hover:bg-[#0F6E56] text-white px-4 py-2 rounded-lg transition-colors"
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
  const sectionRef = useRef<HTMLElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Badge
      tl.from(badgeRef.current, { y: 20, opacity: 0, duration: 0.5 }, 0.1);

      // Title words stagger
      if (titleRef.current) {
        const words = titleRef.current.querySelectorAll(".word");
        tl.from(words, { y: 40, opacity: 0, duration: 0.6, stagger: 0.08 }, 0.2);
      }

      // Subtitle
      tl.from(subRef.current, { y: 16, opacity: 0, duration: 0.5 }, 0.65);

      // CTAs
      tl.from(ctaRef.current, { y: 16, opacity: 0, duration: 0.5 }, 0.8);

      // Mockup
      tl.from(mockupRef.current, {
        y: 40,
        opacity: 0,
        rotateX: 8,
        duration: 0.9,
        ease: "power2.out",
      }, 0.4);

      // Blob infinite animation
      if (blobRef.current) {
        gsap.to(blobRef.current, {
          scale: 1.08,
          rotate: 15,
          duration: 8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          transformOrigin: "center center",
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const titleWords = ["Votre", "cabinet,", "enfin", "à", "votre", "rythme."];

  return (
    <section ref={sectionRef} className="relative min-h-screen flex flex-col justify-center pt-24 pb-16 px-6 overflow-hidden bg-[#F7F5F0]">
      {/* Background blob */}
      <svg
        ref={blobRef}
        className="absolute -top-32 -right-32 opacity-[0.07] pointer-events-none"
        width="600"
        height="600"
        viewBox="0 0 600 600"
      >
        <path
          fill="#1D9E75"
          d="M421.5,298Q388,346,356.5,390.5Q325,435,270,453Q215,471,170,436.5Q125,402,89,355Q53,308,60.5,254.5Q68,201,105,163Q142,125,192.5,101Q243,77,299,75Q355,73,389.5,113Q424,153,441,201.5Q458,250,421.5,298Z"
        />
      </svg>

      <div className="max-w-5xl mx-auto w-full">
        {/* Badge */}
        <div ref={badgeRef} className="inline-flex items-center gap-2 bg-white border border-teal-400/20 text-teal-600 text-sm font-medium px-4 py-2 rounded-full mb-10 shadow-sm">
          <span className="text-teal-400">✦</span>
          Fait pour les thérapeutes libéraux
        </div>

        {/* Title */}
        <h1
          ref={titleRef}
          className="font-serif text-[clamp(52px,7vw,96px)] text-[#0D1F1A] leading-[1.05] mb-7"
          style={{ letterSpacing: "-0.02em" }}
        >
          {titleWords.slice(0, 2).map((w, i) => (
            <span key={i} className="word inline-block mr-[0.25em]">{w}</span>
          ))}
          <br />
          {titleWords.slice(2).map((w, i) => (
            <span key={i} className="word inline-block mr-[0.25em]">{w}</span>
          ))}
        </h1>

        {/* Subtitle */}
        <p ref={subRef} className="text-xl text-[#7A948C] max-w-xl leading-relaxed mb-10">
          Agenda, patients, facturation — tout en un.
          <br />
          Zéro formation. Zéro prise de tête.
        </p>

        {/* CTAs */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-teal-400 hover:bg-[#0F6E56] text-white text-base font-semibold px-8 py-4 rounded-xl transition-colors shadow-lg shadow-teal-400/20"
          >
            Commencer gratuitement
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <a
            href="#fonctionnalites"
            className="inline-flex items-center gap-2 bg-white border border-[#E5E3DD] text-[#0D1F1A] text-base font-medium px-8 py-4 rounded-xl transition-colors hover:bg-teal-50/60"
          >
            Voir la démo
          </a>
        </div>

        {/* Social proof */}
        <div className="flex items-center gap-3 mb-16">
          <div className="flex -space-x-2">
            {["LM", "TR", "SK", "MD"].map((initials, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold text-white"
                style={{ background: ["#1D9E75", "#0F6E56", "#2DB888", "#188A63"][i] }}
              >
                {initials}
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center gap-1 mb-0.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#1D9E75">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <p className="text-sm text-[#7A948C]">Rejoignez <strong className="text-[#0D1F1A]">800+</strong> thérapeutes</p>
          </div>
        </div>

        {/* Mockup */}
        <div
          ref={mockupRef}
          className="relative"
          style={{ perspective: "1200px" }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl shadow-ink/10 border border-[#E5E3DD] overflow-hidden"
            style={{ transform: "rotateX(4deg)" }}
          >
            {/* Browser bar */}
            <div className="h-10 bg-[#F7F5F0] border-b border-[#E5E3DD] flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-300" />
              <div className="w-3 h-3 rounded-full bg-yellow-300" />
              <div className="w-3 h-3 rounded-full bg-green-300" />
              <div className="mx-auto flex items-center gap-2 bg-white border border-[#E5E3DD] rounded-md px-3 py-1 text-xs text-[#7A948C] font-mono">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                app.theraflow.fr/dashboard
              </div>
            </div>

            {/* Dashboard mockup */}
            <div className="bg-[#F7F5F0] flex" style={{ minHeight: "360px" }}>
              {/* Sidebar */}
              <div className="hidden md:flex w-52 bg-white border-r border-[#E5E3DD] flex-col p-4 gap-1">
                <div className="flex items-center gap-2 px-3 py-2 mb-4">
                  <span className="font-serif text-base text-[#0D1F1A]">Theraflow</span>
                  <span className="w-1 h-1 rounded-full bg-teal-400" />
                </div>
                {[
                  { label: "Dashboard", active: true, icon: "▦" },
                  { label: "Agenda", active: false, icon: "◫" },
                  { label: "Patients", active: false, icon: "◎" },
                  { label: "Facturation", active: false, icon: "◈" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                      item.active
                        ? "bg-teal-50 text-teal-600 font-medium"
                        : "text-[#7A948C]"
                    }`}
                  >
                    <span className="text-xs">{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 p-6">
                <p className="text-xs text-[#7A948C] mb-4 font-medium uppercase tracking-wide">Aujourd&apos;hui</p>

                {/* Metric cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: "RDV aujourd'hui", value: "6" },
                    { label: "Patients actifs", value: "42" },
                    { label: "Revenus ce mois", value: "2 340€" },
                    { label: "Prochain RDV", value: "14h30" },
                  ].map((card) => (
                    <div key={card.label} className="bg-white rounded-xl border border-[#E5E3DD] p-4">
                      <p className="text-[10px] text-[#7A948C] uppercase tracking-wide mb-2">{card.label}</p>
                      <p className="text-xl font-semibold text-[#0D1F1A]">{card.value}</p>
                    </div>
                  ))}
                </div>

                {/* Appointment list */}
                <div className="bg-white rounded-xl border border-[#E5E3DD] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E5E3DD]">
                    <p className="text-sm font-medium text-[#0D1F1A]">Rendez-vous du jour</p>
                  </div>
                  {[
                    { time: "09h00", name: "Marie Dupont", status: "Confirmé", color: "bg-teal-50 text-teal-600" },
                    { time: "10h30", name: "Jean Martin", status: "Confirmé", color: "bg-teal-50 text-teal-600" },
                    { time: "14h30", name: "Sophie Bernard", status: "Confirmé", color: "bg-teal-50 text-teal-600" },
                  ].map((appt) => (
                    <div key={appt.time} className="flex items-center gap-4 px-4 py-3 border-b border-[#E5E3DD] last:border-0">
                      <span className="text-xs font-medium text-[#7A948C] w-12">{appt.time}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#0D1F1A]">{appt.name}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${appt.color}`}>{appt.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Stats Band ───────────────────────────────────────────────────────────────

function StatsBand() {
  const sectionRef = useRef<HTMLElement>(null);
  const statsRef = useRef<(HTMLSpanElement | null)[]>([]);

  const stats = [
    { value: 800, suffix: "+", label: "thérapeutes" },
    { value: 12, suffix: " min", label: "setup moyen" },
    { value: 94, suffix: "%", label: "satisfaction" },
    { value: 0, suffix: "€", label: "pour commencer" },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      statsRef.current.forEach((el, i) => {
        if (!el) return;
        const target = stats[i].value;
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top 80%",
          onEnter: () => {
            gsap.to({ val: 0 }, {
              val: target,
              duration: 1.5,
              ease: "power2.out",
              delay: i * 0.1,
              onUpdate: function () {
                if (el) el.textContent = Math.round(this.targets()[0].val).toString();
              },
            });
          },
          once: true,
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section ref={sectionRef} className="bg-[#1D9E75] py-16 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="text-center">
            <div className="text-4xl lg:text-5xl font-bold text-white mb-2 font-serif tabular-nums">
              <span ref={(el) => { statsRef.current[i] = el; }}>0</span>
              <span>{stat.suffix}</span>
            </div>
            <p className="text-white/70 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

function AgendaMockup() {
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven"];
  const slots = [
    { day: 0, start: 1, height: 2, name: "Marie D.", color: "bg-teal-400" },
    { day: 1, start: 0, height: 2, name: "Jean M.", color: "bg-teal-300" },
    { day: 2, start: 2, height: 2, name: "Sophie B.", color: "bg-teal-400" },
    { day: 3, start: 1, height: 2, name: "Lucas R.", color: "bg-teal-300" },
    { day: 4, start: 0, height: 3, name: "Emma L.", color: "bg-teal-400" },
  ];
  return (
    <div className="bg-white rounded-2xl border border-[#E5E3DD] overflow-hidden shadow-lg shadow-ink/5">
      <div className="px-4 py-3 border-b border-[#E5E3DD] flex items-center justify-between">
        <p className="text-sm font-semibold text-[#0D1F1A]">Semaine du 17 mars</p>
        <div className="flex gap-1">
          <button className="p-1 rounded hover:bg-[#F7F5F0] text-[#7A948C]">‹</button>
          <button className="p-1 rounded hover:bg-[#F7F5F0] text-[#7A948C]">›</button>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-px bg-[#E5E3DD] p-px">
        {days.map((day, di) => (
          <div key={day} className="bg-white">
            <div className="px-2 py-2 text-center border-b border-[#E5E3DD]">
              <p className="text-[10px] text-[#7A948C] uppercase tracking-wide">{day}</p>
            </div>
            <div className="relative p-1" style={{ minHeight: "160px" }}>
              {slots.filter(s => s.day === di).map((slot, si) => (
                <div
                  key={si}
                  className={`${slot.color} rounded-lg p-1.5 mb-1`}
                  style={{ height: `${slot.height * 44}px` }}
                >
                  <p className="text-white text-[9px] font-semibold truncate">{slot.name}</p>
                  <p className="text-white/70 text-[8px]">9h00</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PatientMockup() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E3DD] overflow-hidden shadow-lg shadow-ink/5">
      <div className="px-5 py-4 border-b border-[#E5E3DD] flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-semibold text-base">MD</div>
        <div>
          <p className="font-semibold text-[#0D1F1A]">Marie Dupont</p>
          <p className="text-xs text-[#7A948C]">Patiente depuis janvier 2024</p>
        </div>
        <span className="ml-auto text-xs bg-teal-50 text-teal-600 px-2.5 py-1 rounded-full font-medium">Active</span>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Email", value: "marie@exemple.fr" },
            { label: "Téléphone", value: "06 12 34 56 78" },
            { label: "Né(e) le", value: "14 mars 1988" },
            { label: "Séances", value: "12 séances" },
          ].map(item => (
            <div key={item.label}>
              <p className="text-[10px] text-[#7A948C] uppercase tracking-wide mb-1">{item.label}</p>
              <p className="text-sm text-[#0D1F1A] font-medium">{item.value}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-[10px] text-[#7A948C] uppercase tracking-wide mb-2">Notes de séance</p>
          <div className="bg-[#F7F5F0] rounded-xl p-3">
            <p className="text-xs text-[#0D1F1A]/70 leading-relaxed">Progression notable sur la gestion du stress. Exercices de respiration à renforcer entre les séances...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvoiceMockup() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E3DD] overflow-hidden shadow-lg shadow-ink/5">
      <div className="bg-[#0D1F1A] px-6 py-5 flex items-start justify-between">
        <div>
          <p className="font-serif text-white text-lg">Theraflow</p>
          <p className="text-white/40 text-xs mt-1">Dr. Sophie Lambert</p>
          <p className="text-white/40 text-xs">Psychologue · Paris</p>
        </div>
        <div className="text-right">
          <p className="text-white/60 text-[10px] uppercase tracking-wide">Facture</p>
          <p className="text-white font-mono font-semibold text-sm">TF-2024-042</p>
          <p className="text-white/40 text-xs mt-1">17 mars 2024</p>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] text-[#7A948C] uppercase tracking-wide mb-1">Facturé à</p>
            <p className="text-sm font-semibold text-[#0D1F1A]">Marie Dupont</p>
            <p className="text-xs text-[#7A948C]">marie@exemple.fr</p>
          </div>
          <span className="bg-green-50 text-green-600 text-xs font-semibold px-2.5 py-1 rounded-full">Payée</span>
        </div>
        <div className="bg-[#F7F5F0] rounded-xl overflow-hidden">
          <div className="grid grid-cols-3 px-4 py-2 bg-[#0D1F1A] text-white/60 text-[10px] uppercase tracking-wide">
            <span>Description</span><span className="text-center">Qté</span><span className="text-right">Montant</span>
          </div>
          <div className="grid grid-cols-3 px-4 py-3 text-sm">
            <span className="text-[#0D1F1A]">Séance thérapeutique</span>
            <span className="text-center text-[#7A948C]">1</span>
            <span className="text-right font-medium text-[#0D1F1A]">60,00 €</span>
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <div className="text-right">
            <p className="text-xs text-[#7A948C]">Total TTC</p>
            <p className="text-xl font-bold text-[#0D1F1A]">60,00 €</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const featuresData = [
  {
    id: "agenda",
    visual: <AgendaMockup />,
    visualSide: "left",
    title: "Un agenda qui pense comme vous",
    desc: "Vos RDV, vos disponibilités, vos rappels. Vos patients reçoivent un SMS automatique 24h avant. Les no-shows deviennent rares.",
    pills: ["Rappels SMS", "Vue semaine/mois", "Lien de réservation"],
  },
  {
    id: "patients",
    visual: <PatientMockup />,
    visualSide: "right",
    title: "Chaque patient, une histoire complète",
    desc: "Notes de séance, historique, coordonnées. Tout au même endroit, accessible en 2 clics. Confidentiel et conforme RGPD.",
    pills: ["Chiffré", "Historique complet", "RGPD"],
  },
  {
    id: "facturation",
    visual: <InvoiceMockup />,
    visualSide: "left",
    title: "Facturez en 30 secondes",
    desc: "Générez et envoyez une facture PDF directement depuis l'app. Suivez vos encaissements sans ouvrir Excel.",
    pills: ["PDF automatique", "Envoi email", "Suivi paiements"],
  },
];

function Features() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const blocks = sectionRef.current?.querySelectorAll(".feature-block");
      blocks?.forEach((block) => {
        const isLeft = block.getAttribute("data-visual") === "left";

        gsap.from(block.querySelector(".feature-visual"), {
          x: isLeft ? -60 : 60,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: { trigger: block, start: "top 75%", once: true },
        });

        gsap.from(block.querySelector(".feature-text"), {
          x: isLeft ? 60 : -60,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: { trigger: block, start: "top 75%", once: true },
        });

        const pills = block.querySelectorAll(".feature-pill");
        gsap.from(pills, {
          y: 12,
          opacity: 0,
          duration: 0.4,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: { trigger: block, start: "top 65%", once: true },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="fonctionnalites" className="py-28 px-6 bg-[#F7F5F0]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="font-serif text-4xl lg:text-5xl text-[#0D1F1A] mb-4" style={{ letterSpacing: "-0.02em" }}>
            Tout ce dont vous avez besoin.<br />Rien de plus.
          </h2>
        </div>

        <div className="space-y-28">
          {featuresData.map((feature) => (
            <div
              key={feature.id}
              className="feature-block grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
              data-visual={feature.visualSide}
            >
              {feature.visualSide === "left" ? (
                <>
                  <div className="feature-visual">{feature.visual}</div>
                  <div className="feature-text">
                    <h3 className="font-serif text-3xl text-[#0D1F1A] mb-4" style={{ letterSpacing: "-0.01em" }}>
                      {feature.title}
                    </h3>
                    <p className="text-[#7A948C] text-lg leading-relaxed mb-6">{feature.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {feature.pills.map((pill) => (
                        <span
                          key={pill}
                          className="feature-pill bg-white border border-[#E5E3DD] text-[#0D1F1A] text-sm font-medium px-4 py-1.5 rounded-full"
                        >
                          {pill}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="feature-text lg:order-first">
                    <h3 className="font-serif text-3xl text-[#0D1F1A] mb-4" style={{ letterSpacing: "-0.01em" }}>
                      {feature.title}
                    </h3>
                    <p className="text-[#7A948C] text-lg leading-relaxed mb-6">{feature.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {feature.pills.map((pill) => (
                        <span
                          key={pill}
                          className="feature-pill bg-white border border-[#E5E3DD] text-[#0D1F1A] text-sm font-medium px-4 py-1.5 rounded-full"
                        >
                          {pill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="feature-visual">{feature.visual}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials Marquee ─────────────────────────────────────────────────────

const testimonials = [
  { initials: "LM", color: "#1D9E75", name: "Léa M.", role: "Psychologue", city: "Paris", text: "J'ai arrêté Excel le jour où j'ai essayé Theraflow. Je ne pensais pas que c'était possible d'être aussi simple." },
  { initials: "TR", color: "#0F6E56", name: "Thomas R.", role: "Ostéopathe", city: "Lyon", text: "Mes patients adorent recevoir le lien de réservation. Les no-shows ont chuté de 60%." },
  { initials: "SK", color: "#2DB888", name: "Sarah K.", role: "Kinésithérapeute", city: "Bordeaux", text: "La facturation me prenait 2h par semaine. Maintenant c'est 10 minutes." },
  { initials: "MD", color: "#188A63", name: "Marc D.", role: "Psychologue", city: "Marseille", text: "Interface tellement claire. J'ai tout configuré en moins de 15 minutes." },
  { initials: "JP", color: "#1D9E75", name: "Julie P.", role: "Thérapeute EMDR", city: "Nantes", text: "Enfin un outil fait pour nous, pas pour des médecins ou des grandes cliniques." },
  { initials: "AB", color: "#0F6E56", name: "Antoine B.", role: "Sophrologue", city: "Toulouse", text: "Le support est réactif et les mises à jour régulières. On sent que l'équipe écoute." },
];

function TestimonialCard({ t }: { t: typeof testimonials[0] }) {
  return (
    <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-[#E5E3DD] p-6 mx-3">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
          style={{ background: t.color }}
        >
          {t.initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0D1F1A]">{t.name}</p>
          <p className="text-xs text-[#7A948C]">{t.role} · {t.city}</p>
        </div>
      </div>
      <div className="flex gap-0.5 mb-3">
        {[...Array(5)].map((_, i) => (
          <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#1D9E75">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
      <p className="text-sm text-[#0D1F1A]/70 italic leading-relaxed">&ldquo;{t.text}&rdquo;</p>
    </div>
  );
}

function Testimonials() {
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const totalWidth = track.scrollWidth / 2;

    const tween = gsap.to(track, {
      x: -totalWidth,
      duration: 40,
      ease: "none",
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize((x) => parseFloat(x) % totalWidth),
      },
    });

    tweenRef.current = tween;
    return () => { tween.kill(); };
  }, []);

  useEffect(() => {
    if (!tweenRef.current) return;
    paused ? tweenRef.current.pause() : tweenRef.current.resume();
  }, [paused]);

  const doubled = [...testimonials, ...testimonials];

  return (
    <section className="py-24 overflow-hidden bg-white border-y border-[#E5E3DD]">
      <div className="max-w-5xl mx-auto px-6 mb-12 text-center">
        <h2 className="font-serif text-4xl lg:text-5xl text-[#0D1F1A]" style={{ letterSpacing: "-0.02em" }}>
          Ils ont simplifié leur cabinet
        </h2>
      </div>
      <div
        className="relative overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div ref={trackRef} className="flex" style={{ width: "max-content" }}>
          {doubled.map((t, i) => (
            <TestimonialCard key={i} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

function Pricing() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".pricing-card", {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%", once: true },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const freeFeatures = [
    "3 patients maximum",
    "Agenda complet",
    "Rappels email",
    "Support communauté",
  ];

  const proFeatures = [
    "Patients illimités",
    "Rappels SMS automatiques",
    "Facturation PDF",
    "Export comptable",
    "Support prioritaire",
    "Mises à jour en avant-première",
  ];

  const CheckIcon = ({ dark }: { dark?: boolean }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={dark ? "#1D9E75" : "#4ade80"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  return (
    <section ref={sectionRef} id="tarifs" className="py-28 px-6 bg-[#F7F5F0]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl lg:text-5xl text-[#0D1F1A] mb-4" style={{ letterSpacing: "-0.02em" }}>
            Simple. Transparent.<br />Sans surprise.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="pricing-card bg-white rounded-2xl border border-[#E5E3DD] p-8">
            <p className="text-xs font-semibold text-[#7A948C] uppercase tracking-widest mb-4">Pour démarrer</p>
            <div className="mb-8">
              <span className="text-5xl font-bold text-[#0D1F1A] font-serif">Gratuit</span>
            </div>
            <ul className="space-y-3 mb-8">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-[#0D1F1A]/70">
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center text-sm font-semibold border-2 border-[#E5E3DD] text-[#0D1F1A] py-3 rounded-xl hover:bg-[#F7F5F0] transition-colors"
            >
              Commencer gratuitement
            </Link>
          </div>

          {/* Pro */}
          <div className="pricing-card relative bg-[#0D1F1A] rounded-2xl p-8 transition-transform hover:scale-[1.02] duration-200">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal-400 text-white text-xs font-bold px-5 py-1.5 rounded-full tracking-wide">
              Le plus populaire
            </div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Pour votre cabinet complet</p>
            <div className="mb-8 flex items-baseline gap-2">
              <span className="text-5xl font-bold text-white font-serif">39€</span>
              <span className="text-white/40 text-sm">/ mois</span>
            </div>
            <ul className="space-y-3 mb-8">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-white/80">
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center text-sm font-semibold bg-teal-400 hover:bg-[#0F6E56] text-white py-3 rounded-xl transition-colors"
            >
              Commencer l&apos;essai gratuit 14 jours
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-[#7A948C] mt-8">
          Aucun engagement · Résiliation en ligne · Aucune carte bancaire pour l&apos;essai
        </p>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const faqs = [
  {
    q: "Est-ce que mes données patients sont sécurisées ?",
    a: "Oui. Toutes les données sont hébergées en Europe, chiffrées et conformes au RGPD. Nous ne vendons jamais vos données.",
  },
  {
    q: "Puis-je importer mes patients existants ?",
    a: "Oui, via un fichier CSV. L'import prend moins de 2 minutes.",
  },
  {
    q: "Y a-t-il un engagement ?",
    a: "Aucun. Vous pouvez annuler à tout moment, sans frais ni question.",
  },
  {
    q: "Theraflow fonctionne-t-il sur mobile ?",
    a: "Oui, l'application est entièrement responsive et optimisée pour mobile et tablette.",
  },
  {
    q: "Que se passe-t-il si je dépasse 3 patients en Free ?",
    a: "Vous ne pouvez plus ajouter de nouveaux patients mais vous gardez accès à tous vos patients existants. Passez en Pro pour débloquer l'illimité.",
  },
  {
    q: "Comment fonctionne l'essai gratuit Pro ?",
    a: "14 jours complets en Pro, sans carte bancaire. À la fin de l'essai, vous choisissez de continuer ou de rester en Free.",
  },
];

function FAQ() {
  const sectionRef = useRef<HTMLElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  function toggle(i: number) {
    const prev = openIndex;
    setOpenIndex(openIndex === i ? null : i);

    // Close previous
    if (prev !== null && prev !== i && contentRefs.current[prev]) {
      gsap.to(contentRefs.current[prev], { height: 0, opacity: 0, duration: 0.3, ease: "power2.inOut" });
    }

    // Open/close current
    const el = contentRefs.current[i];
    if (!el) return;

    if (openIndex === i) {
      gsap.to(el, { height: 0, opacity: 0, duration: 0.3, ease: "power2.inOut" });
    } else {
      gsap.set(el, { height: "auto" });
      const h = el.offsetHeight;
      gsap.fromTo(el, { height: 0, opacity: 0 }, { height: h, opacity: 1, duration: 0.35, ease: "power2.out" });
    }
  }

  return (
    <section ref={sectionRef} id="faq" className="py-28 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl lg:text-5xl text-[#0D1F1A]" style={{ letterSpacing: "-0.02em" }}>
            Questions fréquentes
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-[#F7F5F0] rounded-2xl overflow-hidden border border-[#E5E3DD]">
              <button
                className="w-full flex items-center justify-between px-6 py-5 text-left"
                onClick={() => toggle(i)}
              >
                <span className="font-medium text-[#0D1F1A] pr-4">{faq.q}</span>
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-teal-400/40 flex items-center justify-center text-teal-400 font-medium transition-transform duration-300"
                  style={{ transform: openIndex === i ? "rotate(45deg)" : "rotate(0deg)" }}
                >
                  +
                </span>
              </button>
              <div
                ref={(el) => { contentRefs.current[i] = el; }}
                style={{ height: 0, overflow: "hidden", opacity: 0 }}
              >
                <p className="px-6 pb-5 text-sm text-[#7A948C] leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function CTAFinal() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        scale: 0.95,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: ref.current, start: "top 80%", once: true },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="py-28 px-6 bg-[#0D1F1A]">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-serif text-4xl lg:text-[56px] text-white mb-6 leading-tight" style={{ letterSpacing: "-0.02em" }}>
          Votre prochain rendez-vous<br />mérite mieux qu&apos;Excel.
        </h2>
        <p className="text-white/50 text-lg mb-10">
          Rejoignez Theraflow gratuitement.<br />Configuré en 12 minutes.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-3 bg-teal-400 hover:bg-[#0F6E56] text-white text-lg font-semibold px-10 py-5 rounded-2xl transition-colors shadow-xl shadow-teal-400/20"
        >
          Commencer gratuitement
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
        <p className="text-white/30 text-sm mt-5">Aucune carte bancaire requise</p>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-[#0D1F1A] border-t border-white/5 py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="font-serif text-xl text-white">Theraflow</span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mb-0.5" />
            </div>
            <p className="text-white/30 text-sm leading-relaxed">Gérez votre cabinet en 5 minutes par jour.</p>
          </div>

          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-4">Produit</p>
            <ul className="space-y-3">
              {["Fonctionnalités", "Tarifs", "FAQ"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-white/40 text-sm hover:text-white/80 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-4">Légal</p>
            <ul className="space-y-3">
              {["Mentions légales", "Confidentialité", "CGU"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-white/40 text-sm hover:text-white/80 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-4">Contact</p>
            <ul className="space-y-3">
              <li>
                <a href="mailto:hello@theraflow.fr" className="text-white/40 text-sm hover:text-white/80 transition-colors">hello@theraflow.fr</a>
              </li>
              <li>
                <a href="#" className="text-white/40 text-sm hover:text-white/80 transition-colors">Support</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-sm">© 2024 Theraflow · Fait avec soin en France 🇫🇷</p>
          <p className="text-white/20 text-sm">Conforme RGPD · Hébergé en Europe</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <Navbar />
      <Hero />
      <StatsBand />
      <Features />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTAFinal />
      <Footer />
    </div>
  );
}
