import axios from 'axios';

async function fetchHarkimo() {
    // Harkimo's ID 1140
    // We try to find documents where he is the speaker
    // Or just fetch latest plenary minutes and parse them
    const url = 'https://avoindata.eduskunta.fi/api/v1/vaski/asiakirjatyyppinimi?perPage=10&page=0&filter=Pöytäkirja';
    try {
        const res = await axios.get(url, { timeout: 10000 });
        const rows = res.data.rowData;
        console.log(`Found ${rows.length} minutes.`);
        
        for (const row of rows) {
            const id = row[0];
            const title = row[3];
            console.log(`Minute: ${id} - ${title}`);
            // Fetch content from VaskiData
            const dataUrl = `https://avoindata.eduskunta.fi/api/v1/tables/VaskiData/rows?columnName=Id&columnValue=${id}`;
            const dataRes = await axios.get(dataUrl);
            const xml = dataRes.data.rowData?.[0]?.[1]; // XmlData column
            if (xml && xml.includes('Harkimo')) {
                console.log(`✅ FOUND Harkimo in minute ${id}`);
                // Here we would parse the XML to extract the speech
            }
        }
    } catch (e: any) {
        console.log(`❌ Error: ${e.message}`);
    }
}

fetchHarkimo();

