import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSMS } from "@/lib/twilio";
import { createNotification } from "@/lib/notifications";

// Protégé par CRON_SECRET (header Authorization: Bearer <secret>)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();

  // ── Fenêtre SMS : RDV dans 23h–25h ───────────────────────────────────────
  const smsFrom = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
  const smsTo = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

  // ── Fenêtre notif "bientôt" : RDV dans 55min–65min ───────────────────────
  const soonFrom = new Date(now.getTime() + 55 * 60 * 1000).toISOString();
  const soonTo = new Date(now.getTime() + 65 * 60 * 1000).toISOString();

  let smsSent = 0;
  let smsErrors = 0;
  let notifsSent = 0;

  // ── 1. Rappels SMS 24h avant ──────────────────────────────────────────────
  const { data: smsAppts, error: smsErr } = await supabase
    .from("appointments")
    .select(`
      id,
      start_time,
      therapist_id,
      sms_reminder_sent,
      patients (first_name, phone),
      profiles!appointments_therapist_id_fkey (full_name, sms_reminders_enabled)
    `)
    .eq("status", "confirmed")
    .eq("sms_reminder_sent", false)
    .gte("start_time", smsFrom)
    .lte("start_time", smsTo);

  if (smsErr) {
    console.error("[reminders] SMS query error:", smsErr.message);
  }

  for (const appt of smsAppts ?? []) {
    const patient = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients;
    const profile = Array.isArray(appt.profiles) ? appt.profiles[0] : appt.profiles;

    // Vérifier que le thérapeute a les rappels SMS activés
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(profile as any)?.sms_reminders_enabled) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const phone = (patient as any)?.phone;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstName = (patient as any)?.first_name ?? "Patient";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const therapistName = (profile as any)?.full_name ?? "votre thérapeute";

    if (!phone) continue;

    const dateObj = new Date(appt.start_time);
    const timeStr = dateObj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://theraflow.fr").replace(/\/$/, "");

    const message = `Bonjour ${firstName}, rappel de votre RDV avec ${therapistName} demain à ${timeStr}. Pour annuler : ${appUrl}/contact\n- Theraflow`;

    const ok = await sendSMS(phone, message);

    if (ok) {
      await supabase
        .from("appointments")
        .update({ sms_reminder_sent: true })
        .eq("id", appt.id);
      smsSent++;
    } else {
      smsErrors++;
    }
  }

  // ── 2. Notifications "RDV dans 1h" ───────────────────────────────────────
  const { data: soonAppts, error: soonErr } = await supabase
    .from("appointments")
    .select(`
      id,
      start_time,
      therapist_id,
      patients (first_name, last_name)
    `)
    .eq("status", "confirmed")
    .gte("start_time", soonFrom)
    .lte("start_time", soonTo);

  if (soonErr) {
    console.error("[reminders] soon-notif query error:", soonErr.message);
  }

  for (const appt of soonAppts ?? []) {
    const patient = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const name = patient ? `${(patient as any).first_name} ${(patient as any).last_name}` : "Patient";

    await createNotification(
      appt.therapist_id,
      "appointment_soon",
      "RDV dans 1h",
      `Votre RDV avec ${name} commence dans 1 heure.`,
      "/agenda"
    );
    notifsSent++;
  }

  return Response.json({
    ok: true,
    smsSent,
    smsErrors,
    notifsSent,
  });
}
