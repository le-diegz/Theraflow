"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type InvoiceActionState = {
  error?: string;
  success?: boolean;
} | null;

// ─── Générer le prochain numéro de facture ────────────────────────────────────

async function generateInvoiceNumber(therapistId: string): Promise<string> {
  const supabase = await createClient();
  const year = new Date().getFullYear();

  const { data } = await supabase
    .from("invoices")
    .select("invoice_number")
    .eq("therapist_id", therapistId)
    .like("invoice_number", `TF-${year}-%`)
    .order("invoice_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  let next = 1;
  if (data?.invoice_number) {
    const parts = data.invoice_number.split("-");
    const last = parseInt(parts[2] ?? "0", 10);
    if (!isNaN(last)) next = last + 1;
  }

  return `TF-${year}-${String(next).padStart(3, "0")}`;
}

// ─── Créer une facture ────────────────────────────────────────────────────────

export async function createInvoice(
  _prevState: InvoiceActionState,
  formData: FormData
): Promise<InvoiceActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Non authentifié" };

  const patientId = (formData.get("patient_id") as string)?.trim();
  const appointmentId = (formData.get("appointment_id") as string)?.trim() || null;
  const amountStr = (formData.get("amount") as string)?.replace(",", ".");
  const amountEuros = parseFloat(amountStr);
  const issuedAt = (formData.get("issued_at") as string) || new Date().toISOString().split("T")[0];

  if (!patientId) return { error: "Veuillez sélectionner un patient." };
  if (isNaN(amountEuros) || amountEuros <= 0) return { error: "Montant invalide." };

  const invoiceNumber = await generateInvoiceNumber(user.id);

  const { error } = await supabase.from("invoices").insert({
    therapist_id: user.id,
    patient_id: patientId,
    appointment_id: appointmentId,
    amount: Math.round(amountEuros * 100),
    status: "draft",
    invoice_number: invoiceNumber,
    issued_at: issuedAt,
  });

  if (error) {
    console.error("Supabase error [createInvoice]:", error);
    if (error.code === "42P01") {
      return { error: "La table invoices n'existe pas encore. Créez-la dans Supabase." };
    }
    if (error.code === "42501" || error.message.includes("RLS")) {
      return { error: "Accès refusé par la politique de sécurité (RLS)." };
    }
    return { error: `Erreur (${error.code ?? "inconnu"}) : ${error.message}` };
  }

  revalidatePath("/facturation");
  return { success: true };
}

// ─── Marquer comme payée ──────────────────────────────────────────────────────

export async function markAsPaid(invoiceId: string): Promise<InvoiceActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Non authentifié" };

  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabase
    .from("invoices")
    .update({ status: "paid", paid_at: today })
    .eq("id", invoiceId)
    .eq("therapist_id", user.id);

  if (error) {
    return { error: "Impossible de mettre à jour la facture." };
  }

  revalidatePath("/facturation");
  return { success: true };
}

// ─── Marquer comme envoyée ────────────────────────────────────────────────────

export async function markAsSent(invoiceId: string): Promise<InvoiceActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase
    .from("invoices")
    .update({ status: "sent" })
    .eq("id", invoiceId)
    .eq("therapist_id", user.id)
    .eq("status", "draft"); // seulement depuis draft

  if (error) {
    return { error: "Impossible de mettre à jour la facture." };
  }

  revalidatePath("/facturation");
  return { success: true };
}

// ─── Supprimer une facture ────────────────────────────────────────────────────

export async function deleteInvoice(invoiceId: string): Promise<InvoiceActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Non authentifié" };

  // Vérifier que la facture est bien un brouillon
  const { data: invoice } = await supabase
    .from("invoices")
    .select("status")
    .eq("id", invoiceId)
    .eq("therapist_id", user.id)
    .single();

  if (!invoice) return { error: "Facture introuvable." };
  if (invoice.status !== "draft") {
    return { error: "Seules les factures en brouillon peuvent être supprimées." };
  }

  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", invoiceId)
    .eq("therapist_id", user.id);

  if (error) {
    return { error: "Impossible de supprimer la facture." };
  }

  revalidatePath("/facturation");
  return { success: true };
}
