import { getUser } from "@/app/actions/auth";
import DashboardClient from "./DashboardClient";
import Navbar from "@/components/Navbar";

export default async function DashboardPage() {
  const user = await getUser();

  return (
    <div className="min-h-screen bg-nordic-white">
      <Navbar user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <DashboardClient initialUser={user} />
      </main>
    </div>
  );
}

