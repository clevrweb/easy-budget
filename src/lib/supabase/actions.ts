"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createClient } from "./server";
import { createAdminClient } from "./admin";
import { ACCOUNT_COOKIE } from "./account";
import { getDict } from "@/lib/i18n";
import { getServerDict } from "@/lib/i18n/server";
import { translateAuthError } from "@/lib/i18n/auth-errors";
import { getResendClient, EMAIL_FROM } from "@/lib/email/resend";
import { passwordResetEmail } from "@/lib/email/templates";

export async function loginAction(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    const dict = await getServerDict();
    redirect(`/login?error=${encodeURIComponent(translateAuthError(dict, error))}`);
  }

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
  const dict            = getDict(lang);

  if (password !== confirmPassword) {
    redirect(`/register?error=${encodeURIComponent(dict.auth.passwordMismatch)}`);
  }

  const { data, error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password,
  });

  if (error) redirect(`/register?error=${encodeURIComponent(translateAuthError(dict, error))}`);

  if (data.user) {
    const fullName = (formData.get("full_name") as string) || "";

    await supabase.from("profiles").insert({
      user_id:   data.user.id,
      full_name: fullName,
      language:  lang,
    });

    const admin = createAdminClient();
    const { data: account, error: accountError } = await admin
      .from("accounts")
      .insert({ name: fullName || "My Budget", is_personal: true, created_by: data.user.id })
      .select("id")
      .single();

    if (!accountError && account) {
      await admin.from("account_members").insert({ account_id: account.id, user_id: data.user.id });
    }

    const store = await cookies();
    store.set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }

  if (data.session) redirect("/dashboard");

  redirect(`/register?message=${encodeURIComponent(dict.auth.checkEmail)}`);
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const dict = await getServerDict();

  // Always the same response regardless of whether the email exists, to
  // avoid leaking which addresses have accounts.
  if (!email || !email.includes("@")) return { success: true };

  const admin = createAdminClient();
  const { data: exists } = await admin.rpc("email_exists", { check_email: email });
  if (!exists) return { success: true };

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const origin = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${origin}/reset-password` },
  });
  if (linkError || !linkData) return { success: true };

  const resend = getResendClient();
  const { subject, html } = passwordResetEmail(dict, linkData.properties.action_link);
  await resend.emails.send({ from: EMAIL_FROM, to: email, subject, html }).catch((err) => {
    console.error("Failed to send password reset email:", err);
  });

  return { success: true };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const store = await cookies();
  store.delete("lang");
  store.delete(ACCOUNT_COOKIE);
  redirect("/login");
}
