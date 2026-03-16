import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgendaClient, type RawEvent } from "./AgendaClient";

export default async function AgendaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: appointments }, { data: patients }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, patient_id, start_time, end_time, status, notes, price")
      .eq("therapist_id", user.id)
      .order("start_time", { ascending: true }),
    supabase
      .from("patients")
      .select("id, first_name, last_name")
      .eq("therapist_id", user.id)
      .order("last_name", { ascending: true }),
  ]);

  // Construire un map patient_id → nom complet
  const patientMap = new Map(
    (patients ?? []).map((p) => [p.id, `${p.first_name} ${p.last_name}`])
  );

  const events: RawEvent[] = (appointments ?? []).map((a) => ({
    id: a.id,
    title: patientMap.get(a.patient_id ?? "") ?? "Patient inconnu",
    start: a.start_time,
    end: a.end_time,
    status: a.status ?? "confirmed",
    notes: a.notes ?? null,
    price: a.price ?? null,
    patientId: a.patient_id ?? null,
  }));

  return <AgendaClient initialEvents={events} patients={patients ?? []} />;
}
