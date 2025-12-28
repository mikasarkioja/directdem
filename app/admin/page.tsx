import { requireAdmin } from "@/app/actions/admin";
import AdminDashboard from "@/components/AdminDashboard";

export default async function AdminPage() {
  // Check admin access - redirects if not admin
  await requireAdmin();

  return <AdminDashboard />;
}

