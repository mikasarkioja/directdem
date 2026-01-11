import axios from 'axios';

async function diagnose() {
    const urls = [
        'https://avoindata.eduskunta.fi/api/v1/tables',
        'https://avoindata.eduskunta.fi/api/v1/vaski/asiakirjatyypit',
        'https://avoindata.eduskunta.fi/api/v1/vaski/asiakirjatyyppinimi?perPage=5&page=0'
    ];

    for (const url of urls) {
        try {
            console.log(`Checking ${url}...`);
            const res = await axios.get(url, { timeout: 10000 });
            console.log(`✅ Success: ${url}`);
            if (url.includes('asiakirjatyyppinimi')) {
                console.log('Columns:', res.data.columnNames);
                console.log('Sample Row:', res.data.rowData?.[0]);
            } else {
                console.log('Sample Data:', JSON.stringify(res.data, null, 2).substring(0, 500));
            }
        } catch (e: any) {
            console.log(`❌ Fail: ${url} (${e.response?.status || e.message})`);
        }
    }
}

diagnose();

