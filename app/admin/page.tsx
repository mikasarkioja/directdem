import { requireAdmin } from "@/app/actions/admin";
import AdminDashboard from "@/components/AdminDashboard";

export default async function AdminPage() {
  await requireAdmin({ nextAfterLogin: "/admin" });

  return <AdminDashboard />;
}
