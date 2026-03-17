import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ParametresClient,
  type ProfileData,
  type SubscriptionData,
  type SmsSettings,
} from "./ParametresClient";

export default async function ParametresPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: rawSub }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("profiles")
      .select("full_name, specialty, phone, sms_reminders_enabled, sms_reminder_delay")
      .eq("id", user.id)
      .single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("subscriptions")
      .select("plan, status, current_period_end, stripe_customer_id")
      .eq("therapist_id", user.id)
      .maybeSingle(),
  ]);

  const profileData: ProfileData = {
    full_name: profile?.full_name ?? null,
    specialty: profile?.specialty ?? null,
    phone: profile?.phone ?? null,
    email: user.email ?? "",
  };

  const smsSettings: SmsSettings = {
    enabled: profile?.sms_reminders_enabled ?? true,
    delay: profile?.sms_reminder_delay ?? 24,
  };

  const subscription: SubscriptionData | null = rawSub
    ? {
        plan: (rawSub.plan as "free" | "pro") ?? "free",
        status: rawSub.status ?? null,
        current_period_end: rawSub.current_period_end ?? null,
        stripe_customer_id: rawSub.stripe_customer_id ?? null,
      }
    : null;

  return (
    <ParametresClient
      profile={profileData}
      subscription={subscription}
      smsSettings={smsSettings}
    />
  );
}
