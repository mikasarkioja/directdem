"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkAdminAccess } from "@/app/actions/admin";
import { getResendClient } from "@/lib/resend";
import { generateWeeklyReportEmailPayload } from "@/lib/bulletin/generator";

const emailSchema = z.string().trim().email("Virheellinen sähköpostiosoite");

export type NewsletterSubscriber = {
  id: string;
  email: string;
  created_at: string;
  is_active: boolean;
};

export async function getNewsletterSubscribers(): Promise<
  NewsletterSubscriber[]
> {
  const isAdmin = await checkAdminAccess();
  if (!isAdmin) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("id, email, created_at, is_active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[newsletter] fetch subscribers failed:", error.message);
    throw new Error("Tilaajien haku epäonnistui");
  }

  return (data ?? []) as NewsletterSubscriber[];
}

export async function addNewsletterSubscriber(emailInput: string): Promise<{
  success: boolean;
  message: string;
}> {
  const isAdmin = await checkAdminAccess();
  if (!isAdmin)
    return { success: false, message: "Ei oikeuksia tähän toimintoon" };

  const parsed = emailSchema.safeParse(emailInput);
  if (!parsed.success)
    return { success: false, message: parsed.error.issues[0].message };

  const supabase = await createClient();
  const email = parsed.data.toLowerCase();

  const { error } = await supabase.from("newsletter_subscribers").insert({
    email,
    is_active: true,
  });

  if (error) {
    console.error("[newsletter] add subscriber failed:", error.message);
    if (error.code === "23505") {
      return { success: false, message: "Virhe: Sähköposti on jo listalla" };
    }
    return { success: false, message: "Tilaajan lisäys epäonnistui" };
  }

  revalidatePath("/admin/subscribers");
  return { success: true, message: "Sähköposti lisätty" };
}

export async function deleteNewsletterSubscriber(id: string): Promise<{
  success: boolean;
  message: string;
}> {
  const isAdmin = await checkAdminAccess();
  if (!isAdmin)
    return { success: false, message: "Ei oikeuksia tähän toimintoon" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[newsletter] delete subscriber failed:", error.message);
    return { success: false, message: "Tilaajan poisto epäonnistui" };
  }

  revalidatePath("/admin/subscribers");
  return { success: true, message: "Tilaaja poistettu" };
}

export async function sendTestBulletin(emailInput: string): Promise<{
  success: boolean;
  message: string;
}> {
  const isAdmin = await checkAdminAccess();
  if (!isAdmin)
    return { success: false, message: "Ei oikeuksia tähän toimintoon" };

  const parsed = emailSchema.safeParse(emailInput);
  if (!parsed.success)
    return { success: false, message: parsed.error.issues[0].message };

  try {
    const payload = await generateWeeklyReportEmailPayload();
    const resend = getResendClient();
    const fromEmail =
      process.env.RESEND_FROM_EMAIL ?? "noreply@eduskuntavahti.fi";

    await resend.emails.send({
      from: fromEmail,
      to: parsed.data.toLowerCase(),
      subject: `[TESTI] DirectDem viikkobulletiini - ${payload.issueDate}`,
      html: payload.html,
    });

    return { success: true, message: "Testiviesti lähetetty onnistuneesti" };
  } catch (error: any) {
    console.error(
      "[newsletter] send test bulletin failed:",
      error?.message ?? error,
    );
    return { success: false, message: "Testiviestin lähetys epäonnistui" };
  }
}
