import axios from 'axios';

async function findTable() {
    const tables = ['Edustaja', 'Kansanedustaja', 'Puhemies', 'Valiokunta', 'Istunto'];
    for (const table of tables) {
        try {
            const url = `https://avoindata.eduskunta.fi/api/v1/tables/${table}/rows?perPage=1&page=0`;
            console.log(`Trying ${table}...`);
            const res = await axios.get(url, { timeout: 5000 });
            console.log(`✅ Success: ${table}`);
            console.log('Columns:', res.data.columnNames);
            return;
        } catch (e: any) {
            console.log(`❌ Fail: ${table} (${e.response?.status || e.message})`);
        }
    }
}

findTable();

