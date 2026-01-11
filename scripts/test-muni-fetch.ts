import { fetchLatestHelsinkiIssues } from "../lib/municipal/helsinki-client";
import { fetchLatestVantaaIssues } from "../lib/municipal/vantaa-client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function test() {
  console.log("--- Testing Helsinki ---");
  const h = await fetchLatestHelsinkiIssues(5);
  console.log("Helsinki issues found:", h.length);
  if (h.length > 0) console.log("First:", h[0].subject);

  console.log("\n--- Testing Vantaa ---");
  const v = await fetchLatestVantaaIssues(5);
  console.log("Vantaa issues found:", v.length);
  if (v.length > 0) console.log("First:", v[0].subject);
}

test();

