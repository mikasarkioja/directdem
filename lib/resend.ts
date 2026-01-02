import { Resend } from "resend";

/**
 * Initialize Resend client for sending emails
 * Requires RESEND_API_KEY environment variable
 */
export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY environment variable is not set. Please add it to your .env.local file."
    );
  }

  return new Resend(apiKey);
}


