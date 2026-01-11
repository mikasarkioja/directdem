import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { importMunicipalPromises } from "../lib/municipal/promise-importer";
import { profileAllPendingCouncilors } from "../lib/municipal/profiler";

const mockCsv = `Nimi,Kunta,Puolue,Q1:Talous,Q2:Arvot,Q3:Ympäristö
"Anni Sinnemäki","Helsinki","VIHR","Investointi","Liberaali","Suojelu"
"Juhana Vartiainen","Helsinki","KOK","Säästöt","Konservatiivi","Kasvu"
"Kai Mykkänen","Espoo","KOK","Säästöt","Konservatiivi","Kasvu"
"Antti Lindtman","Vantaa","SDP","Investointi","Liberaali","Suojelu"
`;

async function testLocalMatching() {
  console.log("🚀 Aloitetaan paikallinen kuntavaalimatch-testi...");
  
  // 1. Tuo data
  const importResult = await importMunicipalPromises(mockCsv);
  console.log(`✅ Tuotu ${importResult.imported} valtuutettua.`);

  // 2. Profiloi DNA
  console.log("🧠 Generoidaan DNA-sormenjäljet...");
  await profileAllPendingCouncilors();
  
  console.log("✨ Testi valmis!");
}

testLocalMatching();

