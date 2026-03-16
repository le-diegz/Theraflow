import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Récupérer le stripe_customer_id depuis la table subscriptions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any;
  const { data: sub } = await supabaseAny
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("therapist_id", user.id)
    .maybeSingle();

  if (!sub?.stripe_customer_id) {
    return NextResponse.json(
      { error: "Aucun abonnement Stripe trouvé." },
      { status: 404 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${appUrl}/parametres`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[portal] Stripe error:", err);
    return NextResponse.json(
      { error: "Impossible d'accéder au portail de facturation." },
      { status: 500 }
    );
  }
}
