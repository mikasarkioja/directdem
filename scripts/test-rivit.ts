import axios from 'axios';

async function testRivit() {
    const url = 'https://avoindata.eduskunta.fi/api/v1/vaski/taulu/SaliPuhe/rivit?perPage=1&page=0';
    try {
        const res = await axios.get(url, { timeout: 5000 });
        console.log('✅ Success Rivit');
        console.log(res.data);
    } catch (e: any) {
        console.log(`❌ Fail Rivit: ${e.response?.status || e.message}`);
    }
}

testRivit();

