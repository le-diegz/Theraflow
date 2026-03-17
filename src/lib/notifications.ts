import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationType = "new_booking" | "appointment_soon" | "invoice_overdue";

export async function createNotification(
  therapistId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) {
  try {
    const supabase = createAdminClient();
    await supabase.from("notifications").insert({
      therapist_id: therapistId,
      type,
      title,
      message,
      link: link ?? null,
    });
  } catch (err) {
    console.error("[notifications] createNotification error:", err);
  }
}
