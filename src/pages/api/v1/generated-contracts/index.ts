import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const leadId = url.searchParams.get('leadId');
        const propertyId = url.searchParams.get('propertyId');
        
        let whereCl: any = {};
        if (leadId) {
            whereCl.leadId = String(leadId);
        }
        if (propertyId) {
            whereCl.propertyId = String(propertyId);
        }

        const contracts = await prisma.generatedContract.findMany({
            where: whereCl,
            include: { 
                template: true,
                signers: true,
                histories: true,
                lead: true,
                property: true
            },
            orderBy: { createdAt: 'desc' },
        });

        // Normalize generated contracts to have _id
        const mappedContracts = contracts.map(c => ({
            ...c,
            _id: c.id,
            template: c.template ? { ...c.template, _id: c.template.id } : null,
            signers: c.signers.map(s => ({ ...s, _id: s.id })),
            histories: c.histories.map(h => ({ ...h, _id: h.id }))
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
                propertyId: data.propertyId,
                templateId: data.templateId,
                nomeDocumento: data.nomeDocumento,
                conteudoFinalHtml: data.conteudoFinalHtml,
                status: data.status || 'GERADO',
                signers: data.signers && data.signers.length > 0 ? {
                    create: data.signers.map((s: any) => ({
                        name: s.name,
                        email: s.email,
                        phone: s.phone || null,
                        cpf: s.cpf,
                        role: s.role,
                        status: s.status || 'PENDENTE',
                        signUrl: s.signUrl || null,
                        coordsJson: s.coordsJson ? JSON.stringify(s.coordsJson) : null
                    }))
                } : undefined,
                histories: {
                    create: {
                        event: 'ENVIO',
                        description: `Documento gerado e enviado para assinatura via método ${data.method || 'Eletrônica'}.`
                    }
                }
            },
            include: {
                signers: true,
                histories: true
            }
        });
        
        // Normalize response to include _id
        const mapped = { 
            ...newContract, 
            _id: newContract.id,
            signers: newContract.signers.map(s => ({ ...s, _id: s.id })),
            histories: newContract.histories.map(h => ({ ...h, _id: h.id }))
        };
        return new Response(JSON.stringify(mapped), { status: 201, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('Error creating generated contract:', error);
        return new Response(JSON.stringify({ error: 'Erro ao criar contrato' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

