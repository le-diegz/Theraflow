import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PdfInvoice {
  invoice_number: string;
  issued_at: string;
  paid_at: string | null;
  amount: number;
  status: string;
}

export interface PdfPatient {
  first_name: string;
  last_name: string;
  email: string | null;
}

export interface PdfTherapist {
  full_name: string | null;
  specialty: string | null;
  email: string;
  phone: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function euros(centimes: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(centimes / 100);
}

function dateFr(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

const TEAL: [number, number, number] = [29, 158, 117];
const INK: [number, number, number] = [13, 31, 26];
const GRAY: [number, number, number] = [110, 120, 117];
const LIGHT: [number, number, number] = [229, 231, 235];

const SPECIALTY: Record<string, string> = {
  psychologue: "Psychologue",
  osteopathe: "Ostéopathe",
  kinesitherapeute: "Kinésithérapeute",
  autre: "Thérapeute",
};

const SPECIALTY_SESSION: Record<string, string> = {
  psychologue: "psychologie",
  osteopathe: "ostéopathie",
  kinesitherapeute: "kinésithérapie",
  autre: "thérapie",
};

// ─── Générateur PDF ───────────────────────────────────────────────────────────

export function generateInvoicePDF(
  invoice: PdfInvoice,
  patient: PdfPatient,
  therapist: PdfTherapist
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const L = 20; // left margin
  const R = W - 20; // right margin

  // ── Bandeau teal en haut ─────────────────────────────────
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, W, 8, "F");

  // ── Logo / marque ────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...TEAL);
  doc.text("Theraflow", L, 22);

  // ── Infos thérapeute (gauche) ────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  let y = 30;
  if (therapist.full_name) {
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.text(therapist.full_name, L, y);
    doc.setFont("helvetica", "normal");
    y += 5;
  }
  if (therapist.specialty) {
    doc.setTextColor(...GRAY);
    doc.text(SPECIALTY[therapist.specialty] ?? therapist.specialty, L, y);
    y += 5;
  }
  doc.setTextColor(...GRAY);
  doc.text(therapist.email, L, y);
  y += 5;
  if (therapist.phone) {
    doc.text(therapist.phone, L, y);
  }

  // ── FACTURE + numéro (droite) ────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...INK);
  doc.text("FACTURE", R, 22, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`N°  ${invoice.invoice_number}`, R, 31, { align: "right" });
  doc.text(`Date : ${dateFr(invoice.issued_at)}`, R, 37, { align: "right" });

  if (invoice.status === "paid" && invoice.paid_at) {
    doc.setTextColor(...TEAL);
    doc.setFont("helvetica", "bold");
    doc.text(`Payée le ${dateFr(invoice.paid_at)}`, R, 43, { align: "right" });
    doc.setFont("helvetica", "normal");
  }

  // ── Séparateur ───────────────────────────────────────────
  doc.setDrawColor(...LIGHT);
  doc.setLineWidth(0.4);
  doc.line(L, 52, R, 52);

  // ── Facturé à ────────────────────────────────────────────
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GRAY);
  doc.text("FACTURÉ À", L, 62);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  doc.text(`${patient.first_name} ${patient.last_name}`, L, 69);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  if (patient.email) {
    doc.text(patient.email, L, 75);
  }

  // ── Tableau prestations ──────────────────────────────────
  const sessionLabel = therapist.specialty
    ? `Séance de ${SPECIALTY_SESSION[therapist.specialty] ?? "thérapie"}`
    : "Séance de thérapie";

  autoTable(doc, {
    startY: 84,
    head: [["Description", "Qté", "Prix unitaire", "Total"]],
    body: [[sessionLabel, "1", euros(invoice.amount), euros(invoice.amount)]],
    headStyles: {
      fillColor: TEAL,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: { top: 5, right: 6, bottom: 5, left: 6 },
    },
    bodyStyles: {
      fontSize: 9,
      textColor: INK,
      cellPadding: { top: 6, right: 6, bottom: 6, left: 6 },
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 18, halign: "center" },
      2: { cellWidth: 36, halign: "right" },
      3: { cellWidth: 36, halign: "right" },
    },
    margin: { left: L, right: W - R },
    styles: {
      lineColor: LIGHT,
      lineWidth: 0.2,
    },
    alternateRowStyles: { fillColor: [247, 245, 240] },
  });

  // ── Total ────────────────────────────────────────────────
  type JsPDFWithAutoTable = jsPDF & { lastAutoTable: { finalY: number } };
  const finalY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY;

  // Ligne sous le tableau
  doc.setDrawColor(...LIGHT);
  doc.setLineWidth(0.4);

  // Bloc total (aligné droite)
  const totalY = finalY + 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text("Sous-total HT", R - 40, totalY, { align: "right" });
  doc.text(euros(invoice.amount), R, totalY, { align: "right" });

  doc.text("TVA (0 %)", R - 40, totalY + 6, { align: "right" });
  doc.text("0,00 €", R, totalY + 6, { align: "right" });

  // Séparateur
  doc.line(R - 70, totalY + 9, R, totalY + 9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text("Total TTC", R - 40, totalY + 16, { align: "right" });
  doc.setTextColor(...TEAL);
  doc.text(euros(invoice.amount), R, totalY + 16, { align: "right" });

  // ── Pied de page ─────────────────────────────────────────
  doc.setFillColor(...TEAL);
  doc.rect(0, H - 5, W, 5, "F");

  doc.setDrawColor(...LIGHT);
  doc.setLineWidth(0.3);
  doc.line(L, H - 22, R, H - 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text(
    "Micro-entreprise — TVA non applicable, article 293 B du Code Général des Impôts",
    W / 2,
    H - 16,
    { align: "center" }
  );
  doc.text(
    `Theraflow · ${therapist.full_name ?? ""} · ${therapist.email}`,
    W / 2,
    H - 11,
    { align: "center" }
  );

  // ── Téléchargement ───────────────────────────────────────
  doc.save(`${invoice.invoice_number}.pdf`);
}
