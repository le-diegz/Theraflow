import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Use any to bypass complex Supabase generic constraints in webhook handlers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any;

  switch (event.type) {
    // ── Checkout terminé → activer Pro ──────────────────────────────────────
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const therapistId = session.metadata?.therapist_id;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string | null;

      if (therapistId && customerId) {
        await supabase.from("subscriptions").upsert(
          {
            therapist_id: therapistId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan: "pro",
            status: "active",
          },
          { onConflict: "therapist_id" }
        );
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const therapistId = sub.metadata?.therapist_id;

      if (therapistId) {
        // current_period_end exists on older Stripe API versions; access safely
        const periodEnd = (sub as unknown as Record<string, unknown>)
          .current_period_end as number | undefined;

        await supabase.from("subscriptions").upsert({
          therapist_id: therapistId,
          stripe_customer_id: sub.customer as string,
          stripe_subscription_id: sub.id,
          plan: sub.status === "active" ? "pro" : "free",
          status: sub.status,
          current_period_end: periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : null,
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;

      await supabase
        .from("subscriptions")
        .update({ plan: "free", status: "cancelled" })
        .eq("stripe_subscription_id", sub.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
