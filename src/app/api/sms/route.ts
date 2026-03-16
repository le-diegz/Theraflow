import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { to, message } = await request.json();

  if (!to || !message) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  // Twilio — à implémenter
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  // await client.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER, to })

  return NextResponse.json({ success: true });
}
