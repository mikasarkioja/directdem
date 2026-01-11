import axios from 'axios';

async function searchHarkimo() {
    const url = 'https://avoindata.eduskunta.fi/api/v1/tables/VaskiData/rows?perPage=5&page=0&columnName=XmlData&columnValue=Harkimo';
    try {
        const res = await axios.get(url, { timeout: 15000 });
        console.log('✅ Success search Harkimo');
        console.log(res.data.rowData);
    } catch (e: any) {
        console.log(`❌ Fail: ${e.message}`);
    }
}

searchHarkimo();

