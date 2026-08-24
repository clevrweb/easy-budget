import type { Dict } from "@/lib/i18n/types";

function baseLayout(heading: string, body: string, buttonLabel: string, buttonHref: string, footer: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 0 32px;text-align:center;">
                <div style="display:inline-flex;align-items:center;gap:8px;">
                  <span style="font-size:20px;font-weight:700;color:#0f172a;">Budget Whisperer</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px 32px;">
                <h1 style="margin:0;font-size:20px;font-weight:600;color:#0f172a;">${heading}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px 32px;">
                <p style="margin:0;font-size:14px;line-height:1.6;color:#475569;">${body}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px 32px;">
                <a href="${buttonHref}" style="display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">${buttonLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 32px 32px;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:12px;color:#94a3b8;">${footer}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function inviteNewUserEmail(dict: Dict, inviterName: string, actionLink: string) {
  const t = dict.email;
  return {
    subject: t.inviteNewSubject.replace("{name}", inviterName),
    html: baseLayout(t.inviteHeading, t.inviteNewBody.replace("{name}", inviterName), t.inviteNewButton, actionLink, t.footer),
  };
}

export function inviteExistingUserEmail(dict: Dict, inviterName: string, loginLink: string) {
  const t = dict.email;
  return {
    subject: t.inviteExistingSubject.replace("{name}", inviterName),
    html: baseLayout(t.inviteHeading, t.inviteExistingBody.replace("{name}", inviterName), t.inviteExistingButton, loginLink, t.footer),
  };
}

export function passwordResetEmail(dict: Dict, actionLink: string) {
  const t = dict.email;
  return {
    subject: t.passwordResetSubject,
    html: baseLayout(t.passwordResetHeading, t.passwordResetBody, t.passwordResetButton, actionLink, t.footer),
  };
}

export function billReminderEmail(dict: Dict, body: string, dashboardLink: string) {
  const t = dict.email;
  return {
    subject: t.billReminderSubject,
    html: baseLayout(t.billReminderHeading, body, t.billReminderButton, dashboardLink, t.footer),
  };
}
