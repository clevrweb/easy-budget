import { Resend } from "resend";

export function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY!);
}

export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL || "Easy Budget <onboarding@resend.dev>";
