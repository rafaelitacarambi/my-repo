import { PrismaClient } from '@prisma/client';
import { DEFAULT_TEMPLATES } from './src/services/templates/defaultTemplates.js';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting database template sync for ALL templates...");
    
    const templatesToUpdate = [
        { tipo: 'LocacaoResidencial', content: DEFAULT_TEMPLATES.LocacaoResidencial, name: 'Template Padrão Locação Residencial', cat: 'LOCACAO' },
        { tipo: 'LocacaoComercial', content: DEFAULT_TEMPLATES.LocacaoComercial, name: 'Template Padrão Locação Comercial', cat: 'LOCACAO' },
        { tipo: 'CompraEVenda', content: DEFAULT_TEMPLATES.CompraEVenda, name: 'Template Padrão Compra e Venda', cat: 'VENDA' },
        { tipo: 'CompraEVendaResidencial', content: DEFAULT_TEMPLATES.CompraEVendaResidencial, name: 'Template Padrão Compra e Venda Residencial', cat: 'VENDA' },
        { tipo: 'CompraEVendaComercial', content: DEFAULT_TEMPLATES.CompraEVendaComercial, name: 'Template Padrão Compra e Venda Comercial', cat: 'VENDA' },
        { tipo: 'EntregaChaves', content: DEFAULT_TEMPLATES.EntregaChaves, name: 'Termo Padrão Entrega de Chaves', cat: 'OUTROS' },
        { tipo: 'DevolucaoChaves', content: DEFAULT_TEMPLATES.DevolucaoChaves, name: 'Termo Padrão Devolução de Chaves', cat: 'LOCACAO' },
        { tipo: 'VistoriaEntrada', content: DEFAULT_TEMPLATES.VistoriaEntrada, name: 'Template Padrão Vistoria de Entrada', cat: 'LOCACAO' },
        { tipo: 'VistoriaSaida', content: DEFAULT_TEMPLATES.VistoriaSaida, name: 'Template Padrão Vistoria de Saída', cat: 'LOCACAO' },
        { tipo: 'EntregaChavesVenda', content: DEFAULT_TEMPLATES.EntregaChavesVenda, name: 'Termo Padrão Entrega de Chaves (Venda)', cat: 'VENDA' }
    ];

    for (const t of templatesToUpdate) {
        console.log(`Syncing ${t.tipo}...`);
        
        // Update all active templates with this tipoOperacao
        const result = await prisma.contractTemplate.updateMany({
            where: {
                tipoOperacao: t.tipo,
                ativo: true
            },
            data: {
                conteudoHtml: t.content
            }
        });
        
        console.log(`Updated ${result.count} active templates for ${t.tipo}`);
        
        // Also check if any template with this tipoOperacao exists at all (active or not)
        const totalCount = await prisma.contractTemplate.count({
            where: { tipoOperacao: t.tipo }
        });
        
        if (totalCount === 0) {
            console.log(`No templates found for ${t.tipo}, seeding a new one...`);
            await prisma.contractTemplate.create({
                data: {
                    nome: t.name,
                    categoria: t.cat,
                    tipoOperacao: t.tipo,
                    conteudoHtml: t.content,
                    ativo: true,
                    versao: 1
                }
            });
            console.log(`Seeded new template for ${t.tipo}`);
        }
    }
    
    console.log("Database template sync complete!");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
