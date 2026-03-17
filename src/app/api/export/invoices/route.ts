import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select(`
      invoice_number,
      issued_at,
      paid_at,
      amount,
      status,
      patients (first_name, last_name)
    `)
    .eq("therapist_id", user.id)
    .order("issued_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const headers = ["Numéro", "Patient", "Date émission", "Date paiement", "Montant (€)", "Statut"];

  const statusMap: Record<string, string> = {
    draft: "Brouillon",
    sent: "Envoyée",
    paid: "Payée",
  };

  const rows = (invoices ?? []).map((inv) => {
    const patient = Array.isArray(inv.patients) ? inv.patients[0] : inv.patients;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const name = patient ? `${(patient as any).first_name} ${(patient as any).last_name}` : "";
    return [
      inv.invoice_number ?? "",
      name,
      inv.issued_at ? new Date(inv.issued_at).toLocaleDateString("fr-FR") : "",
      inv.paid_at ? new Date(inv.paid_at).toLocaleDateString("fr-FR") : "",
      inv.amount ? (inv.amount / 100).toFixed(2) : "0.00",
      statusMap[inv.status ?? ""] ?? (inv.status ?? ""),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
  });

  const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
  const bom = "\uFEFF";

  return new Response(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="factures-theraflow.csv"',
    },
  });
}
