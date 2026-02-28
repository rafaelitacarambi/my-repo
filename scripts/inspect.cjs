
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(process.cwd(), 'kenlo.xlsx');
const outputPath = path.join(process.cwd(), 'inspection_result.txt');

try {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(outputPath, 'ERRO: Arquivo kenlo.xlsx nao encontrado');
        process.exit(1);
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Get JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const headers = jsonData[0];
    const sample = jsonData[1];

    const result = `
CS: ${sheetName}
HEADERS: ${JSON.stringify(headers)}
SAMPLE: ${JSON.stringify(sample)}
  `;

    fs.writeFileSync(outputPath, result);
    console.log('Inspection written to file.');

} catch (error) {
    fs.writeFileSync(outputPath, `ERRO: ${error.message}`);
}
