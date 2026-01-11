import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { runMunicipalBridge } from "../lib/municipal/bridge";

async function testBridge() {
  console.log("🚀 Testing Municipal Bridge...");
  try {
    const results = await runMunicipalBridge();
    console.log("--- Sample Results ---");
    results.slice(0, 3).forEach((d, i) => {
      console.log(`${i+1}. [${d.municipality}] ${d.title}`);
      if (d.mappedCouncilors) {
        console.log(`   🔗 Linked to: ${d.mappedCouncilors.join(", ")}`);
      }
    });
  } catch (err) {
    console.error("Bridge Test Failed", err);
  }
}

testBridge();

