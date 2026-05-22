import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { BaseCrudService } from '@/integrations';

export const GET: APIRoute = async () => {
    try {
        const pgTemplates = await prisma.contractTemplate.findMany();
        const pgList = pgTemplates.map(t => ({
            db: 'PostgreSQL',
            id: t.id,
            nome: t.nome,
            categoria: t.categoria,
            tipoOperacao: t.tipoOperacao,
            ativo: t.ativo,
            length: t.conteudoHtml?.length || 0,
            snippet: t.conteudoHtml ? t.conteudoHtml.substring(0, 150) + '...' : ''
        }));

        let idbList: any[] = [];
        try {
            const res = await BaseCrudService.getAll<any>('templatescontratos');
            idbList = res.items.map(t => {
                const content = t.templateBody || t.templateContent || t.conteudoHtml || '';
                return {
                    db: 'IndexedDB',
                    id: t._id,
                    nome: t.templateName || t.nome,
                    tipoOperacao: t.contractType,
                    ativo: t.isActive,
                    length: content.length,
                    snippet: content ? content.substring(0, 150) + '...' : ''
                };
            });
        } catch (err: any) {
            console.error('IndexedDB fetch error:', err);
        }

        return new Response(JSON.stringify({ pgList, idbList }, null, 2), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
            }
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
