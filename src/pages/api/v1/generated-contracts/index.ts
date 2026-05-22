import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const leadId = url.searchParams.get('leadId');
        
        const whereCl = leadId ? { leadId: String(leadId) } : {};
        const contracts = await prisma.generatedContract.findMany({
            where: whereCl,
            include: { template: true },
            orderBy: { createdAt: 'desc' },
        });

        // Normalize generated contracts to have _id
        const mappedContracts = contracts.map(c => ({
            ...c,
            _id: c.id,
            template: c.template ? { ...c.template, _id: c.template.id } : null
        }));

        return new Response(JSON.stringify({ items: mappedContracts, total: mappedContracts.length }), { 
            status: 200, 
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
            } 
        });
    } catch (error) {
        console.error('Error fetching generated contracts:', error);
        return new Response(JSON.stringify({ error: 'Erro ao buscar contratos' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();
        const newContract = await prisma.generatedContract.create({
            data: {
                leadId: data.leadId,
                templateId: data.templateId,
                nomeDocumento: data.nomeDocumento,
                conteudoFinalHtml: data.conteudoFinalHtml,
                status: data.status || 'GERADO',
            },
        });
        
        // Normalize response to include _id
        const mapped = { ...newContract, _id: newContract.id };
        return new Response(JSON.stringify(mapped), { status: 201, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('Error creating generated contract:', error);
        return new Response(JSON.stringify({ error: 'Erro ao criar contrato' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
