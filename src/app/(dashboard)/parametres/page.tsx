import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ParametresClient } from "./ParametresClient";

export default async function ParametresPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: avail }, { data: rawSub }, { count: patientCount }] =
    await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("profiles")
        .select(
          "full_name, first_name, last_name, specialty, phone, avatar_url, address, city, postal_code, slug, notif_new_booking, notif_reminder, notif_invoice, notif_weekly_recap, recap_day, sms_reminders_enabled, sms_reminder_delay"
        )
        .eq("id", user.id)
        .single(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("availability")
        .select(
          "day_of_week, start_time, end_time, session_duration, lunch_break_enabled, lunch_start, lunch_end, default_price"
        )
        .eq("therapist_id", user.id)
        .maybeSingle(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("subscriptions")
        .select("plan, status, current_period_end, stripe_customer_id")
        .eq("therapist_id", user.id)
        .maybeSingle(),
      supabase
        .from("patients")
        .select("id", { count: "exact", head: true })
        .eq("therapist_id", user.id),
    ]);

  // Dériver first_name / last_name depuis full_name si les champs sont vides
  const firstName =
    profile?.first_name ??
    (profile?.full_name ? profile.full_name.split(" ")[0] : null);
  const lastName =
    profile?.last_name ??
    (profile?.full_name ? profile.full_name.split(" ").slice(1).join(" ") || null : null);

  return (
    <ParametresClient
      userId={user.id}
      email={user.email ?? ""}
      profile={{
        first_name: firstName ?? null,
        last_name: lastName ?? null,
        specialty: profile?.specialty ?? null,
        phone: profile?.phone ?? null,
        avatar_url: profile?.avatar_url ?? null,
        address: profile?.address ?? null,
        city: profile?.city ?? null,
        postal_code: profile?.postal_code ?? null,
        slug: profile?.slug ?? null,
        notif_new_booking: profile?.notif_new_booking ?? true,
        notif_reminder: profile?.notif_reminder ?? true,
        notif_invoice: profile?.notif_invoice ?? true,
        notif_weekly_recap: profile?.notif_weekly_recap ?? true,
        recap_day: profile?.recap_day ?? 1,
        sms_reminders_enabled: profile?.sms_reminders_enabled ?? true,
        sms_reminder_delay: profile?.sms_reminder_delay ?? 24,
      }}
      availability={
        avail
          ? {
              days: avail.day_of_week ?? [1, 2, 3, 4, 5],
              startTime: avail.start_time ?? "09:00",
              endTime: avail.end_time ?? "18:00",
              sessionDuration: avail.session_duration ?? 60,
              lunchBreakEnabled: avail.lunch_break_enabled ?? false,
              lunchStart: avail.lunch_start ?? "12:00",
              lunchEnd: avail.lunch_end ?? "14:00",
              defaultPrice: avail.default_price ? avail.default_price / 100 : 60,
            }
          : null
      }
      subscription={
        rawSub
          ? {
              plan: rawSub.plan ?? "free",
              status: rawSub.status ?? null,
              current_period_end: rawSub.current_period_end ?? null,
              stripe_customer_id: rawSub.stripe_customer_id ?? null,
            }
          : null
      }
      patientCount={patientCount ?? 0}
    />
  );
}
