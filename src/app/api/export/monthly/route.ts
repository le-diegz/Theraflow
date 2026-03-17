import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Query param ?month=2024-01
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month"); // "YYYY-MM"

  let startDate: Date;
  let endDate: Date;

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [year, month] = monthParam.split("-").map(Number);
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0, 23, 59, 59);
  } else {
    const now = new Date();
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }

  const monthLabel = startDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, specialty")
    .eq("id", user.id)
    .single();

  // Fetch appointments for the month
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      id, start_time, end_time, status, price,
      patients (first_name, last_name)
    `)
    .eq("therapist_id", user.id)
    .gte("start_time", startDate.toISOString())
    .lte("start_time", endDate.toISOString())
    .order("start_time", { ascending: true });

  const appts = appointments ?? [];
  const confirmed = appts.filter((a) => a.status !== "cancelled");
  const present = confirmed.filter((a) => a.status !== "no_show");
  const totalRevenue = present.reduce((s, a) => s + (a.price ?? 0), 0);
  const attendanceRate = confirmed.length > 0
    ? Math.round((present.length / confirmed.length) * 100)
    : 0;

  // Fetch patients created this month
  const { data: newPatients } = await supabase
    .from("patients")
    .select("id")
    .eq("therapist_id", user.id)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  // Per-patient summary
  const patientMap = new Map<
    string,
    { name: string; sessions: number; billed: number; paid: number }
  >();
  for (const a of appts) {
    const patient = Array.isArray(a.patients) ? a.patients[0] : a.patients;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const name = patient ? `${(patient as any).first_name} ${(patient as any).last_name}` : "—";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patientId = (a as any).patient_id ?? name;

    if (!patientMap.has(patientId)) {
      patientMap.set(patientId, { name, sessions: 0, billed: 0, paid: 0 });
    }
    const entry = patientMap.get(patientId)!;
    if (a.status !== "cancelled") {
      entry.sessions++;
      entry.billed += a.price ?? 0;
      if (a.status === "completed") entry.paid += a.price ?? 0;
    }
  }

  // Generate PDF using jsPDF
  // Dynamic import to avoid SSR issues
  const { jsPDF } = await import("jspdf");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const autoTable = require("jspdf-autotable").default;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const teal = [29, 158, 117] as [number, number, number];
  const ink = [13, 31, 26] as [number, number, number];

  // ── Page 1 : Résumé ─────────────────────────────────────────────────────
  doc.setFillColor(...teal);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Theraflow", 15, 13);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(profile?.full_name ?? "", 15, 22);

  doc.setTextColor(...ink);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`Récapitulatif — ${monthLabel}`, 15, 45);

  // Metric cards
  const metrics = [
    { label: "Séances réalisées", value: String(present.length) },
    { label: "Revenus", value: `${(totalRevenue / 100).toFixed(2)} €` },
    { label: "Nouveaux patients", value: String(newPatients?.length ?? 0) },
    { label: "Taux de présence", value: `${attendanceRate}%` },
  ];

  metrics.forEach((m, i) => {
    const x = 15 + (i % 2) * 95;
    const y = 55 + Math.floor(i / 2) * 28;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x, y, 88, 22, 3, 3, "F");
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...teal);
    doc.text(m.value, x + 8, y + 14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 120, 115);
    doc.text(m.label, x + 8, y + 20);
  });

  // ── Page 2 : Détail séances ──────────────────────────────────────────────
  doc.addPage();
  doc.setTextColor(...ink);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Détail des séances", 15, 20);

  const tableRows = appts.map((a) => {
    const patient = Array.isArray(a.patients) ? a.patients[0] : a.patients;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const name = patient ? `${(patient as any).first_name} ${(patient as any).last_name}` : "—";
    const date = new Date(a.start_time).toLocaleDateString("fr-FR");
    const start = new Date(a.start_time);
    const end = new Date(a.end_time);
    const duration = Math.round((end.getTime() - start.getTime()) / 60000);
    const amount = a.price ? `${(a.price / 100).toFixed(2)} €` : "—";
    const statusMap: Record<string, string> = {
      confirmed: "Confirmé",
      completed: "Réalisé",
      cancelled: "Annulé",
      no_show: "Absent",
    };
    const status = a.status ?? "confirmed";
    return [date, name, `${duration} min`, amount, statusMap[status] ?? status];
  });

  autoTable(doc, {
    startY: 28,
    head: [["Date", "Patient", "Durée", "Montant", "Statut"]],
    body: tableRows,
    headStyles: { fillColor: teal, textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: ink },
    alternateRowStyles: { fillColor: [248, 250, 249] },
    margin: { left: 15, right: 15 },
  });

  // ── Page 3 : Récap par patient ───────────────────────────────────────────
  doc.addPage();
  doc.setTextColor(...ink);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Récapitulatif par patient", 15, 20);

  const patientRows = Array.from(patientMap.values()).map((p) => [
    p.name,
    String(p.sessions),
    `${(p.billed / 100).toFixed(2)} €`,
    `${(p.paid / 100).toFixed(2)} €`,
  ]);

  autoTable(doc, {
    startY: 28,
    head: [["Patient", "Séances", "Total facturé", "Total payé"]],
    body: patientRows,
    headStyles: { fillColor: teal, textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: ink },
    alternateRowStyles: { fillColor: [248, 250, 249] },
    margin: { left: 15, right: 15 },
  });

  const pdfBuffer = doc.output("arraybuffer");
  const filename = `recap-${monthParam ?? startDate.toISOString().slice(0, 7)}.pdf`;

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
