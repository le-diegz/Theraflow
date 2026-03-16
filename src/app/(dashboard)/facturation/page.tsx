import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  FacturationClient,
  type InvoiceRow,
  type PatientOption,
  type AppointmentOption,
  type TherapistInfo,
} from "./FacturationClient";

export default async function FacturationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    { data: rawInvoices },
    { data: patients },
    { data: appointments },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, invoice_number, amount, status, issued_at, paid_at, patient_id, appointment_id")
      .eq("therapist_id", user.id)
      .order("issued_at", { ascending: false }),
    supabase
      .from("patients")
      .select("id, first_name, last_name, email")
      .eq("therapist_id", user.id)
      .order("last_name", { ascending: true }),
    supabase
      .from("appointments")
      .select("id, patient_id, start_time, price")
      .eq("therapist_id", user.id)
      .eq("status", "completed")
      .order("start_time", { ascending: false }),
    supabase
      .from("profiles")
      .select("full_name, specialty, phone")
      .eq("id", user.id)
      .single(),
  ]);

  // Construire map patient_id → nom
  const patientMap = new Map(
    (patients ?? []).map((p) => [
      p.id,
      `${p.first_name} ${p.last_name}`,
    ])
  );

  const invoices: InvoiceRow[] = (rawInvoices ?? []).map((inv) => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    amount: inv.amount,
    status: inv.status as "draft" | "sent" | "paid",
    issued_at: inv.issued_at,
    paid_at: inv.paid_at ?? null,
    patient_id: inv.patient_id,
    appointment_id: inv.appointment_id ?? null,
    patient_name: patientMap.get(inv.patient_id) ?? "Patient inconnu",
  }));

  const therapist: TherapistInfo = {
    full_name: profile?.full_name ?? null,
    specialty: profile?.specialty ?? null,
    email: user.email ?? "",
    phone: profile?.phone ?? null,
  };

  const patientOptions: PatientOption[] = (patients ?? []).map((p) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    email: p.email ?? null,
  }));

  const appointmentOptions: AppointmentOption[] = (appointments ?? []).map((a) => ({
    id: a.id,
    patient_id: a.patient_id,
    start_time: a.start_time,
    price: a.price ?? null,
  }));

  return (
    <FacturationClient
      invoices={invoices}
      patients={patientOptions}
      appointments={appointmentOptions}
      therapist={therapist}
    />
  );
}
