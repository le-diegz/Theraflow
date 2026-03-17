"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ─── SMS settings ─────────────────────────────────────────────────────────────

export type SmsActionState = { error?: string; success?: boolean } | null;

export async function updateSmsSettings(
  _prevState: SmsActionState,
  formData: FormData
): Promise<SmsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const enabled = formData.get("sms_enabled") === "on";
  const delay = parseInt(formData.get("sms_delay") as string, 10) || 24;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .update({ sms_reminders_enabled: enabled, sms_reminder_delay: delay })
    .eq("id", user.id);

  if (error) return { error: "Impossible de sauvegarder les paramètres SMS." };

  revalidatePath("/parametres");
  return { success: true };
}

export type ProfileActionState = {
  error?: string;
  success?: boolean;
} | null;

export async function updateProfile(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Non authentifié" };

  const full_name = (formData.get("full_name") as string)?.trim() || null;
  const specialtyRaw = (formData.get("specialty") as string) || null;
  const specialty = specialtyRaw as
    | "psychologue"
    | "osteopathe"
    | "kinesitherapeute"
    | "autre"
    | null;
  const phone = (formData.get("phone") as string)?.trim() || null;

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, specialty, phone, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return { error: "Impossible de mettre à jour le profil." };
  }

  revalidatePath("/parametres");
  revalidatePath("/dashboard");
  return { success: true };
}
