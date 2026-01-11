import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkMentions() {
  const { data } = await supabase.from("meeting_analysis").select("ai_summary");
  if (!data) return;

  const mentions = data.filter((d: any) => d.ai_summary.mentioned_councilors && d.ai_summary.mentioned_councilors.length > 0);
  console.log(`Found ${mentions.length} decisions with mentioned councilors.`);
  
  mentions.slice(0, 5).forEach((m: any) => {
    console.log(`- ${m.ai_summary.mentioned_councilors.join(", ")}`);
  });
}

checkMentions();

