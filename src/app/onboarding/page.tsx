"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  saveSpecialty,
  saveAvailability,
  saveFirstPatient,
  completeOnboarding,
} from "./actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const pct = (step / 4) * 100;
  return (
    <div className="w-full h-1 bg-[#E8E6E0] rounded-full overflow-hidden">
      <div
        className="h-full bg-teal-400 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Step 1 — Spécialité ──────────────────────────────────────────────────────

const SPECIALTIES = [
  {
    key: "psychologue",
    label: "Psychologue / Psychothérapeute",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    key: "osteopathe",
    label: "Ostéopathe",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
  },
  {
    key: "kinesitherapeute",
    label: "Kinésithérapeute",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 6.1H3" /><path d="M21 12.1H3" /><path d="M15.1 18H3" />
      </svg>
    ),
  },
  {
    key: "autre",
    label: "Autre thérapeute",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

function Step1({
  selected,
  onSelect,
  onNext,
  loading,
}: {
  selected: string;
  onSelect: (v: string) => void;
  onNext: () => void;
  loading: boolean;
}) {
  return (
    <div>
      <h1 className="font-serif text-3xl text-[#0D1F1A] mb-2">Bienvenue sur Theraflow 👋</h1>
      <p className="text-[#7A948C] mb-8">Commençons par mieux vous connaître.</p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {SPECIALTIES.map((s) => (
          <button
            key={s.key}
            onClick={() => onSelect(s.key)}
            className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 text-left transition-all ${
              selected === s.key
                ? "border-teal-400 bg-teal-50 text-teal-700"
                : "border-[#E8E6E0] bg-white hover:border-teal-400/40 hover:bg-teal-50/40 text-[#0D1F1A]"
            }`}
          >
            <span className={selected === s.key ? "text-teal-500" : "text-[#7A948C]"}>
              {s.icon}
            </span>
            <span className="text-sm font-medium text-center leading-snug">{s.label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={!selected || loading}
        className="w-full py-3.5 rounded-xl bg-teal-400 hover:bg-[#0F6E56] disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {loading ? <Spinner /> : null}
        Continuer
      </button>
    </div>
  );
}

// ─── Step 2 — Horaires ────────────────────────────────────────────────────────

const DAYS = [
  { key: 1, label: "Lun" },
  { key: 2, label: "Mar" },
  { key: 3, label: "Mer" },
  { key: 4, label: "Jeu" },
  { key: 5, label: "Ven" },
  { key: 6, label: "Sam" },
  { key: 0, label: "Dim" },
];

const DURATIONS = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 heure" },
  { value: 90, label: "1h30" },
];

function Step2({
  days,
  setDays,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  duration,
  setDuration,
  onNext,
  onSkip,
  loading,
}: {
  days: number[];
  setDays: (d: number[]) => void;
  startTime: string;
  setStartTime: (v: string) => void;
  endTime: string;
  setEndTime: (v: string) => void;
  duration: number;
  setDuration: (v: number) => void;
  onNext: () => void;
  onSkip: () => void;
  loading: boolean;
}) {
  function toggleDay(d: number) {
    setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d]);
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-[#0D1F1A] mb-2">Vos horaires de consultation</h1>
      <p className="text-[#7A948C] mb-8">Vos patients verront ces créneaux pour réserver.</p>

      <div className="space-y-6 mb-8">
        {/* Jours */}
        <div>
          <label className="block text-sm font-medium text-[#0D1F1A] mb-3">Jours d&apos;ouverture</label>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map((d) => (
              <button
                key={d.key}
                onClick={() => toggleDay(d.key)}
                className={`w-12 h-12 rounded-xl text-sm font-medium border-2 transition-all ${
                  days.includes(d.key)
                    ? "bg-teal-400 border-teal-400 text-white"
                    : "bg-white border-[#E8E6E0] text-[#0D1F1A] hover:border-teal-400/40"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Horaires */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#0D1F1A] mb-2">Heure de début</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8E6E0] bg-white text-[#0D1F1A] text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0D1F1A] mb-2">Heure de fin</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8E6E0] bg-white text-[#0D1F1A] text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition"
            />
          </div>
        </div>

        {/* Durée par défaut */}
        <div>
          <label className="block text-sm font-medium text-[#0D1F1A] mb-3">Durée d&apos;une séance</label>
          <div className="grid grid-cols-4 gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDuration(d.value)}
                className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                  duration === d.value
                    ? "bg-teal-400 border-teal-400 text-white"
                    : "bg-white border-[#E8E6E0] text-[#0D1F1A] hover:border-teal-400/40"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={days.length === 0 || loading}
        className="w-full py-3.5 rounded-xl bg-teal-400 hover:bg-[#0F6E56] disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {loading ? <Spinner /> : null}
        Continuer
      </button>
      <button onClick={onSkip} className="w-full mt-3 py-2 text-sm text-[#7A948C] hover:text-[#0D1F1A] transition-colors">
        Passer cette étape
      </button>
    </div>
  );
}

// ─── Step 3 — Premier patient ─────────────────────────────────────────────────

function Step3({
  onNext,
  onSkip,
  loading,
  error,
}: {
  onNext: (data: { first_name: string; last_name: string; email: string; phone: string }) => void;
  onSkip: () => void;
  loading: boolean;
  error?: string;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div>
      <h1 className="font-serif text-3xl text-[#0D1F1A] mb-2">Ajoutez votre premier patient</h1>
      <p className="text-[#7A948C] mb-8">Ou passez cette étape, vous pourrez le faire plus tard.</p>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-4 mb-8">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[#0D1F1A] mb-1.5">Prénom <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Marie"
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8E6E0] bg-white text-[#0D1F1A] placeholder:text-[#7A948C]/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0D1F1A] mb-1.5">Nom <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Dupont"
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8E6E0] bg-white text-[#0D1F1A] placeholder:text-[#7A948C]/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0D1F1A] mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="marie.dupont@exemple.fr"
            className="w-full px-3 py-2.5 rounded-xl border border-[#E8E6E0] bg-white text-[#0D1F1A] placeholder:text-[#7A948C]/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0D1F1A] mb-1.5">Téléphone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="06 12 34 56 78"
            className="w-full px-3 py-2.5 rounded-xl border border-[#E8E6E0] bg-white text-[#0D1F1A] placeholder:text-[#7A948C]/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition"
          />
        </div>
      </div>

      <button
        onClick={() => onNext({ first_name: firstName, last_name: lastName, email, phone })}
        disabled={!firstName.trim() || !lastName.trim() || loading}
        className="w-full py-3.5 rounded-xl bg-teal-400 hover:bg-[#0F6E56] disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {loading ? <Spinner /> : null}
        Ajouter ce patient
      </button>
      <button onClick={onSkip} className="w-full mt-3 py-2 text-sm text-[#7A948C] hover:text-[#0D1F1A] transition-colors">
        Passer cette étape
      </button>
    </div>
  );
}

// ─── Step 4 — Lien de réservation ─────────────────────────────────────────────

function Step4({
  fullName,
  slug,
  setSlug,
  onFinish,
  loading,
  error,
}: {
  fullName: string;
  slug: string;
  setSlug: (v: string) => void;
  onFinish: () => void;
  loading: boolean;
  error?: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://theraflow-app.vercel.app"}/book/${slug}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mb-6">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </div>
      <h1 className="font-serif text-3xl text-[#0D1F1A] mb-2">Votre lien de réservation est prêt !</h1>
      <p className="text-[#7A948C] mb-8">Partagez-le à vos patients pour qu&apos;ils réservent directement.</p>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {/* Slug editor */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-[#0D1F1A] mb-1.5">Votre identifiant URL</label>
        <div className="flex items-center border border-[#E8E6E0] rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-teal-400/30 focus-within:border-teal-400 transition">
          <span className="pl-3 py-2.5 text-sm text-[#7A948C] whitespace-nowrap shrink-0">
            /book/
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            className="flex-1 py-2.5 pr-3 text-sm text-[#0D1F1A] bg-transparent focus:outline-none"
          />
        </div>
      </div>

      {/* URL display */}
      <div className="bg-[#F7F5F0] rounded-xl p-4 mb-4">
        <p className="text-xs text-[#7A948C] mb-1">Votre lien</p>
        <p className="text-sm font-mono text-[#0D1F1A] break-all">{url}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleCopy}
          className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            copied
              ? "border-teal-400 bg-teal-50 text-teal-600"
              : "border-[#E8E6E0] text-[#0D1F1A] hover:border-teal-400/40"
          }`}
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copié !
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copier le lien
            </>
          )}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 rounded-xl border-2 border-[#E8E6E0] text-sm font-medium text-[#0D1F1A] hover:border-teal-400/40 transition-all flex items-center justify-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Voir ma page
        </a>
      </div>

      <button
        onClick={onFinish}
        disabled={!slug || loading}
        className="w-full py-3.5 rounded-xl bg-teal-400 hover:bg-[#0F6E56] disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {loading ? <Spinner /> : null}
        Accéder à mon dashboard →
      </button>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Step 1
  const [specialty, setSpecialty] = useState("");

  // Step 2
  const [days, setDays] = useState([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [duration, setDuration] = useState(60);

  // Step 4
  const [fullName, setFullName] = useState("");
  const [slug, setSlug] = useState("");

  // Fetch profile data to pre-fill slug
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.full_name) {
          setFullName(d.full_name);
          setSlug(slugify(d.full_name));
        } else if (d.email) {
          setSlug(slugify(d.email.split("@")[0]));
        }
      })
      .catch(() => {});
  }, []);

  function goTo(next: number, dir: "forward" | "back") {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
      setError(undefined);
    }, 320);
  }

  async function handleStep1Next() {
    setLoading(true);
    const res = await saveSpecialty(specialty);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    goTo(2, "forward");
  }

  async function handleStep2Next() {
    setLoading(true);
    const res = await saveAvailability({ days, startTime, endTime, sessionDuration: duration });
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    goTo(3, "forward");
  }

  async function handleStep3Next(data: { first_name: string; last_name: string; email: string; phone: string }) {
    setLoading(true);
    const res = await saveFirstPatient(data);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    goTo(4, "forward");
  }

  async function handleFinish() {
    setLoading(true);
    const res = await completeOnboarding(slug);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    router.push("/dashboard");
  }

  const slideClass = animating
    ? direction === "forward"
      ? "translate-x-full opacity-0"
      : "-translate-x-full opacity-0"
    : "translate-x-0 opacity-100";

  const stepLabels = ["Spécialité", "Horaires", "Premier patient", "Lien de réservation"];

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="font-serif text-xl text-[#0D1F1A]">Theraflow</span>
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
        </Link>
        <span className="text-sm text-[#7A948C]">Étape {step} sur 4</span>
      </div>

      {/* Progress */}
      <div className="px-6 mb-8">
        <ProgressBar step={step} />
        <div className="flex justify-between mt-2">
          {stepLabels.map((label, i) => (
            <span
              key={i}
              className={`text-xs ${step === i + 1 ? "text-teal-600 font-medium" : step > i + 1 ? "text-teal-400" : "text-[#7A948C]/50"}`}
            >
              {i + 1 === 1 || i + 1 === step || i + 1 === 4 ? label : ""}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-6 pb-12">
        <div className="w-full max-w-[560px] overflow-hidden">
          <div
            className={`transition-all duration-300 ease-out ${slideClass}`}
          >
            {step === 1 && (
              <Step1
                selected={specialty}
                onSelect={setSpecialty}
                onNext={handleStep1Next}
                loading={loading}
              />
            )}
            {step === 2 && (
              <Step2
                days={days}
                setDays={setDays}
                startTime={startTime}
                setStartTime={setStartTime}
                endTime={endTime}
                setEndTime={setEndTime}
                duration={duration}
                setDuration={setDuration}
                onNext={handleStep2Next}
                onSkip={() => goTo(3, "forward")}
                loading={loading}
              />
            )}
            {step === 3 && (
              <Step3
                onNext={handleStep3Next}
                onSkip={() => goTo(4, "forward")}
                loading={loading}
                error={error}
              />
            )}
            {step === 4 && (
              <Step4
                fullName={fullName}
                slug={slug}
                setSlug={setSlug}
                onFinish={handleFinish}
                loading={loading}
                error={error}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
