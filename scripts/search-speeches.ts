import axios from 'axios';

async function searchSpeeches() {
    const filter = encodeURIComponent('Puheenvuoro');
    const url = `https://avoindata.eduskunta.fi/api/v1/vaski/asiakirjatyyppinimi?perPage=5&page=0&filter=${filter}`;
    try {
        console.log(`Searching for ${url}...`);
        const res = await axios.get(url, { timeout: 10000 });
        console.log(`✅ Success`);
        console.log('Columns:', res.data.columnNames);
        console.log('Sample Row:', res.data.rowData?.[0]);
    } catch (e: any) {
        console.log(`❌ Fail: ${e.message}`);
    }
}

searchSpeeches();

