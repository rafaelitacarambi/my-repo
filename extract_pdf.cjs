const { PDFParse } = require('pdf-parse');
const fs = require('fs');

const filePath = 'C:\\Users\\gabri\\Desktop\\Sistema R.Sales Google\\Assinado_Contrato_Locacao_Marcia_Manoel_Tatiane_Novo.pdf';

(async () => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        // Correct way according to cli.mjs
        const parser = new PDFParse({ data: dataBuffer });

        const result = await parser.getText();
        fs.writeFileSync('extracted_contract.txt', result.text);

        await parser.destroy();
        console.log('Text extracted successfully to extracted_contract.txt');
    } catch (e) {
        console.error('Error extracting PDF:', e);
        process.exit(1);
    }
})();
