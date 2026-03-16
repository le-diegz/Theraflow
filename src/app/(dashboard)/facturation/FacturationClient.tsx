"use client";

import {
  useState,
  useTransition,
  useActionState,
  useEffect,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  createInvoice,
  markAsPaid,
  markAsSent,
  deleteInvoice,
  type InvoiceActionState,
} from "./actions";
import type { PdfInvoice, PdfPatient, PdfTherapist } from "./pdfGenerator";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InvoiceRow = {
  id: string;
  invoice_number: string;
  amount: number;
  status: "draft" | "sent" | "paid";
  issued_at: string;
  paid_at: string | null;
  patient_id: string;
  appointment_id: string | null;
  patient_name: string;
};

export type PatientOption = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
};

export type AppointmentOption = {
  id: string;
  patient_id: string;
  start_time: string;
  price: number | null;
};

export type TherapistInfo = {
  full_name: string | null;
  specialty: string | null;
  email: string;
  phone: string | null;
};

// ─── Constantes UI ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  draft: {
    label: "Brouillon",
    className: "bg-amber-50 text-amber-600 border-amber-200",
  },
  sent: {
    label: "Envoyée",
    className: "bg-blue-50 text-blue-600 border-blue-200",
  },
  paid: {
    label: "Payée",
    className: "bg-teal-50 text-teal-600 border-teal-200",
  },
} as const;

type FilterType = "all" | "draft" | "sent" | "paid";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEuros(centimes: number | null) {
  if (!centimes) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(centimes / 100);
}

function formatDateFr(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

// ─── Modal Nouvelle Facture ───────────────────────────────────────────────────

interface NewInvoiceModalProps {
  patients: PatientOption[];
  appointments: AppointmentOption[];
  onClose: () => void;
}

function NewInvoiceModal({ patients, appointments, onClose }: NewInvoiceModalProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState<InvoiceActionState, FormData>(
    createInvoice,
    null
  );

  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (state?.success) { router.refresh(); onCloseRef.current(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  const [patientId, setPatientId] = useState("");
  const [apptId, setApptId] = useState("");
  const [amount, setAmount] = useState("60");

  const today = format(new Date(), "yyyy-MM-dd");

  // Filtrer les RDV selon le patient sélectionné
  const patientAppts = patientId
    ? appointments.filter((a) => a.patient_id === patientId)
    : appointments;

  // Pré-remplir le montant quand un RDV est sélectionné
  function handleApptChange(id: string) {
    setApptId(id);
    if (id) {
      const appt = appointments.find((a) => a.id === id);
      if (appt?.price) setAmount(String(appt.price / 100));
    }
  }

  function handlePatientChange(id: string) {
    setPatientId(id);
    setApptId(""); // reset appt when patient changes
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-border w-full max-w-md p-6 z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-ink">Nouvelle facture</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-ink/40 hover:text-ink transition-colors rounded-lg hover:bg-ink/5"
          >
            <XIcon />
          </button>
        </div>

        {patients.length === 0 && (
          <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            Aucun patient.{" "}
            <a href="/patients" className="underline font-medium">Créer un patient →</a>
          </div>
        )}

        {state?.error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-4">
          {/* Patient */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Patient <span className="text-red-400">*</span>
            </label>
            <select
              name="patient_id"
              required
              value={patientId}
              onChange={(e) => handlePatientChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink text-sm transition"
            >
              <option value="">Choisir un patient…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.last_name} {p.first_name}
                </option>
              ))}
            </select>
          </div>

          {/* Séance liée (optionnel) */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Séance liée{" "}
              <span className="text-ink/30 font-normal">(optionnel)</span>
            </label>
            <select
              name="appointment_id"
              value={apptId}
              onChange={(e) => handleApptChange(e.target.value)}
              disabled={!patientId}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink text-sm transition disabled:opacity-40"
            >
              <option value="">Aucune séance liée</option>
              {patientAppts.map((a) => (
                <option key={a.id} value={a.id}>
                  {formatDateFr(a.start_time)}
                  {a.price ? ` — ${formatEuros(a.price)}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Montant + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Montant (€) <span className="text-red-400">*</span>
              </label>
              <input
                name="amount"
                type="number"
                min="0.5"
                step="0.5"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink text-sm transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Date d'émission
              </label>
              <input
                name="issued_at"
                type="date"
                defaultValue={today}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 text-ink text-sm transition"
              />
            </div>
          </div>

          {/* Actions */}
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
              disabled={pending || patients.length === 0}
              className="flex-1 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {pending && <SpinnerIcon />}
              {pending ? "Création…" : "Créer la facture"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

interface FacturationClientProps {
  invoices: InvoiceRow[];
  patients: PatientOption[];
  appointments: AppointmentOption[];
  therapist: TherapistInfo;
}

export function FacturationClient({
  invoices,
  patients,
  appointments,
  therapist,
}: FacturationClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("all");
  const [showModal, setShowModal] = useState(false);
  const [pendingId, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Métriques ───────────────────────────────────────────
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const totalPaidThisMonth = invoices
    .filter(
      (inv) =>
        inv.status === "paid" &&
        inv.paid_at &&
        new Date(inv.paid_at).getMonth() === currentMonth &&
        new Date(inv.paid_at).getFullYear() === currentYear
    )
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingAmount = invoices
    .filter((inv) => inv.status !== "paid")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const paidCount = invoices.filter((inv) => inv.status === "paid").length;
  const recoveryRate =
    invoices.length > 0 ? Math.round((paidCount / invoices.length) * 100) : 0;

  // ── Filtrage ────────────────────────────────────────────
  const filtered = invoices.filter(
    (inv) => filter === "all" || inv.status === filter
  );

  // ── Actions ─────────────────────────────────────────────
  function handleMarkPaid(invoiceId: string) {
    setActionError(null);
    startTransition(async () => {
      const result = await markAsPaid(invoiceId);
      if (result?.error) setActionError(result.error);
      else router.refresh();
    });
  }

  function handleMarkSent(invoiceId: string) {
    setActionError(null);
    startTransition(async () => {
      const result = await markAsSent(invoiceId);
      if (result?.error) setActionError(result.error);
      else router.refresh();
    });
  }

  function handleDelete(invoiceId: string) {
    if (!confirm("Supprimer cette facture ? Cette action est irréversible.")) return;
    setActionError(null);
    startTransition(async () => {
      const result = await deleteInvoice(invoiceId);
      if (result?.error) setActionError(result.error);
      else router.refresh();
    });
  }

  async function handleDownloadPDF(inv: InvoiceRow) {
    const patient = patients.find((p) => p.id === inv.patient_id);
    if (!patient) return;

    const { generateInvoicePDF } = await import("./pdfGenerator");

    const pdfInvoice: PdfInvoice = {
      invoice_number: inv.invoice_number,
      issued_at: inv.issued_at,
      paid_at: inv.paid_at,
      amount: inv.amount,
      status: inv.status,
    };
    const pdfPatient: PdfPatient = {
      first_name: patient.first_name,
      last_name: patient.last_name,
      email: patient.email,
    };
    const pdfTherapist: PdfTherapist = { ...therapist };

    generateInvoicePDF(pdfInvoice, pdfPatient, pdfTherapist);
  }

  const filterCounts: Record<FilterType, number> = {
    all: invoices.length,
    draft: invoices.filter((i) => i.status === "draft").length,
    sent: invoices.filter((i) => i.status === "sent").length,
    paid: invoices.filter((i) => i.status === "paid").length,
  };

  return (
    <>
      {showModal && (
        <NewInvoiceModal
          patients={patients}
          appointments={appointments}
          onClose={() => setShowModal(false)}
        />
      )}

      <div className="px-6 py-8 max-w-6xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-ink">Facturation</h1>
            <p className="text-ink/50 text-sm mt-0.5">
              {invoices.length} facture{invoices.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-400 hover:bg-teal-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <PlusIcon />
            Nouvelle facture
          </button>
        </div>

        {/* Métriques */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            label="Encaissé ce mois"
            value={totalPaidThisMonth > 0 ? formatEuros(totalPaidThisMonth) : "—"}
            color="teal"
          />
          <MetricCard
            label="En attente"
            value={pendingAmount > 0 ? formatEuros(pendingAmount) : "—"}
            color="amber"
          />
          <MetricCard
            label="Taux de recouvrement"
            value={invoices.length > 0 ? `${recoveryRate} %` : "—"}
            color="ink"
          />
        </div>

        {/* Erreur globale */}
        {actionError && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
            {actionError}
            <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600">
              <XIcon size={14} />
            </button>
          </div>
        )}

        {/* Filtres */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "draft", "sent", "paid"] as FilterType[]).map((f) => {
            const labels: Record<FilterType, string> = {
              all: "Toutes",
              draft: "Brouillon",
              sent: "Envoyées",
              paid: "Payées",
            };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  filter === f
                    ? "bg-teal-400 text-white"
                    : "bg-white border border-border text-ink/60 hover:text-ink hover:bg-teal-50"
                }`}
              >
                {labels[f]}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    filter === f
                      ? "bg-white/20 text-white"
                      : "bg-ink/5 text-ink/40"
                  }`}
                >
                  {filterCounts[f]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tableau */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border px-6 py-16 text-center">
            <p className="text-ink/40 text-sm">
              {filter === "all"
                ? "Aucune facture pour le moment."
                : `Aucune facture avec le statut « ${STATUS_CONFIG[filter as keyof typeof STATUS_CONFIG]?.label} ».`}
            </p>
            {filter === "all" && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-3 text-sm text-teal-400 hover:text-teal-600 font-medium"
              >
                Créer votre première facture →
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="hidden md:grid grid-cols-[1.2fr_2fr_1.2fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-border bg-cream/50">
              {["Numéro", "Patient", "Date", "Montant", "Statut", ""].map((h) => (
                <span
                  key={h}
                  className="text-xs font-medium text-ink/50 uppercase tracking-wide"
                >
                  {h}
                </span>
              ))}
            </div>

            <ul className="divide-y divide-border">
              {filtered.map((inv) => {
                const st = STATUS_CONFIG[inv.status];
                return (
                  <li
                    key={inv.id}
                    className="grid grid-cols-1 md:grid-cols-[1.2fr_2fr_1.2fr_1fr_1fr_auto] gap-2 md:gap-4 px-6 py-4 items-center hover:bg-ink/[0.015] transition-colors"
                  >
                    {/* Numéro */}
                    <span className="text-sm font-mono font-medium text-ink">
                      {inv.invoice_number}
                    </span>

                    {/* Patient */}
                    <span className="text-sm text-ink/80 truncate">
                      {inv.patient_name}
                    </span>

                    {/* Date */}
                    <span className="text-sm text-ink/50">
                      {formatDateFr(inv.issued_at)}
                    </span>

                    {/* Montant */}
                    <span className="text-sm font-medium text-ink">
                      {formatEuros(inv.amount)}
                    </span>

                    {/* Statut */}
                    <span
                      className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border w-fit ${st.className}`}
                    >
                      {st.label}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {/* Télécharger PDF */}
                      <ActionBtn
                        title="Télécharger PDF"
                        onClick={() => handleDownloadPDF(inv)}
                      >
                        <DownloadIcon />
                      </ActionBtn>

                      {/* Marquer envoyée */}
                      {inv.status === "draft" && (
                        <ActionBtn
                          title="Marquer comme envoyée"
                          onClick={() => handleMarkSent(inv.id)}
                          disabled={pendingId}
                        >
                          <SendIcon />
                        </ActionBtn>
                      )}

                      {/* Marquer payée */}
                      {(inv.status === "draft" || inv.status === "sent") && (
                        <ActionBtn
                          title="Marquer comme payée"
                          onClick={() => handleMarkPaid(inv.id)}
                          disabled={pendingId}
                          className="hover:text-teal-600 hover:bg-teal-50"
                        >
                          <CheckIcon />
                        </ActionBtn>
                      )}

                      {/* Supprimer */}
                      {inv.status === "draft" && (
                        <ActionBtn
                          title="Supprimer"
                          onClick={() => handleDelete(inv.id)}
                          disabled={pendingId}
                          className="hover:text-red-500 hover:bg-red-50"
                        >
                          <TrashIcon />
                        </ActionBtn>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Composants utilitaires ───────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "teal" | "amber" | "ink";
}) {
  const colors = {
    teal: "text-teal-400",
    amber: "text-amber-500",
    ink: "text-ink",
  };
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <p className={`text-2xl font-semibold ${colors[color]}`}>{value}</p>
      <p className="text-xs text-ink/50 mt-1">{label}</p>
    </div>
  );
}

function ActionBtn({
  children,
  title,
  onClick,
  disabled,
  className = "hover:text-ink hover:bg-ink/5",
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={!!disabled}
      className={`p-1.5 rounded-lg text-ink/30 transition-colors disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
