import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Harry Harkimo's official Eduskunta ID is 1140
const HARKIMO_ID = '1140';
const YEAR = '2025';

// Try the user's original URL structure if the table one fails
const API_URL = `https://avoindata.eduskunta.fi/api/v1/data/SaliPuheenvuoro`;

async function fetchSpeeches() {
    console.log(`🚀 Haetaan Harry Harkimon (ID: ${HARKIMO_ID}) puheet vuodelta ${YEAR}...`);
    
    try {
        const response = await axios.get(API_URL, {
            params: {
                filter: `PuhujaHenkiloId eq ${HARKIMO_ID}`,
                // vuosi is not always a column, let's just get latest
            }
        });

        if (!response.data || !response.data.rowData) {
            console.error("❌ Rajapinta ei palauttanut dataa.");
            return;
        }

        const columnNames = response.data.columnNames || [];
        const rowData = response.data.rowData || [];

        // Etsitään sarakkeiden indeksit
        const mpIdIndex = columnNames.indexOf("PuhujaHenkiloId");
        const dateIndex = columnNames.indexOf("PuhevuoroPaivamaara");
        const contentIndex = columnNames.indexOf("SisaltoTeksti");
        const subjectIndex = columnNames.indexOf("AiheTeksti");
        const sessionIndex = columnNames.indexOf("IstuntoNumero");

        const filteredSpeeches = rowData
            .filter((row: any) => row[mpIdIndex] === HARKIMO_ID)
            .map((row: any) => ({
                date: row[dateIndex],
                subject: row[subjectIndex] || "Ei aihetta",
                content: row[contentIndex] || "",
                session: row[sessionIndex]
            }));

        const outputPath = `./data/harkimo_speeches_${YEAR}.json`;
        
        // Varmistetaan että data-kansio on olemassa
        if (!fs.existsSync('./data')) {
            fs.mkdirSync('./data');
        }

        fs.writeFileSync(outputPath, JSON.stringify(filteredSpeeches, null, 2));
        
        console.log(`✅ Valmis! Löydetty ${filteredSpeeches.length} puhetta.`);
        console.log(`📂 Tallennettu tiedostoon: ${outputPath}`);
        
        if (filteredSpeeches.length === 0) {
            console.log("💡 Huomio: Jos puheita ei löytynyt, edustaja ei ehkä ole vielä pitänyt puheita vuonna 2025 tai API-sivu 0 ei sisältänyt niitä.");
        }
    } catch (error: any) {
        console.error("❌ Virhe haettaessa puheita:", error.message);
    }
}

fetchSpeeches();

