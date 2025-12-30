import Dashboard from "@/components/Dashboard";
import Navbar from "@/components/Navbar";
import { getUser } from "@/app/actions/auth";

export default async function Home() {
  // Server-side user fetch using Next.js 15 cookies()
  // This ensures user data is available immediately without flash
  const user = await getUser();
  
  return (
    <div className="min-h-screen bg-nordic-white">
      <Navbar user={user} />
      <Dashboard user={user} />
    </div>
  );
}


