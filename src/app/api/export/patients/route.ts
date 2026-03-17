import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  // Fetch patients with appointment stats
  const { data: patients, error } = await supabase
    .from("patients")
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      birthdate,
      created_at,
      appointments (start_time, status)
    `)
    .eq("therapist_id", user.id)
    .order("last_name", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Build CSV
  const headers = [
    "Prénom",
    "Nom",
    "Email",
    "Téléphone",
    "Date de naissance",
    "Date premier RDV",
    "Nombre de séances",
    "Dernière séance",
  ];

  const rows = (patients ?? []).map((p) => {
    const appts = (p.appointments ?? []).filter(
      (a: { status: string }) => a.status !== "cancelled"
    );
    const sortedDates = appts
      .map((a: { start_time: string }) => a.start_time)
      .sort();

    const firstAppt = sortedDates[0]
      ? new Date(sortedDates[0]).toLocaleDateString("fr-FR")
      : "";
    const lastAppt = sortedDates[sortedDates.length - 1]
      ? new Date(sortedDates[sortedDates.length - 1]).toLocaleDateString("fr-FR")
      : "";

    return [
      p.first_name ?? "",
      p.last_name ?? "",
      p.email ?? "",
      p.phone ?? "",
      p.birthdate ? new Date(p.birthdate).toLocaleDateString("fr-FR") : "",
      firstAppt,
      String(appts.length),
      lastAppt,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
  });

  const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
  const bom = "\uFEFF"; // UTF-8 BOM pour Excel

  return new Response(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="patients-theraflow.csv"',
    },
  });
}
