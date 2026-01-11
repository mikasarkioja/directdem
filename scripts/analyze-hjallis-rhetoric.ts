import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { analyzeHarkimoRhetoric, generateExampleHarkimoResponses } from "../lib/ai/rhetoric-analyzer";

async function runAnalysis() {
  try {
    const profile = await analyzeHarkimoRhetoric();
    if (profile) {
      console.log("-----------------------------------------");
      console.log("RHETORIC PROFILE CREATED:");
      console.log("Style:", profile.linguistic_style);
      console.log("Themes:", profile.recurring_themes.join(", "));
      console.log("-----------------------------------------");

      console.log("\n🚀 Generoidaan esimerkkivastaukset verotuksesta...");
      const responses = await generateExampleHarkimoResponses("Mitä mieltä olet verotuksesta ja sen tasosta Suomessa?");
      
      console.log("\nESIMERKKIVASTAUKSET:");
      responses.forEach((r: string, i: number) => console.log(`${i+1}. "${r}"`));
    }
  } catch (error: any) {
    console.error("💥 Error:", error.message);
  }
}

runAnalysis();

