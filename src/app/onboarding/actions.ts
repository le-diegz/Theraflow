"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ─── Étape 1 — Spécialité ─────────────────────────────────────────────────────

export async function saveSpecialty(specialty: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase
    .from("profiles")
    .update({ specialty: specialty as "psychologue" | "osteopathe" | "kinesitherapeute" | "autre" })
    .eq("id", user.id);

  return error ? { error: "Impossible de sauvegarder." } : {};
}

// ─── Étape 2 — Disponibilités ─────────────────────────────────────────────────

export async function saveAvailability(data: {
  days: number[];
  startTime: string;
  endTime: string;
  sessionDuration: number;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("availability")
    .upsert({
      therapist_id: user.id,
      day_of_week: data.days,
      start_time: data.startTime,
      end_time: data.endTime,
      session_duration: data.sessionDuration,
    }, { onConflict: "therapist_id" });

  return error ? { error: "Impossible de sauvegarder les horaires." } : {};
}

// ─── Étape 3 — Premier patient ────────────────────────────────────────────────

export async function saveFirstPatient(formData: {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase.from("patients").insert({
    therapist_id: user.id,
    first_name: formData.first_name.trim(),
    last_name: formData.last_name.trim(),
    email: formData.email?.trim() || null,
    phone: formData.phone?.trim() || null,
  });

  return error ? { error: "Impossible de créer le patient." } : {};
}

// ─── Étape 4 — Slug + complétion ─────────────────────────────────────────────

export async function completeOnboarding(slug: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .update({ slug, onboarding_completed: true })
    .eq("id", user.id);

  if (error) return { error: "Impossible de finaliser l'onboarding." };

  revalidatePath("/dashboard");
  return {};
}
