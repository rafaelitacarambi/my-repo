import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const GET: APIRoute = async () => {
    try {
        const templates = await prisma.contractTemplate.findMany();
        const details = templates.map(t => ({
            id: t.id,
            nome: t.nome,
            tipoOperacao: t.tipoOperacao,
            length: t.conteudoHtml?.length || 0,
            content: t.conteudoHtml
        }));
        return new Response(JSON.stringify(details, null, 2), {
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
