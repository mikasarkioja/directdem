import Dashboard from "@/components/Dashboard";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import FirstTimeGDPR from "@/components/FirstTimeGDPR";
import { getUser } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Server-side user fetch using Next.js 15 cookies()
  // This ensures user data is available immediately without flash
  let user = null;
  try {
    user = await getUser();
  } catch (error) {
    // Log error but don't crash the page
    // In production, this might be a Supabase connection issue
    console.error("[Home] Failed to get user:", error);
    // Continue with user = null (unauthenticated state)
  }
  
  return (
    <div className="min-h-screen bg-nordic-white">
      <Navbar user={user} />
      {user && <FirstTimeGDPR userId={user.id} />}
      <Dashboard user={user} />
    </div>
  );
}


