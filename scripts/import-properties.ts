/**
 * Script de Importação de Imóveis
 * 
 * Este script:
 * 1. Lê uma planilha Excel/CSV com dados dos imóveis
 * 2. Faz scraping das páginas para extrair fotos
 * 3. Faz upload das imagens
 * 4. Cadastra os imóveis no sistema
 * 
 * Uso: npm run import-properties -- --file caminho/para/planilha.xlsx
 */

import * as XLSX from 'xlsx';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';

const streamPipeline = promisify(pipeline);

// ==================== CONFIGURAÇÃO ====================

interface PropertyData {
    codigo: string;
    link?: string;
    titulo?: string;
    descricao?: string;
    endereco?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    tipo?: string;
    finalidade?: string;
    valor?: number;
    area?: number;
    quartos?: number;
    banheiros?: number;
    vagas?: number;
    // Adicione outros campos conforme sua planilha
}

interface ScrapedImages {
    codigo: string;
    images: string[];
}

// ==================== FUNÇÕES DE LEITURA ====================

/**
 * Lê a planilha e retorna array de dados
 */
function readSpreadsheet(filePath: string): PropertyData[] {
    console.log(`📖 Lendo planilha: ${filePath}`);

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const data: PropertyData[] = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✅ ${data.length} imóveis encontrados na planilha`);
    return data;
}

// ==================== WEB SCRAPING ====================

/**
 * Extrai URLs de imagens de uma página de imóvel
 * ADAPTE ESTA FUNÇÃO PARA O SITE ESPECÍFICO
 */
async function scrapePropertyImages(url: string, codigo: string): Promise<string[]> {
    try {
        console.log(`🔍 Scraping imagens do imóvel ${codigo}: ${url}`);

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const images: string[] = [];

        // EXEMPLO 1: Seletor genérico para galeria de imagens
        // ADAPTE ESTES SELETORES PARA O SITE REAL
        $('img[data-gallery], .property-gallery img, .carousel img').each((i, elem) => {
            const src = $(elem).attr('src') || $(elem).attr('data-src');
            if (src && !src.includes('placeholder') && !src.includes('logo')) {
                // Converte URL relativa para absoluta
                const absoluteUrl = new URL(src, url).href;
                images.push(absoluteUrl);
            }
        });

        // EXEMPLO 2: Buscar em atributos data-*
        $('[data-image-url]').each((i, elem) => {
            const imageUrl = $(elem).attr('data-image-url');
            if (imageUrl) {
                images.push(new URL(imageUrl, url).href);
            }
        });

        // Remove duplicatas
        const uniqueImages = [...new Set(images)];

        console.log(`  ✅ ${uniqueImages.length} imagens encontradas`);
        return uniqueImages;

    } catch (error) {
        console.error(`  ❌ Erro ao fazer scraping de ${codigo}:`, error.message);
        return [];
    }
}

/**
 * Faz scraping de todos os imóveis
 */
async function scrapeAllProperties(properties: PropertyData[]): Promise<ScrapedImages[]> {
    console.log(`\n🌐 Iniciando scraping de ${properties.length} imóveis...\n`);

    const results: ScrapedImages[] = [];

    for (let i = 0; i < properties.length; i++) {
        const property = properties[i];

        // Construir URL se não estiver na planilha
        const url = property.link || `https://site-exemplo.com.br/imovel/${property.codigo}`;

        const images = await scrapePropertyImages(url, property.codigo);
        results.push({
            codigo: property.codigo,
            images
        });

        // Delay para não sobrecarregar o servidor
        if (i < properties.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    return results;
}

// ==================== DOWNLOAD DE IMAGENS ====================

/**
 * Faz download de uma imagem
 */
async function downloadImage(url: string, outputPath: string): Promise<void> {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });

    await streamPipeline(response.data, fs.createWriteStream(outputPath));
}

/**
 * Faz download de todas as imagens de um imóvel
 */
async function downloadPropertyImages(
    codigo: string,
    imageUrls: string[],
    baseDir: string
): Promise<string[]> {
    const propertyDir = path.join(baseDir, codigo);

    // Criar diretório do imóvel
    if (!fs.existsSync(propertyDir)) {
        fs.mkdirSync(propertyDir, { recursive: true });
    }

    const downloadedPaths: string[] = [];

    for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
        const filename = `${i + 1}${ext}`;
        const outputPath = path.join(propertyDir, filename);

        try {
            await downloadImage(imageUrl, outputPath);
            downloadedPaths.push(outputPath);
            console.log(`  ✅ Baixada: ${filename}`);
        } catch (error) {
            console.error(`  ❌ Erro ao baixar ${filename}:`, error.message);
        }
    }

    return downloadedPaths;
}

// ==================== UPLOAD PARA WIX ====================

/**
 * Faz upload de imagem para Wix Media
 * ADAPTE PARA SUA INTEGRAÇÃO ESPECÍFICA
 */
async function uploadToWixMedia(filePath: string): Promise<string> {
    // TODO: Implementar upload para Wix Media Manager
    // Documentação: https://dev.wix.com/docs/rest/api-reference/wix-media/media-manager

    console.log(`  📤 Upload para Wix: ${path.basename(filePath)}`);

    // Exemplo de estrutura (adapte conforme sua integração)
    /*
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    const response = await axios.post(
      'https://www.wixapis.com/v1/media-manager/files',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WIX_API_KEY}`,
          ...formData.getHeaders()
        }
      }
    );
    
    return response.data.file.url;
    */

    // Por enquanto, retorna caminho local
    return filePath;
}

// ==================== CADASTRO NO SISTEMA ====================

/**
 * Cadastra imóvel no sistema via API
 */
async function createProperty(propertyData: PropertyData, imageUrls: string[]): Promise<void> {
    console.log(`💾 Cadastrando imóvel ${propertyData.codigo}...`);

    try {
        // TODO: Adapte para sua API
        const response = await axios.post('http://localhost:3000/api/imoveis', {
            codigo: propertyData.codigo,
            titulo: propertyData.titulo,
            descricao: propertyData.descricao,
            endereco: propertyData.endereco,
            bairro: propertyData.bairro,
            cidade: propertyData.cidade,
            estado: propertyData.estado,
            cep: propertyData.cep,
            tipo: propertyData.tipo,
            finalidade: propertyData.finalidade,
            valor: propertyData.valor,
            area: propertyData.area,
            quartos: propertyData.quartos,
            banheiros: propertyData.banheiros,
            vagas: propertyData.vagas,
            fotos: imageUrls
        });

        console.log(`  ✅ Imóvel ${propertyData.codigo} cadastrado com sucesso!`);
    } catch (error) {
        console.error(`  ❌ Erro ao cadastrar ${propertyData.codigo}:`, error.message);
    }
}

// ==================== FUNÇÃO PRINCIPAL ====================

async function main() {
    console.log('🚀 Iniciando importação de imóveis...\n');

    // 1. Ler argumentos
    const args = process.argv.slice(2);
    const fileIndex = args.indexOf('--file');
    const filePath = fileIndex !== -1 ? args[fileIndex + 1] : './imoveis.xlsx';

    if (!fs.existsSync(filePath)) {
        console.error(`❌ Arquivo não encontrado: ${filePath}`);
        process.exit(1);
    }

    // 2. Ler planilha
    const properties = readSpreadsheet(filePath);

    // 3. Fazer scraping das imagens
    const scrapedData = await scrapeAllProperties(properties);

    // 4. Download das imagens
    const downloadDir = './downloads/imoveis';
    console.log(`\n📥 Baixando imagens para: ${downloadDir}\n`);

    for (const { codigo, images } of scrapedData) {
        if (images.length > 0) {
            console.log(`📦 Baixando ${images.length} imagens do imóvel ${codigo}...`);
            await downloadPropertyImages(codigo, images, downloadDir);
        }
    }

    // 5. Upload e cadastro (opcional - descomente quando estiver pronto)
    /*
    console.log('\n📤 Fazendo upload e cadastrando imóveis...\n');
    
    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      const scraped = scrapedData.find(s => s.codigo === property.codigo);
      
      if (scraped && scraped.images.length > 0) {
        // Upload das imagens
        const uploadedUrls: string[] = [];
        const localPaths = fs.readdirSync(path.join(downloadDir, property.codigo))
          .map(f => path.join(downloadDir, property.codigo, f));
        
        for (const localPath of localPaths) {
          const url = await uploadToWixMedia(localPath);
          uploadedUrls.push(url);
        }
        
        // Cadastrar imóvel
        await createProperty(property, uploadedUrls);
      }
    }
    */

    console.log('\n✅ Importação concluída!');
    console.log(`📊 Resumo:`);
    console.log(`   - Imóveis processados: ${properties.length}`);
    console.log(`   - Total de imagens: ${scrapedData.reduce((sum, s) => sum + s.images.length, 0)}`);
}

// Executar
main().catch(console.error);
