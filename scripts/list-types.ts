import axios from 'axios';

async function listTypes() {
    const url = `https://avoindata.eduskunta.fi/api/v1/vaski/asiakirjatyyppinimi?perPage=100&page=0&filter=Henkilö`;
    try {
        const res = await axios.get(url, { timeout: 10000 });
        const typeIndex = res.data.columnNames.indexOf('AsiakirjatyyppiNimi');
        const types = res.data.rowData.map((r: any) => r[typeIndex]);
        console.log('Available Types:', types);
    } catch (e: any) {
        console.log(`❌ Fail: ${e.message}`);
    }
}

listTypes();

