import { syncTransparencyRegister } from "../lib/researcher/transparency-fetcher";

async function runSync() {
  await syncTransparencyRegister();
}

runSync();

