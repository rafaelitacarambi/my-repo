const fs = require('fs');
const path = require('path');

// Paths
const KENLO_PATH = path.join(__dirname, '../kenlo_import.json');
const SCRAPED_PATH = path.join(__dirname, '../scraped.json');
const OUTPUT_PATH = path.join(__dirname, '../final_complete_import.json');
console.log('📂 Output Path:', OUTPUT_PATH);

function normalizeRef(ref) {
    if (!ref) return '';
    return ref.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function extractRefFromUrl(url) {
    if (!url) return '';
    // Look for patterns like /AP0154-TFNM or /TE0026
    const match = url.match(/\/([A-Z]{2}\d{4})[-_]/i) || url.match(/\/([A-Z]{2}\d{4})$/i);
    if (match) return match[1].toUpperCase();

    // Fallback: look for generic ID at end
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    const cleanId = lastPart.split('-')[0]; // AP0123-TFNM -> AP0123
    if (cleanId.match(/^[A-Z]{2}\d+/)) return cleanId.toUpperCase();

    return '';
}

// Helper to extract data from description text
function extractFromDescription(text) {
    if (!text) return {};
    const info = {};
    const lowerText = text.toLowerCase();

    // --- QUANTITIES ---
    const dormsMatch = text.match(/(\d+)\s*(dorm|quarto|qt)/i);
    if (dormsMatch) info.quartos = parseInt(dormsMatch[1], 10);

    const suitesMatch = text.match(/(\d+)\s*su[ií]te/i);
    if (suitesMatch) info.suites = parseInt(suitesMatch[1], 10);

    const vagasMatch = text.match(/(\d+)\s*vaga/i);
    if (vagasMatch) info.vagas = parseInt(vagasMatch[1], 10);

    const wcMatch = text.match(/(\d+)\s*(banheiro|wc|bwc)/i);
    if (wcMatch) info.banheiros = parseInt(wcMatch[1], 10);

    const areaMatch = text.match(/(?:área|útil|privativa).*?(\d+)[.,]?\d*\s*(?:m²|mts|metros)/i) ||
        text.match(/(\d+)[.,]?\d*\s*m²/i);
    if (areaMatch) info.areaUtil = parseInt(areaMatch[1].replace('.', ''), 10);

    // --- VALUES ---
    // Helper to parse currency string "R$ 1.200,00" -> 1200
    const parseMoney = (str) => {
        if (!str) return 0;
        // Handle "350 mil"
        if (str.toLowerCase().includes('mil')) {
            const num = parseFloat(str.replace(/[^0-9,.]/g, '').replace(',', '.'));
            return num * 1000;
        }
        // Standard "1.200,00"
        return parseFloat(str.replace(/[^0-9,]/g, '').replace(',', '.'));
    };

    // Venda: "venda por R$ X", "valor R$ X" (avoiding condomínio/iptu lines)
    // Negative lookbehind not always supported in JS regex depending on version, generic matching is safer
    const vendaMatch = text.match(/(?:venda|valor|preço).*?R\$\s*([\d.,]+(?:\s*mil)?)/i);
    if (vendaMatch && !vendaMatch[0].toLowerCase().includes('condomínio') && !vendaMatch[0].toLowerCase().includes('iptu')) {
        info.valorVenda = parseMoney(vendaMatch[1]);
    }

    // Condomínio
    const condMatch = text.match(/(?:condomínio|cond\.|mensal).*?R\$\s*([\d.,]+)/i);
    if (condMatch) info.valorCondominio = parseMoney(condMatch[1]);

    // IPTU
    const iptuMatch = text.match(/(?:iptu).*?R\$\s*([\d.,]+)/i);
    if (iptuMatch) info.valorIPTU = parseMoney(iptuMatch[1]);


    // --- ADDRESS ---
    // Look for street types followed by Capitalized Words
    const streetMatch = text.match(/(?:Rua|Av\.|Avenida|Alameda|Travessa|Estrada|Rodovia)\s+([A-ZÀ-Ú][\w\s]+?)(?:,|\snº|\s-|\s\d)/);
    if (streetMatch) {
        // Use capture group 1 for the name, but we want the prefix "Rua" too maybe?
        // Actually, let's just clean the full match.
        // streetMatch[0] is "Rua Name," or "Rua Name nº"
        // We want "Rua Name"
        let fullStreet = streetMatch[0].trim();
        // Remove trailing separators
        fullStreet = fullStreet.replace(/[,.-]$/, '').replace(/\snº$/, '').trim();

        info.logradouro = fullStreet;

        // Try to find number near the street match
        const numberMatch = text.substring(streetMatch.index).match(/n[º°]\s*(\d+)/i) || text.substring(streetMatch.index).match(/,\s*(\d+)/);
        if (numberMatch) {
            info.numero = numberMatch[1];
        }
    }


    // --- AMENITIES (Keywords -> Boolean Fields) ---
    const check = (regex) => regex.test(lowerText);

    if (check(/churrasqueira/)) info.churrasqueira = true;
    if (check(/varanda gourmet|espaço gourmet/)) info.varandaGourmet = true;
    if (check(/piscina/)) {
        // Simple heuristic: if it says "condomínio" nearby, maybe it's shared, but for now map to general piscina
        // The Imveis interface has piscina (private) and piscinaCondominio (shared)
        // If text says "lazer completo" or "piscina no condomínio", assume shared
        if (check(/piscina.*condomínio|condomínio.*piscina|lazer completo/)) {
            info.piscinaCondominio = true;
        } else {
            info.piscina = true; // Private or unspecified
        }
    }
    if (check(/sauna/)) info.sauna = true;
    if (check(/salão de festas|salao de festas/)) info.salaoFestas = true;
    if (check(/salão de jogos|salao de jogos/)) info.salaoJogos = true;
    if (check(/academia|fitness|ginástica/)) info.academia = true;
    if (check(/playground|parquinho|play/)) info.playground = true;
    if (check(/quadra/)) info.quadraPoliesportiva = true;
    if (check(/elevador/)) info.elevador = true;
    if (check(/portaria 24|segurança 24/)) info.portaria24h = true;
    if (check(/ar condicionado|ar-condicionado|climatiz/)) info.arCondicionado = true;
    if (check(/mobiliado|mobilia/)) info.mobiliado = true;
    if (check(/escritório|home office/)) info.escritorio = true;
    if (check(/closet/)) info.closet = true;
    if (check(/hidro|banheira/)) info.suiteHidro = true; // or banheira
    if (check(/quintal/)) info.quintal = true;
    if (check(/jardim/)) info.jardim = true;
    if (check(/lavanderia|área de serviço/)) info.lavanderia = true;
    if (check(/edícula/)) info.edicula = true;
    if (check(/gás encanado|aquecimento a gás/)) info.aquecimentoGas = true;

    return info;
}

function valueOrFallback(original, extracted) {
    // Force usage of extracted value if it exists and is a valid number
    // This trusts the Description more than the existing excel data for these fields
    if (extracted && !isNaN(extracted) && extracted > 0) return extracted;
    return original;
}

function main() {
    console.log('🚀 Iniciando fusão de dados (Merge)...');

    if (!fs.existsSync(KENLO_PATH)) {
        console.error('❌ Arquivo kenlo_import.json não encontrado!');
        return;
    }
    if (!fs.existsSync(SCRAPED_PATH)) {
        console.error('❌ Arquivo scraped.json não encontrado!');
        return;
    }

    let kenloData, scrapedData;

    try {
        console.log('📖 Lendo arquivo Kenlo...');
        kenloData = JSON.parse(fs.readFileSync(KENLO_PATH, 'utf8'));
        console.log('✅ Kenlo OK.');

        console.log('📖 Lendo arquivo Scraped...');
        let scrapedContent = fs.readFileSync(SCRAPED_PATH, 'utf8').trim();

        // Sanitize: Remove trailing empty array [] if present (common user paste error)
        scrapedContent = scrapedContent.replace(/\[\s*\]\s*$/, '');

        // Sanitize: Remove matched garbage after the last ]
        const lastBracket = scrapedContent.lastIndexOf(']');
        if (lastBracket !== -1 && lastBracket < scrapedContent.length - 1) {
            console.warn('⚠️ Detectado lixo após o JSON. Corrigindo...');
            scrapedContent = scrapedContent.substring(0, lastBracket + 1);
        }

        scrapedData = JSON.parse(scrapedContent);
        console.log('✅ Scraped OK.');
    } catch (e) {
        console.error('❌ Erro ao ler/parsear arquivos JSON:', e.message);
        return;
    }

    console.log(`📊 Dados Kenlo (Excel): ${kenloData.length} imóveis.`);
    console.log(`📊 Dados Scraping (Web): ${scrapedData.length} imóveis.`);

    let mergedCount = 0;
    let photoEnrichedCount = 0;
    let infoExtractedCount = 0;

    const mergedData = kenloData.map(kItem => {
        let finalItem = { ...kItem };
        const kRef = normalizeRef(kItem.codigoReference);

        // 1. Find Match in Scraped Data
        let match = scrapedData.find(sItem => {
            // A. Try direct reference match if scraper got it
            if (sItem.codigoReference && normalizeRef(sItem.codigoReference) === kRef) return true;

            // B. Try extracting reference from URL
            const urlRef = extractRefFromUrl(sItem.propertyUrl);
            if (urlRef && normalizeRef(urlRef) === kRef) return true;

            // C. Fuzzy Fallback: Price + Area (within 5% margin) + Type
            if (kItem.precoVenda && sItem.precoVenda) {
                const priceDiff = Math.abs(kItem.precoVenda - sItem.price);
                const areaDiff = Math.abs((kItem.areaUtil || 0) - (sItem.areaUtil || 0));
                if (priceDiff === 0 && areaDiff < 5) return true; // Very strict strict match
            }

            return false;
        });

        if (match) {
            mergedCount++;
            // Enrich Data

            // Description (Prefer scraped, it's usually formatted better from HTML)
            if (match.descricaoAnuncio && match.descricaoAnuncio.length > (finalItem.descricaoAnuncio?.length || 0)) {
                finalItem.descricaoAnuncio = match.descricaoAnuncio;
            }

            // Photos (The Gold Mine!)
            if (match.galeriaFotos && Array.isArray(match.galeriaFotos) && match.galeriaFotos.length > 0) {
                finalItem.galeriaFotos = match.galeriaFotos;
                photoEnrichedCount++;
            }

            // Cover Image (If Kenlo doesn't have one or Scraped is better)
            if (!finalItem.propertyImages && match.propertyImages) {
                finalItem.propertyImages = match.propertyImages;
            }

        } else {
            console.log(`⚠️ Sem Match: [${kRef}] - ${kItem.resumoImovel}`);
        }

        // 2. Extractions (Regex Power!)
        // Try extract info from description if fields are missing
        if (finalItem.descricaoAnuncio) {
            const extracted = extractFromDescription(finalItem.descricaoAnuncio);

            const oldQuartos = finalItem.quartos;
            finalItem.quartos = valueOrFallback(finalItem.quartos, extracted.quartos);
            finalItem.suites = valueOrFallback(finalItem.suites, extracted.suites);
            finalItem.vagas = valueOrFallback(finalItem.vagas, extracted.vagas);
            finalItem.banheiros = valueOrFallback(finalItem.banheiros, extracted.banheiros);
            finalItem.areaUtil = valueOrFallback(finalItem.areaUtil, extracted.areaUtil);

            // Address Enhancement (If missing or generic)
            if (extracted.logradouro && (!finalItem.enderecoRua || finalItem.enderecoRua.includes('nº 0'))) {
                const currentCity = finalItem.enderecoCidade || '';
                const currentNb = finalItem.enderecoBairro || '';
                // Construct full address string compatible with existing format
                finalItem.enderecoRua = `${extracted.logradouro}, nº ${extracted.numero || 'S/N'}`;
            }

            // Value Enhancement (If 0)
            if (!finalItem.precoVenda && extracted.valorVenda) finalItem.precoVenda = extracted.valorVenda;
            if (!finalItem.precoLocacao && extracted.valorLocacao) finalItem.precoLocacao = extracted.valorLocacao;
            if (!finalItem.valorCondominio && extracted.valorCondominio) finalItem.valorCondominio = extracted.valorCondominio;
            if (!finalItem.valorIPTU && extracted.valorIPTU) finalItem.valorIPTU = extracted.valorIPTU;

            // Amenities (Checklist)
            // Iterate over extracted booleans and set them if they are true
            Object.keys(extracted).forEach(key => {
                if (typeof extracted[key] === 'boolean' && extracted[key] === true) {
                    // Start of Amenities mapping to Imveis interface key
                    // Note: The Imveis interface keys match the extracted keys (e.g. churrasqueira, piscina)
                    finalItem[key] = true;
                }
            });

            if (finalItem.quartos !== oldQuartos) infoExtractedCount++;
        }

        return finalItem;
    });

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mergedData, null, 2));
    console.log('------------------------------------------------');
    console.log(`🎉 Fusão Concluída!`);
    console.log(`📁 Arquivo gerado: final_complete_import.json`);
    console.log(`🔗 Total Processado: ${kenloData.length}`);
    console.log(`🤝 Total Combinado: ${mergedCount}`);
    console.log(`📸 Imóveis enriquecidos com fotos: ${photoEnrichedCount}`);
    console.log(`🧠 Imóveis enriquecidos via IA (Regex): ${infoExtractedCount}`);
}

main();
