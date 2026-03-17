"use server";

import { createClient } from "@/lib/supabase/server";
import { getResend, FROM_EMAIL } from "@/lib/resend";
import { createNotification } from "@/lib/notifications";

export type BookingResult =
  | { success: true; patientName: string; therapistName: string; date: string; time: string }
  | { error: string };

export async function bookAppointment(data: {
  therapistId: string;
  therapistName: string;
  therapistEmail: string;
  startTime: string;
  endTime: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}): Promise<BookingResult> {
  const supabase = await createClient();

  // Vérifier que le créneau est toujours disponible
  const { data: conflict } = await supabase
    .from("appointments")
    .select("id")
    .eq("therapist_id", data.therapistId)
    .eq("start_time", data.startTime)
    .neq("status", "cancelled")
    .maybeSingle();

  if (conflict) return { error: "Ce créneau vient d'être réservé. Veuillez en choisir un autre." };

  // Trouver ou créer le patient
  let patientId: string;

  const { data: existingPatient } = await supabase
    .from("patients")
    .select("id")
    .eq("therapist_id", data.therapistId)
    .eq("email", data.email)
    .maybeSingle();

  if (existingPatient) {
    patientId = existingPatient.id;
  } else {
    const { data: newPatient, error: patientError } = await supabase
      .from("patients")
      .insert({
        therapist_id: data.therapistId,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone || null,
      })
      .select("id")
      .single();

    if (patientError || !newPatient) return { error: "Impossible de créer votre dossier patient." };
    patientId = newPatient.id;
  }

  // Créer le rendez-vous
  const { error: apptError } = await supabase.from("appointments").insert({
    therapist_id: data.therapistId,
    patient_id: patientId,
    start_time: data.startTime,
    end_time: data.endTime,
    status: "confirmed",
  });

  if (apptError) return { error: "Impossible de confirmer votre rendez-vous." };

  // Formater la date pour les emails
  const dateObj = new Date(data.startTime);
  const dateStr = dateObj.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = dateObj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const patientFullName = `${data.firstName} ${data.lastName}`;

  const resend = getResend();

  // Email au patient
  await resend?.emails.send({
    from: FROM_EMAIL,
    to: data.email,
    subject: `Votre RDV avec ${data.therapistName} est confirmé`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0D1F1A">
        <h1 style="font-size:24px;margin-bottom:8px">Réservation confirmée ✓</h1>
        <p style="color:#7A948C">Bonjour ${data.firstName},</p>
        <p>Votre rendez-vous est confirmé !</p>
        <div style="background:#F7F5F0;border-radius:12px;padding:20px;margin:24px 0">
          <p style="margin:0 0 8px;font-weight:600">Détails du rendez-vous</p>
          <p style="margin:4px 0;color:#7A948C">Avec : <strong style="color:#0D1F1A">${data.therapistName}</strong></p>
          <p style="margin:4px 0;color:#7A948C">Date : <strong style="color:#0D1F1A">${dateStr}</strong></p>
          <p style="margin:4px 0;color:#7A948C">Heure : <strong style="color:#0D1F1A">${timeStr}</strong></p>
        </div>
        <p style="font-size:13px;color:#7A948C">Pour annuler, répondez à cet email.</p>
        <hr style="border:none;border-top:1px solid #E8E6E0;margin:24px 0"/>
        <p style="font-size:12px;color:#7A948C">Theraflow · Votre cabinet en ligne</p>
      </div>
    `,
  }).catch(() => {});

  // Email au thérapeute
  await resend?.emails.send({
    from: FROM_EMAIL,
    to: data.therapistEmail,
    subject: `Nouvelle réservation de ${patientFullName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0D1F1A">
        <h1 style="font-size:24px;margin-bottom:8px">Nouvelle réservation 📅</h1>
        <p>Vous avez un nouveau rendez-vous !</p>
        <div style="background:#F7F5F0;border-radius:12px;padding:20px;margin:24px 0">
          <p style="margin:0 0 8px;font-weight:600">Détails</p>
          <p style="margin:4px 0;color:#7A948C">Patient : <strong style="color:#0D1F1A">${patientFullName}</strong></p>
          <p style="margin:4px 0;color:#7A948C">Email : <strong style="color:#0D1F1A">${data.email}</strong></p>
          ${data.phone ? `<p style="margin:4px 0;color:#7A948C">Tél : <strong style="color:#0D1F1A">${data.phone}</strong></p>` : ""}
          <p style="margin:4px 0;color:#7A948C">Date : <strong style="color:#0D1F1A">${dateStr}</strong></p>
          <p style="margin:4px 0;color:#7A948C">Heure : <strong style="color:#0D1F1A">${timeStr}</strong></p>
        </div>
        <p style="font-size:12px;color:#7A948C">Theraflow · Gérez ce RDV depuis votre dashboard</p>
      </div>
    `,
  }).catch(() => {});

  // Notification in-app pour le thérapeute
  await createNotification(
    data.therapistId,
    "new_booking",
    "Nouvelle réservation",
    `${patientFullName} a réservé un RDV le ${dateStr} à ${timeStr}.`,
    "/agenda"
  );

  return {
    success: true,
    patientName: patientFullName,
    therapistName: data.therapistName,
    date: dateStr,
    time: timeStr,
  };
}
