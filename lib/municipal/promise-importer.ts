import { createClient } from "@supabase/supabase-js";

/**
 * Importer for municipal election promises (Kuntavaalikone 2021).
 */

/**
 * Parses raw CSV content and maps it to the database.
 * This is a generic importer that can be adapted to specific CSV structures.
 */
export async function importMunicipalPromises(csvContent: string) {
  console.log("--- Starting Municipal Promise Import ---");
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const lines = csvContent.split("\n");
  const headers = lines[0].split(",");
  
  const results = {
    imported: 0,
    errors: 0,
    matched: 0
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",");
    
    // Example mapping - this needs to be matched against the actual CSV columns
    // Assuming: 0: Name, 1: Municipality, 2: Party, 3+: Questions
    const fullName = values[0]?.replace(/"/g, '').trim();
    const municipality = values[1]?.replace(/"/g, '').trim();
    const party = values[2]?.replace(/"/g, '').trim();

    if (!fullName || !municipality) continue;

    const answers: Record<string, any> = {};
    for (let h = 3; h < headers.length; h++) {
      const header = headers[h].replace(/"/g, '').trim();
      const value = values[h]?.replace(/"/g, '').trim();
      if (value) answers[header] = value;
    }

    try {
      const { data, error } = await supabase
        .from("municipal_councilor_profiles")
        .upsert({
          full_name: fullName,
          municipality: municipality,
          party: party,
          raw_promises: answers,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'full_name,municipality' 
        })
        .select()
        .single();

      if (error) throw error;
      
      results.imported++;
      results.matched++;
    } catch (err: any) {
      console.error(`Failed to import councilor ${fullName}:`, err.message);
      results.errors++;
    }
  }

  console.log("--- Import Complete ---");
  console.log(JSON.stringify(results, null, 2));
  
  return results;
}

