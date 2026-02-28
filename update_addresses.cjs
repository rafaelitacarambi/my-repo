const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Configurações
const EXCEL_FILE = 'kenlo.xlsx';
const REFERENCE_FILE = path.join('public', 'active_reference.json');
const IMPORT_FILE = 'final_complete_import.json';

/**
 * Função para extrair Logradouro e Número de uma string de endereço.
 */
function parseAddress(addressStr) {
    if (!addressStr) return { logradouro: '', numero: '' };
    let cleanAddr = addressStr.trim();
    const parts = cleanAddr.split(/,?\s*n[º°º]\s*|,/i);
    if (parts.length >= 2) {
        const logradouro = parts[0].trim();
        const numero = parts[1].trim();
        return { logradouro, numero };
    }
    const match = cleanAddr.match(/(.*?)\s+(\d+[a-zA-Z]?|S\/N)$/i);
    if (match) {
        return { logradouro: match[1].trim(), numero: match[2].trim() };
    }
    return { logradouro: cleanAddr, numero: '' };
}

async function run() {
    console.log('--- Iniciando processamento de endereços e captadores ---');

    if (!fs.existsSync(EXCEL_FILE)) {
        console.error(`Erro: Arquivo ${EXCEL_FILE} não encontrado.`);
        return;
    }

    const workbook = XLSX.readFile(EXCEL_FILE);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelData = XLSX.utils.sheet_to_json(sheet);

    console.log(`Lidas ${excelData.length} linhas da planilha.`);

    // Mapa de dados da planilha indexado pelo Código (Referência)
    const excelMap = new Map();
    excelData.forEach(row => {
        const codigo = row['Referência'];
        if (codigo) {
            const addressInfo = parseAddress(row['Endereço']);
            excelMap.set(codigo.toString().trim().toUpperCase(), {
                logradouro: addressInfo.logradouro,
                numero: addressInfo.numero,
                complemento: row['Compl.'] || '',
                bairro: row['Bairro'] || '',
                cidade: row['Cidade'] || '',
                estado: 'SP',
                captador: row['Captador(es)'] || '',
                dormitorios: row['Dormitórios'] || 0,
                suites: row['Suítes'] || 0,
                vagas: row['Vagas'] || 0,
                areaTerreno: row['Área total'] || 0,
                areaConstruida: row['Área'] || 0
            });
        }
    });

    // Atualizar JSONs
    const filesToUpdate = [REFERENCE_FILE, IMPORT_FILE];

    for (const filePath of filesToUpdate) {
        if (!fs.existsSync(filePath)) {
            console.warn(`Aviso: Arquivo ${filePath} não encontrado, pulando...`);
            continue;
        }

        console.log(`Processando ${filePath}...`);
        const rawData = fs.readFileSync(filePath, 'utf8');
        let items = JSON.parse(rawData);
        let updatedCount = 0;

        items = items.map(item => {
            const codigo = (item.codigoReference || item.codImovel || '').toString().trim().toUpperCase();
            const excelInfo = excelMap.get(codigo);

            if (excelInfo) {
                updatedCount++;
                return {
                    ...item,
                    logradouro: excelInfo.logradouro || item.logradouro,
                    numero: excelInfo.numero || item.numero,
                    enderecoRua: excelInfo.logradouro ? `${excelInfo.logradouro}${excelInfo.numero ? ', nº ' + excelInfo.numero : ''}` : item.enderecoRua,
                    enderecoComplemento: excelInfo.complemento || item.enderecoComplemento || '',
                    complemento: excelInfo.complemento || item.complemento || '',
                    enderecoBairro: excelInfo.bairro || item.enderecoBairro || '',
                    bairro: excelInfo.bairro || item.bairro || '',
                    enderecoCidade: excelInfo.cidade || item.enderecoCidade || '',
                    cidade: excelInfo.cidade || item.cidade || '',
                    enderecoEstado: excelInfo.estado || item.enderecoEstado || 'SP',
                    estado: excelInfo.estado || item.estado || 'SP',
                    corretorResponsavel: excelInfo.captador || item.corretorResponsavel || '',
                    dormitorios: excelInfo.dormitorios || item.dormitorios || 0,
                    quartos: excelInfo.dormitorios || item.quartos || 0,
                    suites: excelInfo.suites || item.suites || 0,
                    vagas: excelInfo.vagas || item.vagas || 0,
                    vagasCobertas: excelInfo.vagas || item.vagasCobertas || 0,
                    areaTerreno: excelInfo.areaTerreno || item.areaTerreno || 0,
                    areaTotal: excelInfo.areaTerreno || item.areaTotal || 0,
                    areaConstruida: excelInfo.areaConstruida || item.areaConstruida || 0,
                    areaUtil: excelInfo.areaConstruida || item.areaUtil || 0
                };
            }
            return item;
        });

        fs.writeFileSync(filePath, JSON.stringify(items, null, 2));
        console.log(`Concluído: ${updatedCount} itens atualizados em ${filePath}.`);
    }

    console.log('--- Processamento finalizado ---');
}

run().catch(console.error);
