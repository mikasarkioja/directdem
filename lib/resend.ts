import {
  Resend,
  type CreateEmailOptions,
  type CreateEmailRequestOptions,
} from "resend";

/**
 * Initialize Resend client for sending emails
 * Requires RESEND_API_KEY environment variable
 */
export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY environment variable is not set. Please add it to your .env.local file.",
    );
  }

  return new Resend(apiKey);
}

/**
 * `From` address for Resend. In production, set RESEND_FROM_EMAIL to an address
 * on a domain you verified in Resend (DNS). Unverified domains return HTTP 403
 * from the API — we surface that in `sendResendEmail`.
 *
 * For local/dev testing without DNS: set `RESEND_FORCE_SANDBOX=true` in `.env.local`
 * (or leave `RESEND_FROM_EMAIL` unset in development) to use `onboarding@resend.dev`.
 * With that sender, Resend only delivers to allowed test recipients (see resend.com).
 */
export function getResendFromEmail(): string {
  const forceSandbox =
    process.env.RESEND_FORCE_SANDBOX === "1" ||
    process.env.RESEND_FORCE_SANDBOX === "true";

  if (forceSandbox) {
    return "Omatase <onboarding@resend.dev>";
  }

  const explicit = process.env.RESEND_FROM_EMAIL?.trim();
  if (explicit) return explicit;

  if (process.env.NODE_ENV === "production") {
    return "Omatase <noreply@sentri.fi>";
  }

  return "Omatase <onboarding@resend.dev>";
}

/**
 * Resend's Node SDK returns `{ data, error }` and does not throw on API errors.
 * Always use this helper so failures are visible in logs and error handling.
 */
export async function sendResendEmail(
  payload: CreateEmailOptions,
  options?: CreateEmailRequestOptions,
): Promise<{ id: string }> {
  const resend = getResendClient();
  const { data, error } = await resend.emails.send(payload, options);
  if (error) {
    let hint = "";
    if (/not verified|domain is not verified/i.test(error.message)) {
      hint =
        " Verify the domain in the Resend dashboard, or set RESEND_FORCE_SANDBOX=true for local testing with onboarding@resend.dev.";
    }
    throw new Error(
      `Resend (${error.name}): ${error.message}` +
        (error.statusCode != null ? ` [HTTP ${error.statusCode}]` : "") +
        hint,
    );
  }
  if (!data?.id) {
    throw new Error("Resend returned no error but missing data.id");
  }
  return { id: data.id };
}
