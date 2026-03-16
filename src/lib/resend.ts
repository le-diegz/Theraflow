import { Resend } from "resend";

export const FROM_EMAIL = "Theraflow <noreply@theraflow.fr>";

// Lazy — ne plante pas si RESEND_API_KEY est absent (dev sans emails)
export function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}
