"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PatientActionState = {
  error?: string;
  success?: boolean;
} | null;

// ─── Créer un patient ─────────────────────────────────────────────────────────

export async function createPatient(
  _prevState: PatientActionState,
  formData: FormData
): Promise<PatientActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Non authentifié" };

  const firstName = (formData.get("first_name") as string)?.trim();
  const lastName = (formData.get("last_name") as string)?.trim();

  if (!firstName || !lastName) {
    return { error: "Prénom et nom sont requis." };
  }

  const { data, error } = await supabase.from("patients").insert({
    therapist_id: user.id,
    first_name: firstName,
    last_name: lastName,
    email: (formData.get("email") as string)?.trim() || null,
    phone: (formData.get("phone") as string)?.trim() || null,
    birthdate: (formData.get("birthdate") as string) || null,
  }).select("id").single();

  if (error) {
    console.error("Supabase error [createPatient]:", error);
    // Traduire les erreurs Supabase les plus communes en français
    if (error.code === "42P01") {
      return { error: "La table patients n'existe pas encore. Créez-la dans Supabase." };
    }
    if (error.code === "42501" || error.message.includes("RLS")) {
      return { error: "Accès refusé par la politique de sécurité (RLS). Vérifiez les policies Supabase." };
    }
    if (error.code === "23503") {
      return { error: "Le profil thérapeute n'existe pas encore dans la table profiles." };
    }
    return { error: `Erreur Supabase (${error.code ?? "inconnu"}) : ${error.message}` };
  }

  console.log("Patient créé avec succès, id:", data?.id);

  revalidatePath("/patients");
  return { success: true };
}

// ─── Mettre à jour les notes d'un patient ─────────────────────────────────────

export async function updatePatientNotes(
  patientId: string,
  notes: string
): Promise<PatientActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase
    .from("patients")
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", patientId)
    .eq("therapist_id", user.id); // Sécurité : vérifie que le patient appartient au thérapeute

  if (error) {
    return { error: "Impossible de sauvegarder les notes." };
  }

  revalidatePath(`/patients/${patientId}`);
  return { success: true };
}

// ─── Supprimer un patient ─────────────────────────────────────────────────────

export async function deletePatient(
  patientId: string
): Promise<PatientActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase
    .from("patients")
    .delete()
    .eq("id", patientId)
    .eq("therapist_id", user.id);

  if (error) {
    return { error: "Impossible de supprimer le patient." };
  }

  revalidatePath("/patients");
  return { success: true };
}
