import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// Conversão inteligente de texto de PDF para HTML com layout justificado e parágrafos elegantes
function formatTextToHtml(text: string, title: string): string {
    if (!text) return '';
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Separar por parágrafos (linhas vazias duplas ou triplas)
    const paragraphs = cleanText.split(/\n\n+/);
    
    const formattedParagraphs = paragraphs
        .map(p => {
            const trimmed = p.trim();
            if (!trimmed) return '';
            
            // Quebras de linha simples internas viram quebras normais (<br/>)
            const body = trimmed.replace(/\n/g, '<br/>');
            
            // Estilizar parágrafo justificado para impressão premium de contratos
            return `<p style="margin-bottom: 16px; line-height: 1.6; text-align: justify; font-size: 14px; font-family: 'Inter', sans-serif; color: #1e293b;">${body}</p>`;
        })
        .filter(p => p !== '');

    return `
    <div style="max-width: 800px; margin: 0 auto; padding: 40px; background-color: #ffffff; color: #1e293b; font-family: 'Inter', sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://static.wixstatic.com/media/9b23b4_8b5ff4d697054133a09457af0365ebeb~mv2.png" alt="R.Sales Imóveis" style="height: 60px; margin-bottom: 15px;"/>
            <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; text-transform: uppercase; margin: 0; letter-spacing: 0.5px;">${title}</h1>
        </div>
        <div style="margin-top: 20px;">
            ${formattedParagraphs.join('\n')}
        </div>
    </div>
    `;
}

export const GET: APIRoute = async () => {
    const importResults: any[] = [];
    const errors: any[] = [];

    try {
        // Importar dinamicamente pdf-parse
        let PDFParse: any;
        let pdfParseModule: any;
        try {
            pdfParseModule = await import('pdf-parse');
            PDFParse = pdfParseModule.PDFParse || pdfParseModule.default?.PDFParse || pdfParseModule.default;
        } catch (err: any) {
            console.error('Erro ao importar pdf-parse:', err);
            return new Response(JSON.stringify({ 
                error: 'Biblioteca pdf-parse não está disponível', 
                detail: err.message 
            }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        const baseDir = path.join(process.cwd(), 'Modelos');
        const locacaoDir = path.join(baseDir, 'Locação');
        const vendaDir = path.join(baseDir, 'Venda');

        // Mapeamentos para categoria Locação (excluindo os massivos PDFs de vistoria que possuem fotos e tabelas)
        const locacaoConfigs = [
            { filename: 'Caução.pdf', nome: 'Locação Residencial - Garantia Caução', tipoOperacao: 'LocacaoResidencialCaucao', subtipo: 'Residencial', garantia: 'CAUCAO' },
            { filename: 'Fiador.pdf', nome: 'Locação Residencial - Garantia Fiador', tipoOperacao: 'LocacaoResidencialFiador', subtipo: 'Residencial', garantia: 'FIADOR' },
            { filename: 'Seguro fiança.pdf', nome: 'Locação Residencial - Seguro Fiança', tipoOperacao: 'LocacaoResidencialSeguro', subtipo: 'Residencial', garantia: 'SEGURO' },
            { filename: 'Procuração.pdf', nome: 'Procuração de Administração de Locação', tipoOperacao: 'ProcuracaoLocacao', subtipo: 'Administracao', garantia: null },
            { filename: 'Termo de Recisão.pdf', nome: 'Termo de Rescisão de Contrato de Locação', tipoOperacao: 'TermoRescisaoLocacao', subtipo: 'Locacao', garantia: null },
            { filename: 'Termo_Entrega_Provisoria_Chaves.pdf', nome: 'Termo de Devolução de Chaves (Provisória)', tipoOperacao: 'DevolucaoChaves', subtipo: 'Locacao', garantia: null },
            { filename: 'Termo de devolução de chaves.pdf', nome: 'Termo de Devolução de Chaves (Definitiva)', tipoOperacao: 'TermoDevolucaoChavesVistoriaSaida', subtipo: 'Locacao', garantia: null }
        ];

        // Mapeamentos para categoria Venda
        const vendaConfigs = [
            { filename: 'Financiamento.pdf', nome: 'Compromisso de Compra e Venda - Financiamento Bancário', tipoOperacao: 'VendaFinanciamento', subtipo: 'Venda', garantia: null },
            { filename: 'À vista.pdf', nome: 'Compromisso de Compra e Venda - Pagamento à Vista', tipoOperacao: 'VendaAVista', subtipo: 'Venda', garantia: null },
            { filename: 'Termo de entrega de chaves de vendas.pdf', nome: 'Termo de Entrega de Chaves (Venda)', tipoOperacao: 'EntregaChavesVenda', subtipo: 'Venda', garantia: null }
        ];

        // 1. Processar e Importar Locação
        if (fs.existsSync(locacaoDir)) {
            const files = fs.readdirSync(locacaoDir);
            for (const file of files) {
                const config = locacaoConfigs.find(c => c.filename.toLowerCase() === file.toLowerCase());
                if (!config) continue;

                const filePath = path.join(locacaoDir, file);
                try {
                    const dataBuffer = fs.readFileSync(filePath);
                    
                    // Extrair texto usando o PDFParse
                    let extractedText = '';
                    try {
                        const parser = new PDFParse({ data: dataBuffer });
                        const parseResult = await parser.getText();
                        extractedText = parseResult.text || '';
                        await parser.destroy();
                    } catch (parseErr: any) {
                        // Backup em caso de erro na instância do parser
                        const data = await pdfParseModule(dataBuffer);
                        extractedText = data.text || '';
                    }

                    if (!extractedText) {
                        errors.push({ file, error: 'Texto extraído do PDF está vazio' });
                        continue;
                    }

                    // Formatando texto em HTML Premium
                    const htmlContent = formatTextToHtml(extractedText, config.nome);

                    // Detectar variáveis automáticas
                    const variablesFound = htmlContent.match(/\{\{([^}]+)\}\}/g) || [];
                    const uniqueVariables = [...new Set(variablesFound.map(v => v.replace(/[{}]/g, '').trim()))];

                    // Upsert no Prisma PostgreSQL
                    const existing = await prisma.contractTemplate.findFirst({
                        where: { tipoOperacao: config.tipoOperacao, ativo: true }
                    });

                    if (existing) {
                        await prisma.contractTemplate.update({
                            where: { id: existing.id },
                            data: {
                                nome: config.nome,
                                categoria: 'LOCACAO',
                                subtipo: config.subtipo,
                                garantia: config.garantia,
                                conteudoHtml: htmlContent,
                                variaveisDetectadas: uniqueVariables
                            }
                        });
                        importResults.push({ file, action: 'UPDATED', id: existing.id });
                    } else {
                        const created = await prisma.contractTemplate.create({
                            data: {
                                nome: config.nome,
                                categoria: 'LOCACAO',
                                tipoOperacao: config.tipoOperacao,
                                subtipo: config.subtipo,
                                garantia: config.garantia,
                                conteudoHtml: htmlContent,
                                variaveisDetectadas: uniqueVariables,
                                ativo: true,
                                versao: 1
                            }
                        });
                        importResults.push({ file, action: 'CREATED', id: created.id });
                    }

                } catch (fileErr: any) {
                    console.error(`Erro ao processar ${file}:`, fileErr);
                    errors.push({ file, error: fileErr.message || fileErr });
                }
            }
        }

        // 2. Processar e Importar Venda
        if (fs.existsSync(vendaDir)) {
            const files = fs.readdirSync(vendaDir);
            for (const file of files) {
                const config = vendaConfigs.find(c => c.filename.toLowerCase() === file.toLowerCase());
                if (!config) continue;

                const filePath = path.join(vendaDir, file);
                try {
                    const dataBuffer = fs.readFileSync(filePath);
                    
                    let extractedText = '';
                    try {
                        const parser = new PDFParse({ data: dataBuffer });
                        const parseResult = await parser.getText();
                        extractedText = parseResult.text || '';
                        await parser.destroy();
                    } catch (parseErr: any) {
                        const data = await pdfParseModule(dataBuffer);
                        extractedText = data.text || '';
                    }

                    if (!extractedText) {
                        errors.push({ file, error: 'Texto extraído do PDF está vazio' });
                        continue;
                    }

                    const htmlContent = formatTextToHtml(extractedText, config.nome);
                    const variablesFound = htmlContent.match(/\{\{([^}]+)\}\}/g) || [];
                    const uniqueVariables = [...new Set(variablesFound.map(v => v.replace(/[{}]/g, '').trim()))];

                    const existing = await prisma.contractTemplate.findFirst({
                        where: { tipoOperacao: config.tipoOperacao, ativo: true }
                    });

                    if (existing) {
                        await prisma.contractTemplate.update({
                            where: { id: existing.id },
                            data: {
                                nome: config.nome,
                                categoria: 'VENDA',
                                subtipo: config.subtipo,
                                garantia: config.garantia,
                                conteudoHtml: htmlContent,
                                variaveisDetectadas: uniqueVariables
                            }
                        });
                        importResults.push({ file, action: 'UPDATED', id: existing.id });
                    } else {
                        const created = await prisma.contractTemplate.create({
                            data: {
                                nome: config.nome,
                                categoria: 'VENDA',
                                tipoOperacao: config.tipoOperacao,
                                subtipo: config.subtipo,
                                garantia: config.garantia,
                                conteudoHtml: htmlContent,
                                variaveisDetectadas: uniqueVariables,
                                ativo: true,
                                versao: 1
                            }
                        });
                        importResults.push({ file, action: 'CREATED', id: created.id });
                    }

                } catch (fileErr: any) {
                    console.error(`Erro ao processar ${file}:`, fileErr);
                    errors.push({ file, error: fileErr.message || fileErr });
                }
            }
        }

        return new Response(JSON.stringify({ 
            success: true, 
            importedCount: importResults.length,
            items: importResults, 
            errors 
        }), { 
            status: 200, 
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
            } 
        });

    } catch (globalErr: any) {
        console.error('Erro global no importador:', globalErr);
        return new Response(JSON.stringify({ 
            error: 'Erro global ao processar importação', 
            message: globalErr.message || globalErr 
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};
