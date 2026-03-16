"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  success?: string;
} | null;

// ─── Messages d'erreur en français ───────────────────────────────────────────

function mapError(msg: string): string {
  if (msg.includes("Invalid login credentials"))
    return "Email ou mot de passe incorrect.";
  if (msg.includes("Email not confirmed"))
    return "Confirmez votre email avant de vous connecter.";
  if (msg.includes("User already registered"))
    return "Un compte existe déjà avec cet email.";
  if (msg.includes("Password should be at least"))
    return "Le mot de passe doit contenir au moins 6 caractères.";
  if (msg.includes("Unable to validate email"))
    return "Adresse email invalide.";
  return "Une erreur est survenue. Veuillez réessayer.";
}

// ─── Connexion ────────────────────────────────────────────────────────────────

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: mapError(error.message) };
  }

  redirect("/dashboard");
}

// ─── Inscription ──────────────────────────────────────────────────────────────

export async function signup(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const specialty = formData.get("specialty") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: mapError(error.message) };
  }

  // Si l'utilisateur a une session (confirmation email désactivée dans Supabase)
  // on crée son profil immédiatement
  if (data.user) {
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      email,
      full_name: `${firstName} ${lastName}`.trim(),
      specialty: specialty || "autre",
    } as never);

    if (profileError) {
      // L'email n'est peut-être pas encore confirmé — le profil sera créé plus tard
      // Ne pas bloquer l'inscription pour autant
      console.error("[signup] profile upsert:", profileError.message);
    }
  }

  // Si confirmation email requise → afficher le message
  if (!data.session) {
    return {
      success:
        "Un email de confirmation a été envoyé. Vérifiez votre boîte mail.",
    };
  }

  redirect("/dashboard");
}

// ─── Mot de passe oublié ──────────────────────────────────────────────────────

export async function forgotPassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(
    formData.get("email") as string,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
    }
  );

  if (error) {
    return { error: mapError(error.message) };
  }

  return {
    success:
      "Si ce compte existe, un email de réinitialisation a été envoyé.",
  };
}

// ─── Déconnexion ──────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
