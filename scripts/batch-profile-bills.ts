import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runBatchProfiling() {
  console.log("--- Aloitetaan 20 uusimman lakiesityksen syväanalyysi ---");

  // Dynamically import to ensure env vars are loaded
  const { refreshEnhancedBillProfile } = await import("../app/actions/bill-ai");

  // 1. Hae 20 uusinta lakia
  const { data: bills, error } = await supabase
    .from("bills")
    .select("id, title")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !bills) {
    console.error("Virhe haettaessa lakiesityksiä:", error?.message);
    return;
  }

  console.log(`Löytyi ${bills.length} lakiesitystä prosessoitavaksi.`);

  for (const bill of bills) {
    try {
      console.log(`\nProsessoidaan: ${bill.title} (ID: ${bill.id})...`);
      const result = await refreshEnhancedBillProfile(bill.id);
      
      if (result.success) {
        console.log(`✅ Valmis! Kitka-indeksi: ${result.forecast.friction_index}/100`);
      } else {
        console.error(`❌ Virhe: ${result.error}`);
      }
      
      // Pieni viive API-rajoitusten välttämiseksi
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err: any) {
      console.error(`❌ Kriittinen virhe laille ${bill.id}:`, err.message);
    }
  }

  console.log("\n--- Eräajo suoritettu loppuun! ---");
}

runBatchProfiling();

