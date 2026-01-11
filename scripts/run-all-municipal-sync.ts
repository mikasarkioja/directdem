import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { syncAllMunicipalities } from "../lib/municipal/sync-engine";

async function run() {
  console.log("🚀 Starting All Municipalities decision sync...");
  await syncAllMunicipalities();
}

run();

