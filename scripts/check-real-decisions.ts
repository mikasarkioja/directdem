import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkRealDecisions() {
  const { data } = await supabase.from("meeting_analysis").select("*").eq("municipality", "Espoo").ilike("meeting_title", "%§%");
  console.log(`Found ${data?.length || 0} real agenda items (with § in title).`);
  
  if (data && data.length > 0) {
    data.slice(0, 3).forEach(d => {
      console.log(`- Title: ${d.meeting_title}`);
      console.log(`- Mentioned: ${d.ai_summary.mentioned_councilors?.join(", ")}`);
    });
  }
}

checkRealDecisions();

