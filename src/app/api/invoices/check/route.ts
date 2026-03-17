import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";

// Route protégée par CRON_SECRET — peut être appelée par un cron Vercel
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Factures envoyées depuis plus de 7 jours, non payées
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: overdueInvoices, error } = await supabase
    .from("invoices")
    .select(`
      id,
      therapist_id,
      invoice_number,
      issued_at,
      patients (first_name, last_name)
    `)
    .eq("status", "sent")
    .lte("issued_at", sevenDaysAgo);

  if (error) {
    console.error("[invoices/check] query error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  let notifsSent = 0;

  for (const inv of overdueInvoices ?? []) {
    const patient = Array.isArray(inv.patients) ? inv.patients[0] : inv.patients;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const name = patient ? `${(patient as any).first_name} ${(patient as any).last_name}` : "Patient";

    if (!inv.therapist_id) continue;
    await createNotification(
      inv.therapist_id,
      "invoice_overdue",
      "Facture impayée",
      `Facture ${inv.invoice_number} impayée depuis plus de 7 jours pour ${name}.`,
      "/facturation"
    );
    notifsSent++;
  }

  return Response.json({ ok: true, notifsSent });
}
