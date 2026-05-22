import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { DEFAULT_TEMPLATES } from '@/services/templates/defaultTemplates';

export const GET: APIRoute = async ({ request }) => {
    try {
        // Auto-fix and seed/sync ALL 5 standard templates from defaultTemplates into the Postgres DB
        const templateConfigs = [
            {
                tipoOperacao: 'LocacaoResidencial',
                nome: 'Template Padrão Locação Residencial',
                categoria: 'LOCACAO',
                conteudoHtml: DEFAULT_TEMPLATES.LocacaoResidencial
            },
            {
                tipoOperacao: 'LocacaoComercial',
                nome: 'Template Padrão Locação Comercial',
                categoria: 'LOCACAO',
                conteudoHtml: DEFAULT_TEMPLATES.LocacaoComercial
            },
            {
                tipoOperacao: 'CompraEVenda',
                nome: 'Template Padrão Compra e Venda',
                categoria: 'VENDA',
                conteudoHtml: DEFAULT_TEMPLATES.CompraEVenda
            },
            {
                tipoOperacao: 'EntregaChaves',
                nome: 'Termo Padrão Entrega de Chaves',
                categoria: 'OUTROS',
                conteudoHtml: DEFAULT_TEMPLATES.EntregaChaves
            },
            {
                tipoOperacao: 'AutorizacaoDivulgacao',
                nome: 'Autorização Padrão Divulgação Imóvel',
                categoria: 'OUTROS',
                conteudoHtml: DEFAULT_TEMPLATES.AutorizacaoDivulgacao
            }
        ];

        for (const config of templateConfigs) {
            const dbTemplate = await prisma.contractTemplate.findFirst({
                where: { tipoOperacao: config.tipoOperacao, ativo: true }
            });

            if (!dbTemplate) {
                console.log(`[AutoSeed] Creating default template for ${config.tipoOperacao}`);
                await prisma.contractTemplate.create({
                    data: {
                        nome: config.nome,
                        categoria: config.categoria,
                        tipoOperacao: config.tipoOperacao,
                        conteudoHtml: config.conteudoHtml,
                        ativo: true,
                        versao: 1
                    }
                });
            } else if (!dbTemplate.conteudoHtml.includes('CLÁUSULA') && !dbTemplate.conteudoHtml.includes('PRIMEIRA') || dbTemplate.conteudoHtml.length < 200) {
                console.log(`[AutoFix] Updating outdated/empty template for ${config.tipoOperacao}`);
                await prisma.contractTemplate.update({
                    where: { id: dbTemplate.id },
                    data: {
                        conteudoHtml: config.conteudoHtml,
                        nome: config.nome // Garante nome bonito e legível
                    }
                });
            }
        }

        const templates = await prisma.contractTemplate.findMany({
            where: { ativo: true },
            orderBy: { nome: 'asc' },
        });

        // Normalize template properties so they contain both id and _id (compatibility for front-end)
        const mappedTemplates = templates.map(t => ({
            ...t,
            _id: t.id
        }));

        return new Response(JSON.stringify({ items: mappedTemplates, total: mappedTemplates.length }), { 
            status: 200, 
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
            } 
        });
    } catch (error) {
        console.error('Error fetching templates:', error);
        return new Response(JSON.stringify({ error: 'Erro ao buscar templates' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();
        const newTemplate = await prisma.contractTemplate.create({
            data: {
                nome: data.nome,
                categoria: data.categoria,
                tipoOperacao: data.tipoOperacao,
                subtipo: data.subtipo,
                garantia: data.garantia,
                conteudoHtml: data.conteudoHtml,
                variaveisDetectadas: data.variaveisDetectadas || [],
                ativo: data.ativo ?? true,
            },
        });
        
        // Normalize response to include _id
        const mapped = { ...newTemplate, _id: newTemplate.id };
        return new Response(JSON.stringify(mapped), { status: 201, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('Error creating template:', error);
        return new Response(JSON.stringify({ error: 'Erro ao criar template' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
