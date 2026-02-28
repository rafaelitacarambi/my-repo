
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

// Specify the file path
const filePath = path.join(process.cwd(), 'kenlo.xlsx');

try {
    console.log(`Lendo arquivo: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        console.error('Arquivo NÃO encontrado!');
        process.exit(1);
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON (header: 1 means array of arrays)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Print first 5 rows to see structure
    console.log('--- HEADERS (Linha 1) ---');
    console.log(jsonData[0]);

    console.log('--- EXEMPLO DE DADOS (Linha 2) ---');
    console.log(jsonData[1]);

} catch (error) {
    console.error("Erro ao ler excel:", error);
}
