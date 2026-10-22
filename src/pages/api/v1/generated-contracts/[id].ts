import { contractUpdate } from '@/lib/contract-input';
import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const GET: APIRoute = async ({ params }) => {
    try {
        const { id } = params;
        if (!id) {
            return new Response(JSON.stringify({ error: 'ID do contrato é obrigatório' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const contract = await prisma.generatedContract.findUnique({
            where: { id },
            include: {
                template: true,
                signers: true,
                histories: { orderBy: { createdAt: 'desc' } },
                lead: true,
                property: true
            }
        });

        if (!contract) {
            return new Response(JSON.stringify({ error: 'Contrato não encontrado' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        const mapped = {
            ...contract,
            _id: contract.id,
            template: contract.template ? { ...contract.template, _id: contract.template.id } : null,
            signers: contract.signers.map(s => ({ ...s, _id: s.id })),
            histories: contract.histories.map(h => ({ ...h, _id: h.id }))
        };

        return new Response(JSON.stringify(mapped), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('Error fetching generated contract detail:', error);
        return new Response(JSON.stringify({ error: 'Erro ao buscar contrato' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};

export const PUT: APIRoute = async ({ params, request }) => {
    try {
        const { id } = params;
        if (!id) {
            return new Response(JSON.stringify({ error: 'ID do contrato é obrigatório' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        let raw;
        try { raw = await request.json(); }
        catch { return Response.json({ error: 'JSON inválido.' }, { status: 400 }); }
        const parsed = contractUpdate.safeParse(raw);
        if (!parsed.success) return Response.json({ error: 'Atualização inválida. Assinaturas só podem ser registradas por fluxo verificado.' }, { status: 400 });
        const updateData = parsed.data;

        const updatedContract = await prisma.generatedContract.update({
            where: { id },
            data: updateData,
            include: {
                template: true,
                signers: true,
                histories: { orderBy: { createdAt: 'desc' } }
            }
        });

        const mapped = {
            ...updatedContract,
            _id: updatedContract.id,
            template: updatedContract.template ? { ...updatedContract.template, _id: updatedContract.template.id } : null,
            signers: updatedContract.signers.map(s => ({ ...s, _id: s.id })),
            histories: updatedContract.histories.map(h => ({ ...h, _id: h.id }))
        };

        return new Response(JSON.stringify(mapped), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('Error updating generated contract:', error);
        return new Response(JSON.stringify({ error: 'Erro ao atualizar contrato' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};

export const DELETE: APIRoute = async ({ params }) => {
    try {
        const { id } = params;
        if (!id) {
            return new Response(JSON.stringify({ error: 'ID do contrato é obrigatório' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // Delete contract (cascades signers and histories automatically)
        await prisma.generatedContract.delete({
            where: { id }
        });

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('Error deleting generated contract:', error);
        return new Response(JSON.stringify({ error: 'Erro ao excluir contrato' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};
