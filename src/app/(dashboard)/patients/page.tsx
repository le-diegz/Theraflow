import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PatientsClient } from "./PatientsClient";

export default async function PatientsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: patients }, { data: rawSub }] = await Promise.all([
    supabase
      .from("patients")
      .select("id, first_name, last_name, email, phone, created_at")
      .eq("therapist_id", user.id)
      .order("last_name", { ascending: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("subscriptions")
      .select("plan")
      .eq("therapist_id", user.id)
      .maybeSingle(),
  ]);

  const plan: "free" | "pro" = rawSub?.plan === "pro" ? "pro" : "free";

  return <PatientsClient initialPatients={patients ?? []} plan={plan} />;
}
