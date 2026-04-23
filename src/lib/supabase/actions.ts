"use server";

import { redirect } from "next/navigation";
import { createClient } from "./server";

export async function loginAction(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}

export async function registerAction(formData: FormData) {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    redirect("/register?error=Passwords+do+not+match");
  }

  const { data, error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password,
  });

  if (error) redirect(`/register?error=${encodeURIComponent(error.message)}`);

  // If session exists, email confirmation is off — go straight to dashboard
  if (data.session) redirect("/dashboard");

  // Otherwise Supabase sent a confirmation email
  redirect("/register?message=Check+your+email+to+confirm+your+account");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
