"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AppointmentActionState = {
  error?: string;
  success?: boolean;
} | null;

// ─── Créer un RDV ─────────────────────────────────────────────────────────────

export async function createAppointment(
  _prevState: AppointmentActionState,
  formData: FormData
): Promise<AppointmentActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Non authentifié" };

  const patientId = formData.get("patient_id") as string;
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const durationMinutes = parseInt(formData.get("duration") as string, 10);
  const priceStr = (formData.get("price") as string)?.replace(",", ".");
  const priceEuros = parseFloat(priceStr);
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!patientId || !date || !time) {
    return { error: "Patient, date et heure sont requis." };
  }

  if (isNaN(durationMinutes) || durationMinutes <= 0) {
    return { error: "Durée invalide." };
  }

  const startTime = new Date(`${date}T${time}`);
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  const { error } = await supabase.from("appointments").insert({
    therapist_id: user.id,
    patient_id: patientId,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    status: "confirmed",
    price: isNaN(priceEuros) ? null : Math.round(priceEuros * 100),
    notes,
  });

  if (error) {
    console.error("Supabase error [createAppointment]:", error);
    if (error.code === "42P01") {
      return { error: "La table appointments n'existe pas encore. Créez-la dans Supabase." };
    }
    if (error.code === "42501" || error.message.includes("RLS")) {
      return { error: "Accès refusé par la politique de sécurité (RLS)." };
    }
    if (error.code === "23503") {
      return { error: "Patient ou profil thérapeute introuvable." };
    }
    return { error: `Erreur (${error.code ?? "inconnu"}) : ${error.message}` };
  }

  revalidatePath("/agenda");
  return { success: true };
}

// ─── Mettre à jour le statut d'un RDV ─────────────────────────────────────────

export async function updateAppointmentStatus(
  appointmentId: string,
  status: "completed" | "cancelled" | "no_show"
): Promise<AppointmentActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .eq("therapist_id", user.id);

  if (error) {
    return { error: "Impossible de mettre à jour le statut." };
  }

  revalidatePath("/agenda");
  return { success: true };
}
