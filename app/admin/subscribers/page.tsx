import { requireAdmin } from "@/app/actions/admin";
import { getNewsletterSubscribers } from "@/app/actions/newsletter-subscribers";
import SubscribersManager from "@/components/admin/SubscribersManager";
import { createClient } from "@/lib/supabase/server";

export default async function AdminSubscribersPage() {
  await requireAdmin({ nextAfterLogin: "/admin/subscribers" });
  const subscribers = await getNewsletterSubscribers();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <SubscribersManager
      initialSubscribers={subscribers}
      defaultTestEmail={user?.email ?? ""}
    />
  );
}
