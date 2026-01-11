import axios from 'axios';

async function testSaliPuhe() {
    try {
        const url = 'https://avoindata.eduskunta.fi/api/v1/tables/Puheenvuorot/rows?perPage=1&page=0';
        const res = await axios.get(url, {
            headers: { 'Accept': 'application/json' },
            timeout: 10000
        });
        console.log('✅ Success SaliPuhe');
        console.log(res.data);
    } catch (e: any) {
        console.log(`❌ Fail SaliPuhe: ${e.response?.status || e.message}`);
        console.log('Response Body:', e.response?.data);
    }
}

testSaliPuhe();

