import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    });
  }
  return _stripe;
}

// Named export for backwards compat — lazily resolved
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

export const PLANS = {
  free: {
    name: "Gratuit",
    price: 0,
    patientLimit: 3,
    features: ["3 patients max", "Agenda de base", "Fiches patients"],
  },
  pro: {
    name: "Pro",
    price: 3900, // en centimes = 39€
    patientLimit: Infinity,
    features: [
      "Patients illimités",
      "Rappels SMS automatiques",
      "Factures PDF",
      "Support prioritaire",
    ],
  },
} as const;
