"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  User, Calendar, Bell, CreditCard, Download, Shield,
  Copy, ExternalLink, Check, Camera, Eye, EyeOff,
  AlertTriangle, Loader2, Users, FileText, Receipt,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  saveProfileInfo,
  saveAvatarUrl,
  saveSlug,
  saveAvailabilitySettings,
  saveNotificationSettings,
  changePassword,
  deleteAccount,
} from "./actions";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProfileData = {
  first_name: string | null;
  last_name: string | null;
  specialty: string | null;
  phone: string | null;
  avatar_url: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  slug: string | null;
  notif_new_booking: boolean;
  notif_reminder: boolean;
  notif_invoice: boolean;
  notif_weekly_recap: boolean;
  recap_day: number;
  sms_reminders_enabled: boolean;
  sms_reminder_delay: number;
};

export type AvailabilityData = {
  days: number[];
  startTime: string;
  endTime: string;
  sessionDuration: number;
  lunchBreakEnabled: boolean;
  lunchStart: string;
  lunchEnd: string;
  defaultPrice: number;
};

export type SubscriptionData = {
  plan: "free" | "pro";
  status: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
};

interface Props {
  userId: string;
  email: string;
  profile: ProfileData;
  availability: AvailabilityData | null;
  subscription: SubscriptionData | null;
  patientCount: number;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const SPECIALTY_OPTIONS = [
  { value: "", label: "Non renseignée" },
  { value: "psychologue", label: "Psychologue" },
  { value: "osteopathe", label: "Ostéopathe" },
  { value: "kinesitherapeute", label: "Kinésithérapeute" },
  { value: "autre", label: "Autre" },
];

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
  { value: 60, label: "1h" },
  { value: 90, label: "1h30" },
];

const SMS_DELAYS = [
  { value: 1, label: "1h avant" },
  { value: 24, label: "24h avant" },
  { value: 48, label: "48h avant" },
];

const RECAP_DAYS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 0, label: "Dimanche" },
];

const NAV_ITEMS = [
  { id: "profil", label: "Profil", icon: User },
  { id: "agenda", label: "Agenda", icon: Calendar },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "abonnement", label: "Abonnement", icon: CreditCard },
  { id: "export", label: "Export", icon: Download },
  { id: "securite", label: "Sécurité", icon: Shield },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function passwordStrength(pwd: string): 0 | 1 | 2 | 3 | 4 {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s as 0 | 1 | 2 | 3 | 4;
}

const STRENGTH_LABELS = ["", "Faible", "Moyen", "Fort", "Très fort"];
const STRENGTH_COLORS = ["", "bg-red-400", "bg-amber-400", "bg-teal-400", "bg-teal-500"];

// ─── Petit composant de feedback inline ───────────────────────────────────────

function InlineFeedback({ msg }: { msg: { text: string; type: "ok" | "err" } | null }) {
  if (!msg) return null;
  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
        msg.type === "ok"
          ? "bg-teal-50 border border-teal-200 text-teal-700"
          : "bg-red-50 border border-red-200 text-red-700"
      }`}
    >
      {msg.type === "ok" ? <Check size={14} /> : <AlertTriangle size={14} />}
      {msg.text}
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${
        checked ? "bg-teal-400" : "bg-ink/20"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ─── Input style ──────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink placeholder:text-ink/30 text-sm transition";

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-serif text-[18px] text-ink">{title}</h2>
      <p className="text-sm text-ink/45 mt-0.5">{desc}</p>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-border my-6" />;
}

// ─── useSection feedback ──────────────────────────────────────────────────────

function useFeedback() {
  const [msg, setMsg] = useState<{ text: string; type: "ok" | "err" } | null>(null);
  const [pending, start] = useTransition();

  function show(text: string, type: "ok" | "err") {
    setMsg({ text, type });
    if (type === "ok") setTimeout(() => setMsg(null), 3000);
  }

  return { msg, pending, start, show };
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export function ParametresClient({
  userId,
  email,
  profile,
  availability,
  subscription,
  patientCount,
}: Props) {
  const [activeSection, setActiveSection] = useState("profil");

  const sectionComponents: Record<string, React.ReactNode> = {
    profil: <ProfileSection userId={userId} email={email} profile={profile} />,
    agenda: <AgendaSection userId={userId} profile={profile} availability={availability} />,
    notifications: <NotificationsSection profile={profile} isPro={subscription?.plan === "pro"} />,
    abonnement: (
      <SubscriptionSection subscription={subscription} patientCount={patientCount} />
    ),
    export: <ExportSection />,
    securite: <SecuritySection />,
  };

  return (
    <div className="flex min-h-screen bg-[#F7F5F0]">
      {/* ── Nav gauche (desktop) ─────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 sticky top-14 self-start bg-white border-r border-border h-[calc(100vh-3.5rem)]">
        <div className="px-5 py-6 border-b border-border">
          <h1 className="font-serif text-xl text-ink">Paramètres</h1>
          <p className="text-xs text-ink/40 mt-0.5">Gérez votre compte</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-teal-50 text-teal-600"
                    : "text-ink/50 hover:text-ink hover:bg-teal-50/60"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-teal-400 rounded-full -ml-3" />
                )}
                <Icon size={16} className={active ? "text-teal-500" : ""} />
                {label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Tabs mobile ──────────────────────────────────────────────── */}
      <div className="md:hidden fixed top-14 left-0 right-0 z-20 bg-white border-b border-border overflow-x-auto">
        <div className="flex px-4 gap-0 min-w-max">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? "border-teal-400 text-teal-600"
                    : "border-transparent text-ink/50 hover:text-ink"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Contenu ──────────────────────────────────────────────────── */}
      <main className="flex-1 px-6 py-8 md:py-10 mt-10 md:mt-0 max-w-2xl">
        {sectionComponents[activeSection]}
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — PROFIL
// ══════════════════════════════════════════════════════════════════════════════

function ProfileSection({
  userId,
  email,
  profile,
}: {
  userId: string;
  email: string;
  profile: ProfileData;
}) {
  const { msg, pending, start, show } = useFeedback();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(profile.first_name ?? "");
  const [lastName, setLastName] = useState(profile.last_name ?? "");
  const [specialty, setSpecialty] = useState(profile.specialty ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [address, setAddress] = useState(profile.address ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [postalCode, setPostalCode] = useState(profile.postal_code ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const initials = [firstName[0], lastName[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || email[0].toUpperCase();

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      show("Fichier trop grand (max 2 MB)", "err");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      show("Format accepté : JPG, PNG, WebP", "err");
      return;
    }
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      show("Erreur lors de l'upload.", "err");
      setUploadingAvatar(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(publicUrl);
    const res = await saveAvatarUrl(publicUrl);
    if (res?.error) show(res.error, "err");
    else show("Photo mise à jour", "ok");
    setUploadingAvatar(false);
  }

  function handleSave() {
    start(async () => {
      const res = await saveProfileInfo({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        specialty: specialty || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        postal_code: postalCode.trim() || null,
      });
      if (res?.error) show(res.error, "err");
      else show("Profil mis à jour", "ok");
    });
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Profil" desc="Vos informations personnelles et votre cabinet" />

      {/* Photo de profil */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="text-sm font-semibold text-ink mb-4">Photo de profil</h3>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-teal-400 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <Loader2 size={20} className="text-white animate-spin" />
              </div>
            )}
          </div>
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-ink/70 hover:text-ink hover:border-teal-400 transition-colors disabled:opacity-50"
            >
              <Camera size={14} />
              Changer la photo
            </button>
            <p className="text-xs text-ink/35 mt-1.5">JPG, PNG, WebP — max 2 MB</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      {/* Informations */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="text-sm font-semibold text-ink mb-5">Informations personnelles</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Prénom</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Marie"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Nom</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dupont"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Spécialité</label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className={inputCls}
            >
              {SPECIALTY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Email{" "}
              <span className="text-ink/30 font-normal">
                — Pour le modifier, contactez le support
              </span>
            </label>
            <input
              value={email}
              disabled
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-ink/[0.03] text-ink/40 text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Téléphone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78"
              type="tel"
              className={inputCls}
            />
          </div>
        </div>

        <Divider />

        <h3 className="text-sm font-semibold text-ink mb-4">Cabinet</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Adresse</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="12 rue des Lilas"
              rows={2}
              className={inputCls + " resize-none"}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Ville</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Paris"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Code postal</label>
              <input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="75001"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {msg && <div className="mt-4"><InlineFeedback msg={msg} /></div>}
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSave}
            disabled={pending}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-400 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {pending && <Loader2 size={14} className="animate-spin" />}
            {pending ? "Enregistrement…" : "Sauvegarder"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — AGENDA
// ══════════════════════════════════════════════════════════════════════════════

function AgendaSection({
  userId,
  profile,
  availability,
}: {
  userId: string;
  profile: ProfileData;
  availability: AvailabilityData | null;
}) {
  const { msg: availMsg, pending: availPending, start: availStart, show: availShow } = useFeedback();
  const { msg: slugMsg, pending: slugPending, start: slugStart, show: slugShow } = useFeedback();
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

  // Availability state
  const def = availability ?? {
    days: [1, 2, 3, 4, 5],
    startTime: "09:00",
    endTime: "18:00",
    sessionDuration: 60,
    lunchBreakEnabled: false,
    lunchStart: "12:00",
    lunchEnd: "14:00",
    defaultPrice: 60,
  };
  const [days, setDays] = useState<number[]>(def.days);
  const [startTime, setStartTime] = useState(def.startTime);
  const [endTime, setEndTime] = useState(def.endTime);
  const [duration, setDuration] = useState(def.sessionDuration);
  const [lunchEnabled, setLunchEnabled] = useState(def.lunchBreakEnabled);
  const [lunchStart, setLunchStart] = useState(def.lunchStart);
  const [lunchEnd, setLunchEnd] = useState(def.lunchEnd);
  const [price, setPrice] = useState(def.defaultPrice);

  // Slug state
  const [slug, setSlug] = useState(profile.slug ?? "");
  const bookingUrl = slug ? `${appUrl}/book/${slug}` : "";

  // Generate QR code
  useEffect(() => {
    if (!bookingUrl) { setQrDataUrl(null); return; }
    let cancelled = false;
    import("qrcode").then((mod) => {
      mod.default
        .toDataURL(bookingUrl, {
          width: 200,
          margin: 2,
          color: { dark: "#0D1F1A", light: "#FFFFFF" },
        })
        .then((url: string) => { if (!cancelled) setQrDataUrl(url); });
    });
    return () => { cancelled = true; };
  }, [bookingUrl]);

  // Avoid unused variable warning
  void userId;

  function toggleDay(d: number) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  function handleSaveAvail() {
    availStart(async () => {
      const res = await saveAvailabilitySettings({
        days,
        startTime,
        endTime,
        sessionDuration: duration,
        lunchBreakEnabled: lunchEnabled,
        lunchStart,
        lunchEnd,
        defaultPrice: price,
      });
      if (res?.error) availShow(res.error, "err");
      else availShow("Disponibilités sauvegardées", "ok");
    });
  }

  function handleSaveSlug() {
    if (!slug) return;
    slugStart(async () => {
      const res = await saveSlug(slug);
      if (res?.error) slugShow(res.error, "err");
      else slugShow("Lien mis à jour", "ok");
    });
  }

  function handleCopy() {
    if (!bookingUrl) return;
    navigator.clipboard.writeText(bookingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownloadQR() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "qrcode-rdv.png";
    a.click();
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Agenda" desc="Vos horaires de consultation et votre lien de réservation" />

      {/* Horaires */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="text-sm font-semibold text-ink mb-5">Horaires de consultation</h3>

        {/* Jours actifs */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-ink mb-3">Jours actifs</label>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map(({ key, label }) => {
              const active = days.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDay(key)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    active
                      ? "bg-teal-400 text-white border-teal-400"
                      : "border-border text-ink/60 hover:border-teal-400"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Plage horaire */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-ink mb-3">Plage horaire</label>
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={inputCls + " w-auto"}
            />
            <span className="text-ink/40 text-sm">→</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={inputCls + " w-auto"}
            />
          </div>
        </div>

        {/* Durée séance */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-ink mb-3">Durée par défaut d&apos;une séance</label>
          <div className="flex gap-2 flex-wrap">
            {DURATIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setDuration(value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  duration === value
                    ? "bg-teal-400 text-white border-teal-400"
                    : "border-border text-ink/60 hover:border-teal-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Prix par défaut */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-ink mb-1.5">Prix par défaut (€)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={price}
              min={0}
              onChange={(e) => setPrice(Number(e.target.value))}
              className={inputCls + " w-32"}
            />
            <span className="text-sm text-ink/40">€ / séance</span>
          </div>
        </div>

        {/* Pause déjeuner */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-ink">Pause déjeuner</p>
              <p className="text-xs text-ink/40">Bloquer un créneau le midi</p>
            </div>
            <Toggle checked={lunchEnabled} onChange={setLunchEnabled} />
          </div>
          {lunchEnabled && (
            <div className="flex items-center gap-3 mt-2">
              <input
                type="time"
                value={lunchStart}
                onChange={(e) => setLunchStart(e.target.value)}
                className={inputCls + " w-auto"}
              />
              <span className="text-ink/40 text-sm">→</span>
              <input
                type="time"
                value={lunchEnd}
                onChange={(e) => setLunchEnd(e.target.value)}
                className={inputCls + " w-auto"}
              />
            </div>
          )}
        </div>

        {availMsg && <div className="mt-4"><InlineFeedback msg={availMsg} /></div>}
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSaveAvail}
            disabled={availPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-400 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {availPending && <Loader2 size={14} className="animate-spin" />}
            {availPending ? "Enregistrement…" : "Sauvegarder les horaires"}
          </button>
        </div>
      </div>

      {/* Lien de réservation */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="text-sm font-semibold text-ink mb-5">Lien de réservation</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-ink mb-1.5">Votre identifiant unique (slug)</label>
          <div className="flex items-center gap-2">
            <input
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="marie-dupont"
              className={inputCls + " flex-1"}
            />
            <button
              onClick={handleSaveSlug}
              disabled={slugPending || !slug}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-400 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {slugPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {slugPending ? "…" : "OK"}
            </button>
          </div>
          {slugMsg && <div className="mt-2"><InlineFeedback msg={slugMsg} /></div>}
        </div>

        {bookingUrl && (
          <>
            <div className="flex items-center gap-2 p-3 bg-ink/[0.03] rounded-xl border border-border mb-4">
              <span className="flex-1 text-sm text-ink/70 truncate font-mono">{bookingUrl}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors"
              >
                {copied ? <Check size={12} className="text-teal-500" /> : <Copy size={12} />}
                {copied ? "Copié" : "Copier"}
              </button>
              <a
                href={bookingUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors"
              >
                <ExternalLink size={12} />
                Voir
              </a>
            </div>

            {/* QR Code */}
            {qrDataUrl && (
              <div className="flex items-start gap-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="QR Code de réservation"
                  className="w-[100px] h-[100px] rounded-xl border border-border"
                />
                <div>
                  <p className="text-sm font-medium text-ink mb-1">QR Code</p>
                  <p className="text-xs text-ink/40 mb-3 leading-relaxed">
                    Partagez ce QR code sur vos supports de communication pour que vos patients réservent directement.
                  </p>
                  <button
                    onClick={handleDownloadQR}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-medium text-ink/60 hover:text-ink hover:border-teal-400 transition-colors"
                  >
                    <Download size={13} />
                    Télécharger le QR Code
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════

function NotificationsSection({
  profile,
  isPro,
}: {
  profile: ProfileData;
  isPro: boolean;
}) {
  const { msg, pending, start, show } = useFeedback();

  const [notifNewBooking, setNotifNewBooking] = useState(profile.notif_new_booking);
  const [notifReminder, setNotifReminder] = useState(profile.notif_reminder);
  const [notifInvoice, setNotifInvoice] = useState(profile.notif_invoice);
  const [notifWeeklyRecap, setNotifWeeklyRecap] = useState(profile.notif_weekly_recap);
  const [recapDay, setRecapDay] = useState(profile.recap_day);
  const [smsEnabled, setSmsEnabled] = useState(profile.sms_reminders_enabled);
  const [smsDelay, setSmsDelay] = useState(profile.sms_reminder_delay);

  const smsPreview = `Bonjour [Prénom], rappel de votre RDV avec [Thérapeute] ${
    smsDelay === 1 ? "dans 1 heure" : smsDelay === 24 ? "demain" : "dans 2 jours"
  } à [heure].\nPour annuler : [lien]\n- Theraflow`;
  const smsCharCount = smsPreview.replace(/\[.*?\]/g, "XXXX").length;

  function handleSave() {
    start(async () => {
      const res = await saveNotificationSettings({
        notifNewBooking,
        notifReminder,
        notifInvoice,
        notifWeeklyRecap,
        recapDay,
        smsEnabled,
        smsDelay,
      });
      if (res?.error) show(res.error, "err");
      else show("Préférences enregistrées", "ok");
    });
  }

  function NotifRow({
    label,
    desc,
    checked,
    onChange,
  }: {
    label: string;
    desc: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) {
    return (
      <div className="flex items-center justify-between py-3">
        <div>
          <p className="text-sm font-medium text-ink">{label}</p>
          <p className="text-xs text-ink/40 mt-0.5">{desc}</p>
        </div>
        <Toggle checked={checked} onChange={onChange} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Notifications"
        desc="Choisissez comment et quand être alerté"
      />

      {/* Email */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="text-sm font-semibold text-ink mb-1">Notifications email</h3>
        <p className="text-xs text-ink/40 mb-4">Reçues sur votre adresse email principale</p>

        <div className="divide-y divide-border">
          <NotifRow
            label="Nouvelle réservation"
            desc="Quand un patient réserve via votre lien public"
            checked={notifNewBooking}
            onChange={setNotifNewBooking}
          />
          <NotifRow
            label="Rappel avant RDV"
            desc="La veille de chaque rendez-vous"
            checked={notifReminder}
            onChange={setNotifReminder}
          />
          <NotifRow
            label="Facture vue par le patient"
            desc="Lorsqu'un patient ouvre une facture envoyée"
            checked={notifInvoice}
            onChange={setNotifInvoice}
          />
          <div>
            <NotifRow
              label="Récapitulatif hebdomadaire"
              desc="Bilan de la semaine : RDV, revenus, patients"
              checked={notifWeeklyRecap}
              onChange={setNotifWeeklyRecap}
            />
            {notifWeeklyRecap && (
              <div className="pb-3 flex items-center gap-3">
                <span className="text-xs text-ink/50">Envoyé le</span>
                <select
                  value={recapDay}
                  onChange={(e) => setRecapDay(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl border border-border bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400"
                >
                  {RECAP_DAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SMS */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-ink">Rappels SMS patients</h3>
            <p className="text-xs text-ink/40 mt-0.5">Un SMS automatique envoyé à vos patients</p>
          </div>
          {!isPro && (
            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
              Pro uniquement
            </span>
          )}
        </div>

        {!isPro ? (
          <p className="text-sm text-ink/50">
            Passez en plan Pro pour activer les rappels SMS automatiques.
          </p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Activer les rappels</p>
                <p className="text-xs text-ink/40 mt-0.5">Envoie un SMS avant chaque RDV confirmé</p>
              </div>
              <Toggle checked={smsEnabled} onChange={setSmsEnabled} />
            </div>

            {smsEnabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Délai avant le RDV</label>
                  <div className="flex gap-2">
                    {SMS_DELAYS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSmsDelay(value)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                          smsDelay === value
                            ? "bg-teal-400 text-white border-teal-400"
                            : "border-border text-ink/60 hover:border-teal-400"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prévisualisation bulle SMS */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-ink/50 uppercase tracking-wide">
                      Aperçu du message
                    </p>
                    <span
                      className={`text-xs font-medium ${
                        smsCharCount > 160 ? "text-red-500" : "text-ink/40"
                      }`}
                    >
                      {smsCharCount}/160 caractères
                    </span>
                  </div>
                  <div className="relative bg-ink/[0.03] rounded-2xl rounded-tl-sm px-4 py-3 border border-border">
                    <p className="text-sm text-ink/70 whitespace-pre-line leading-relaxed">
                      {smsPreview}
                    </p>
                    <div className="absolute -left-2 top-3 w-3 h-3 bg-ink/[0.03] border-l border-b border-border rotate-45" />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {msg && <InlineFeedback msg={msg} />}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={pending}
          className="flex items-center gap-2 px-6 py-2.5 bg-teal-400 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {pending && <Loader2 size={14} className="animate-spin" />}
          {pending ? "Enregistrement…" : "Sauvegarder les préférences"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — ABONNEMENT
// ══════════════════════════════════════════════════════════════════════════════

const PRO_FEATURES = [
  "Patients illimités",
  "Rappels SMS automatiques",
  "Génération de factures PDF",
  "Export des données",
  "Support prioritaire",
];

function SubscriptionSection({
  subscription,
  patientCount,
}: {
  subscription: SubscriptionData | null;
  patientCount: number;
}) {
  const isPro = subscription?.plan === "pro";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const renewalDate = subscription?.current_period_end
    ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(
        new Date(subscription.current_period_end)
      )
    : null;

  async function goToPortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error ?? "Impossible d'accéder au portail.");
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  async function goToCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error ?? "Erreur lors du paiement.");
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Abonnement" desc="Gérez votre plan et votre facturation" />

      {error && <InlineFeedback msg={{ text: error, type: "err" }} />}

      {isPro ? (
        // ── Plan Pro actif ───────────────────────────────────────────────────
        <>
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-ink">Votre plan</h3>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-50 text-teal-600 border border-teal-200">
                Pro actif
              </span>
            </div>

            <div className="flex items-center gap-4 p-4 bg-teal-50 rounded-xl border border-teal-100 mb-5">
              <div className="w-10 h-10 rounded-full bg-teal-400/20 flex items-center justify-center shrink-0">
                <Check size={18} className="text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-teal-700">Theraflow Pro</p>
                {renewalDate && (
                  <p className="text-xs text-teal-600/70 mt-0.5">Renouvellement le {renewalDate}</p>
                )}
              </div>
              <p className="ml-auto text-lg font-bold text-teal-600">39€<span className="text-xs font-normal text-teal-600/60">/mois</span></p>
            </div>

            <div className="space-y-1">
              <button
                onClick={goToPortal}
                disabled={loading}
                className="w-full py-2.5 rounded-xl border border-border text-sm font-medium text-ink/60 hover:text-ink hover:bg-ink/5 disabled:opacity-50 transition-colors"
              >
                {loading ? "Chargement…" : "Gérer mon abonnement →"}
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                Annuler mon abonnement
              </button>
            </div>
          </div>

          {/* Modal annulation */}
          {showCancelModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                <h3 className="font-semibold text-ink mb-2">Annuler votre abonnement Pro ?</h3>
                <p className="text-sm text-ink/60 mb-5">
                  Vous serez redirigé vers le portail Stripe pour annuler. Vous gardez l&apos;accès Pro jusqu&apos;à la fin de la période en cours.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-ink/60 hover:text-ink"
                  >
                    Retour
                  </button>
                  <button
                    onClick={goToPortal}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600"
                  >
                    Annuler via Stripe
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        // ── Plan Gratuit ─────────────────────────────────────────────────────
        <>
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-ink">Votre plan</h3>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-ink/5 text-ink/50 border border-border">
                Gratuit
              </span>
            </div>

            {/* Limites */}
            <div className="space-y-3 mb-5">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-ink/60">Patients</span>
                  <span className="font-medium text-ink">
                    {patientCount} / 3 utilisés
                  </span>
                </div>
                <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-400 rounded-full transition-all"
                    style={{ width: `${Math.min((patientCount / 3) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-border">
                <span className="text-ink/60">Rappels SMS</span>
                <span className="text-red-400 font-medium">Non disponible</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2">
                <span className="text-ink/60">Factures PDF</span>
                <span className="text-red-400 font-medium">Non disponible</span>
              </div>
            </div>
          </div>

          {/* Upgrade card */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="font-semibold text-ink mb-1">Theraflow Pro</p>
                <p className="text-2xl font-bold text-teal-400">
                  39€<span className="text-sm font-normal text-ink/40"> / mois</span>
                </p>
                <p className="text-xs text-ink/40 mt-1">14 jours d&apos;essai gratuit · sans carte bancaire</p>
              </div>
              <span className="text-3xl">✨</span>
            </div>

            <ul className="space-y-2 mb-6">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-ink/70">
                  <Check size={14} className="text-teal-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={goToCheckout}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-teal-400 hover:bg-teal-600 disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Redirection…" : "Passer en Pro — 39€/mois"}
            </button>
            <p className="text-xs text-ink/30 text-center mt-3">
              Paiement sécurisé par Stripe · Annulation à tout moment
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — EXPORT
// ══════════════════════════════════════════════════════════════════════════════

function ExportSection() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loadingPat, setLoadingPat] = useState(false);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loadingInv, setLoadingInv] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download(url: string, setLoading: (v: boolean) => void) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur serveur");
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      const cd = res.headers.get("content-disposition") ?? "";
      const match = cd.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? "export";
      a.click();
      URL.revokeObjectURL(href);
    } catch {
      setError("Erreur lors du téléchargement.");
    } finally {
      setLoading(false);
    }
  }

  type ExportCardProps = {
    icon: React.ReactNode;
    title: string;
    desc: string;
    action: React.ReactNode;
  };

  function ExportCard({ icon, title, desc, action }: ExportCardProps) {
    return (
      <div className="bg-white rounded-2xl border border-border p-6 flex flex-col gap-4">
        <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="font-semibold text-ink text-sm">{title}</p>
          <p className="text-xs text-ink/50 mt-1 leading-relaxed">{desc}</p>
        </div>
        {action}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Export de données" desc="Téléchargez vos données dans les formats de votre choix" />

      {error && <InlineFeedback msg={{ text: error, type: "err" }} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ExportCard
          icon={<Users size={18} className="text-teal-600" />}
          title="Patients"
          desc="Liste complète de vos patients avec leur historique de séances"
          action={
            <button
              onClick={() => download("/api/export/patients", setLoadingPat)}
              disabled={loadingPat}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-teal-400 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {loadingPat ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {loadingPat ? "…" : "Exporter CSV"}
            </button>
          }
        />

        <ExportCard
          icon={<FileText size={18} className="text-purple-600" />}
          title="Récap mensuel"
          desc="Bilan mensuel complet pour votre comptable"
          action={
            <div className="space-y-2">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400"
              />
              <button
                onClick={() =>
                  download(`/api/export/monthly?month=${selectedMonth}`, setLoadingMonthly)
                }
                disabled={loadingMonthly}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-teal-400 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-medium transition-colors"
              >
                {loadingMonthly ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {loadingMonthly ? "…" : "Générer PDF"}
              </button>
            </div>
          }
        />

        <ExportCard
          icon={<Receipt size={18} className="text-green-600" />}
          title="Factures"
          desc="Toutes vos factures avec statut de paiement"
          action={
            <button
              onClick={() => download("/api/export/invoices", setLoadingInv)}
              disabled={loadingInv}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-teal-400 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {loadingInv ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {loadingInv ? "…" : "Exporter CSV"}
            </button>
          }
        />
      </div>

      {/* RGPD */}
      <div className="flex items-start gap-3 px-5 py-4 bg-white rounded-2xl border border-border">
        <Shield size={16} className="text-teal-500 shrink-0 mt-0.5" />
        <p className="text-xs text-ink/50 leading-relaxed">
          <span className="font-semibold text-ink/70">Vos données vous appartiennent.</span>{" "}
          Vous pouvez les exporter ou les supprimer à tout moment conformément au RGPD (Règlement Général sur la Protection des Données).
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — SÉCURITÉ
// ══════════════════════════════════════════════════════════════════════════════

function SecuritySection() {
  const router = useRouter();
  const { msg: pwMsg, pending: pwPending, start: pwStart, show: pwShow } = useFeedback();
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = passwordStrength(newPwd);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletePending, startDelete] = useTransition();

  function handlePasswordChange() {
    if (!newPwd) return;
    if (newPwd !== confirmPwd) {
      pwShow("Les mots de passe ne correspondent pas.", "err");
      return;
    }
    if (newPwd.length < 8) {
      pwShow("Minimum 8 caractères.", "err");
      return;
    }
    pwStart(async () => {
      const res = await changePassword(newPwd);
      if (res?.error) pwShow(res.error, "err");
      else {
        pwShow("Mot de passe mis à jour", "ok");
        setNewPwd("");
        setConfirmPwd("");
      }
    });
  }

  async function handleSignOutAll() {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    router.push("/login");
  }

  function handleDeleteAccount() {
    startDelete(async () => {
      const res = await deleteAccount();
      if (res?.error) {
        alert(res.error);
        setDeleteModal(false);
      }
    });
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Sécurité" desc="Mot de passe, sessions et suppression du compte" />

      {/* Mot de passe */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="text-sm font-semibold text-ink mb-5">Changer le mot de passe</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="Minimum 8 caractères"
                className={inputCls + " pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink transition-colors"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Indicateur de force */}
            {newPwd.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        i <= strength ? STRENGTH_COLORS[strength] : "bg-ink/10"
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${STRENGTH_COLORS[strength].replace("bg-", "text-")}`}>
                  {STRENGTH_LABELS[strength]}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Confirmer le mot de passe</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="Répétez le mot de passe"
                className={inputCls + " pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink transition-colors"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPwd.length > 0 && newPwd !== confirmPwd && (
              <p className="text-xs text-red-400 mt-1">Les mots de passe ne correspondent pas</p>
            )}
          </div>
        </div>

        {pwMsg && <div className="mt-4"><InlineFeedback msg={pwMsg} /></div>}
        <div className="mt-5 flex justify-end">
          <button
            onClick={handlePasswordChange}
            disabled={pwPending || !newPwd || newPwd !== confirmPwd}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-400 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {pwPending && <Loader2 size={14} className="animate-spin" />}
            {pwPending ? "Mise à jour…" : "Mettre à jour"}
          </button>
        </div>
      </div>

      {/* Sessions */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="text-sm font-semibold text-ink mb-4">Sessions actives</h3>
        <div className="flex items-center justify-between p-4 bg-ink/[0.02] rounded-xl border border-border mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
              <Shield size={14} className="text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Session actuelle</p>
              <p className="text-xs text-ink/40">Ce navigateur · Connecté maintenant</p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-teal-400" />
        </div>
        <button
          onClick={handleSignOutAll}
          className="w-full py-2.5 rounded-xl border border-border text-sm font-medium text-ink/60 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
        >
          Se déconnecter de tous les appareils
        </button>
      </div>

      {/* Zone danger */}
      <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} className="text-red-500" />
          <h3 className="text-sm font-semibold text-red-700">Zone de danger</h3>
        </div>
        <p className="text-sm text-red-600/70 mb-5 leading-relaxed">
          La suppression de votre compte est définitive et irréversible.
          Toutes vos données (patients, rendez-vous, factures) seront supprimées.
        </p>
        <button
          onClick={() => setDeleteModal(true)}
          className="px-5 py-2.5 rounded-xl border border-red-300 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
        >
          Supprimer mon compte
        </button>
      </div>

      {/* Modal confirmation suppression */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <h3 className="font-semibold text-ink">Supprimer définitivement ?</h3>
            </div>
            <p className="text-sm text-ink/60 mb-5 leading-relaxed">
              Cette action est <strong className="text-ink">irréversible</strong>. Toutes vos données seront définitivement effacées.
            </p>
            <p className="text-sm font-medium text-ink mb-2">Tapez <strong>SUPPRIMER</strong> pour confirmer :</p>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="SUPPRIMER"
              className={inputCls + " mb-5 font-mono"}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteModal(false); setDeleteConfirm(""); }}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-ink/60 hover:text-ink"
              >
                Annuler
              </button>
              <button
                disabled={deleteConfirm !== "SUPPRIMER" || deletePending}
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {deletePending && <Loader2 size={14} className="animate-spin" />}
                {deletePending ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
