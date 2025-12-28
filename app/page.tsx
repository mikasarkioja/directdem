import Dashboard from "@/components/Dashboard";
import { getUser } from "@/app/actions/auth";

export default async function Home() {
  const user = await getUser();
  return <Dashboard user={user} />;
}


