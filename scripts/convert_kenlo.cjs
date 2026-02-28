
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(process.cwd(), 'kenlo.xlsx');
const outputPath = path.join(process.cwd(), 'kenlo_import.json');

try {
    console.log('Lendo planilha...');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Encontrados ${jsonData.length} linhas.`);

    const mappedItems = jsonData.map(row => {
        // Helper to parse currency
        const parseVal = (v) => {
            if (typeof v === 'number') return v;
            if (!v) return 0;
            return parseFloat(String(v).replace('R$', '').trim()) || 0;
        };

        // Construct Title
        const tipo = row['Tipo'] || 'Imóvel';
        const bairro = row['Bairro'] || '';
        const cidade = row['Cidade'] || '';
        const title = `${tipo} - ${bairro} - ${cidade}`.replace(' -  -', ' -').trim();

        return {
            // IDs
            codigoReference: row['Referência'],

            // Basic Info
            resumoImovel: title,
            descricaoAnuncio: `Imóvel ${tipo} localizado em ${bairro}, ${cidade}.`, // Placeholder description

            // Type/Status
            tipoImovel: row['Tipo'],
            finalidade: row['Finalidade'],
            statusImovel: row['Status'] || 'Ativo',

            // Values
            precoVenda: parseVal(row['R$ Venda']),
            precoLocacao: parseVal(row['R$ Locação']),
            valorCondominio: parseVal(row['R$ Cond.']),
            valorIPTU: parseVal(row['R$ Iptu']),

            // Address
            enderecoRua: row['Endereço'],
            enderecoBairro: row['Bairro'],
            enderecoCidade: row['Cidade'],
            enderecoComplemento: row['Compl.'],

            // Specs
            quartos: Number(row['Dormitórios'] || 0),
            suites: Number(row['Suítes'] || 0),
            vagas: Number(row['Vagas'] || 0),
            areaUtil: Number(row['Área'] || 0),
            areaTotal: Number(row['Área total'] || 0),

            // Internal
            midiaOrigem: 'Importação Excel',
            corretorResponsavel: row['Captador(es)'],
            proprietarioNome: row['Promotor(es)'] // Maybe? Or leave blank.
        };
    });

    fs.writeFileSync(outputPath, JSON.stringify(mappedItems, null, 2));
    console.log(`Arquivo JSON gerado com sucesso: ${outputPath}`);
    console.log(`Total de imóveis: ${mappedItems.length}`);

} catch (error) {
    console.error('Erro na conversão:', error);
}
