import type { Dict } from "./types";

interface SupabaseAuthErrorLike {
  message: string;
  code?: string;
}

export function translateAuthError(dict: Dict, error: SupabaseAuthErrorLike): string {
  const t = dict.auth;
  switch (error.code) {
    case "invalid_credentials":
      return t.errorInvalidCredentials;
    case "user_already_exists":
    case "email_exists":
      return t.errorUserExists;
    case "email_not_confirmed":
      return t.errorEmailNotConfirmed;
    case "weak_password":
      return t.errorWeakPassword;
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return t.errorRateLimit;
    default:
      return t.errorGeneric;
  }
}
