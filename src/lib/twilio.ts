import twilio from "twilio";

export function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
}

export async function sendSMS(to: string, body: string): Promise<boolean> {
  const client = getTwilioClient();
  if (!client) return false;

  try {
    await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    return true;
  } catch (err) {
    console.error("[twilio] sendSMS error:", err);
    return false;
  }
}
