import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import type { Tables } from "@/types/database.types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let { data: profile } = await supabase
    .from("profiles")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .select("full_name, specialty, onboarding_completed" as any)
    .eq("id", user.id)
    .single();

  // Création automatique du profil si absent (premier login, ou signup sans confirmation email)
  if (!profile) {
    const { data: created, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email ?? "",
          full_name: user.user_metadata?.full_name ?? null,
          specialty: user.user_metadata?.specialty ?? null,
        },
        { onConflict: "id", ignoreDuplicates: true }
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select("full_name, specialty, onboarding_completed" as any)
      .single();

    if (error) {
      console.error("[layout] profile upsert failed:", error.message);
    } else {
      profile = created;
    }
  }

  // Redirect to onboarding if not completed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (profile && !(profile as any).onboarding_completed) {
    redirect("/onboarding");
  }

  const p = profile as Pick<Tables<"profiles">, "full_name" | "specialty"> | null;

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      <Sidebar
        fullName={p?.full_name ?? ""}
        specialty={p?.specialty ?? null}
        email={user.email ?? ""}
      />

      {/* Zone de contenu principale */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Espaceur pour la barre mobile */}
        <div className="h-14 md:hidden shrink-0" />

        {/* Top bar desktop avec NotificationBell */}
        <div className="hidden md:flex h-14 shrink-0 border-b border-border bg-white items-center justify-end px-6">
          <NotificationBell userId={user.id} />
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
