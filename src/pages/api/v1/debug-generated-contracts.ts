import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { BaseCrudService } from '@/integrations';

export const GET: APIRoute = async () => {
    try {
        const pgGenerated = await prisma.generatedContract.findMany({
            include: { template: true },
            orderBy: { createdAt: 'desc' }
        });
        const pgList = pgGenerated.map(c => ({
            db: 'PostgreSQL',
            id: c.id,
            nomeDocumento: c.nomeDocumento,
            templateName: c.template?.nome,
            status: c.status,
            length: c.conteudoFinalHtml?.length || 0,
            snippet: c.conteudoFinalHtml ? c.conteudoFinalHtml.substring(0, 300) + '...' : '',
            hasBases: c.conteudoFinalHtml?.includes('BASES CONTRATUAIS') || false,
            createdAt: c.createdAt
        }));

        let idbList: any[] = [];
        try {
            const res = await BaseCrudService.getAll<any>('contratos');
            idbList = res.items.map(c => {
                const content = c.htmlFinal || '';
                return {
                    db: 'IndexedDB',
                    id: c._id,
                    contractType: c.contractType,
                    status: c.status,
                    length: content.length,
                    snippet: content ? content.substring(0, 300) + '...' : '',
                    hasBases: content.includes('BASES CONTRATUAIS') || false,
                    createdAt: c.createdAt || c.dataHora
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
