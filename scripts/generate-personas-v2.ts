import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

interface MPPersona {
  name: string;
  party: string;
  promises: Record<string, string>; // Kysymys: Vastaus
  votes: Array<{ bill: string, vote: string, date: string }>;
  conflictPoints: string[]; // Automaattisesti tunnistetut ristiriidat
}

async function generateMPPersonas(electionCsvPath: string, votingJsonPath: string) {
  const personas: Record<string, MPPersona> = {};

  // Varmista että data-hakemisto on olemassa
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  console.log("Reading election CSV...");
  
  // 1. Lue vaalikonevastaukset
  fs.createReadStream(electionCsvPath)
    .pipe(csv())
    .on('data', (row: any) => {
      const name = row['Nimi'];
      if (!name) return;
      
      if (!personas[name]) {
        personas[name] = { 
          name, 
          party: row['Puolue'] || 'Tuntematon', 
          promises: {}, 
          votes: [], 
          conflictPoints: [] 
        };
      }
      // Lisätään kärkiteemat lupauksiin
      const question = row['Kysymys'];
      const answer = row['Vastaus'];
      if (question && answer) {
        personas[name].promises[question] = answer;
      }
    })
    .on('end', () => {
      console.log("Reading voting JSON...");
      // 2. Lue äänestysdata (oletetaan että linkitys nimen perusteella)
      try {
        const votingData = JSON.parse(fs.readFileSync(votingJsonPath, 'utf8'));
        
        votingData.forEach((voteRecord: any) => {
          if (personas[voteRecord.mpName]) {
            personas[voteRecord.mpName].votes.push({
              bill: voteRecord.billTitle,
              vote: voteRecord.vote,
              date: voteRecord.date
            });
          }
        });

        // 3. Tallenna rikastettu data
        fs.writeFileSync(path.join(dataDir, 'mp_personas.json'), JSON.stringify(personas, null, 2));
        console.log("Personas generated successfully to ./data/mp_personas.json!");
      } catch (e) {
        console.error("Error reading voting JSON:", e);
      }
    });
}

// Esimerkki suorituksesta jos skriptiä ajetaan suoraan
if (require.main === module) {
  const csvPath = process.argv[2] || './data/election_data.csv';
  const jsonPath = process.argv[3] || './data/voting_data.json';
  generateMPPersonas(csvPath, jsonPath);
}

