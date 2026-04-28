"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "./server";

export async function loginAction(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("language")
      .eq("user_id", user.id)
      .single();
    const store = await cookies();
    store.set("lang", profile?.language ?? "en", { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }

  redirect("/dashboard");
}

export async function registerAction(formData: FormData) {
  const supabase = await createClient();

  const password        = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const lang            = (formData.get("language") as string) || "en";

  if (password !== confirmPassword) {
    redirect(`/register?error=${encodeURIComponent(lang === "es" ? "Las contraseñas no coinciden" : "Passwords do not match")}`);
  }

  const { data, error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password,
  });

  if (error) redirect(`/register?error=${encodeURIComponent(error.message)}`);

  if (data.user) {
    await supabase.from("profiles").insert({
      user_id:   data.user.id,
      full_name: (formData.get("full_name") as string) || "",
      language:  lang,
    });
    const store = await cookies();
    store.set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }

  if (data.session) redirect("/dashboard");

  const msg = lang === "es"
    ? "Revisa tu correo para confirmar tu cuenta"
    : "Check your email to confirm your account";
  redirect(`/register?message=${encodeURIComponent(msg)}`);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const store = await cookies();
  store.delete("lang");
  redirect("/login");
}
