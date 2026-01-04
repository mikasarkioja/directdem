import Dashboard from "@/components/Dashboard";
import Navbar from "@/components/Navbar";
import { getUser } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function BillsPage() {
  let user = null;
  try {
    user = await getUser();
  } catch (error) {
    console.error("[BillsPage] Failed to get user:", error);
  }
  
  return (
    <div className="min-h-screen bg-nordic-white">
      <Navbar user={user} />
      <Dashboard user={user} initialView="bills" />
    </div>
  );
}

