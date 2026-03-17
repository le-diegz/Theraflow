"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = { success?: boolean; error?: string };

// ─── Profil ───────────────────────────────────────────────────────────────────

export async function saveProfileInfo(data: {
  first_name: string | null;
  last_name: string | null;
  specialty: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const full_name = [data.first_name, data.last_name].filter(Boolean).join(" ") || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .update({ ...data, full_name, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: "Impossible de mettre à jour le profil." };

  revalidatePath("/parametres");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function saveAvatarUrl(avatarUrl: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (error) return { error: "Impossible de sauvegarder la photo." };
  revalidatePath("/parametres");
  return { success: true };
}

// ─── Agenda — slug ────────────────────────────────────────────────────────────

export async function saveSlug(slug: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { error: "Uniquement lettres minuscules, chiffres et tirets." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .update({ slug })
    .eq("id", user.id);

  if (error?.code === "23505") return { error: "Ce lien est déjà utilisé." };
  if (error) return { error: "Impossible de sauvegarder le lien." };

  revalidatePath("/parametres");
  return { success: true };
}

// ─── Agenda — disponibilités ──────────────────────────────────────────────────

export async function saveAvailabilitySettings(data: {
  days: number[];
  startTime: string;
  endTime: string;
  sessionDuration: number;
  lunchBreakEnabled: boolean;
  lunchStart: string;
  lunchEnd: string;
  defaultPrice: number; // en euros → on convertit en centimes
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("availability")
    .upsert(
      {
        therapist_id: user.id,
        day_of_week: data.days,
        start_time: data.startTime,
        end_time: data.endTime,
        session_duration: data.sessionDuration,
        lunch_break_enabled: data.lunchBreakEnabled,
        lunch_start: data.lunchStart,
        lunch_end: data.lunchEnd,
        default_price: Math.round(data.defaultPrice * 100),
      },
      { onConflict: "therapist_id" }
    );

  if (error) return { error: "Impossible de sauvegarder les disponibilités." };
  revalidatePath("/parametres");
  return { success: true };
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function saveNotificationSettings(data: {
  notifNewBooking: boolean;
  notifReminder: boolean;
  notifInvoice: boolean;
  notifWeeklyRecap: boolean;
  recapDay: number;
  smsEnabled: boolean;
  smsDelay: number;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .update({
      notif_new_booking: data.notifNewBooking,
      notif_reminder: data.notifReminder,
      notif_invoice: data.notifInvoice,
      notif_weekly_recap: data.notifWeeklyRecap,
      recap_day: data.recapDay,
      sms_reminders_enabled: data.smsEnabled,
      sms_reminder_delay: data.smsDelay,
    })
    .eq("id", user.id);

  if (error) return { error: "Impossible de sauvegarder les préférences." };
  revalidatePath("/parametres");
  return { success: true };
}

// ─── Sécurité — mot de passe ──────────────────────────────────────────────────

export async function changePassword(newPassword: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { success: true };
}

// ─── Sécurité — suppression compte ───────────────────────────────────────────

export async function deleteAccount(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: "Impossible de supprimer le compte. Contactez le support." };

  redirect("/");
}

// ─── Compat legacy (pour imports existants) ───────────────────────────────────

export type ProfileActionState = ActionResult | null;
export type SmsActionState = ActionResult | null;

export async function updateProfile(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const full_name = (formData.get("full_name") as string)?.trim() || null;
  const parts = full_name?.split(" ") ?? [];
  return saveProfileInfo({
    first_name: parts[0] ?? null,
    last_name: parts.slice(1).join(" ") || null,
    specialty: (formData.get("specialty") as string) || null,
    phone: (formData.get("phone") as string)?.trim() || null,
    address: null,
    city: null,
    postal_code: null,
  });
}

export async function updateSmsSettings(
  _prev: SmsActionState,
  formData: FormData
): Promise<SmsActionState> {
  return saveNotificationSettings({
    notifNewBooking: true,
    notifReminder: true,
    notifInvoice: true,
    notifWeeklyRecap: true,
    recapDay: 1,
    smsEnabled: formData.get("sms_enabled") === "on",
    smsDelay: parseInt(formData.get("sms_delay") as string, 10) || 24,
  });
}
