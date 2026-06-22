import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const POST: APIRoute = async ({ params, request }) => {
    try {
        const { id } = params;
        if (!id) {
            return new Response(JSON.stringify({ error: 'ID do contrato é obrigatório' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const data = await request.json();
        const { signerId, channel } = data; // channel: 'Email' | 'WhatsApp'

        if (!signerId || !channel) {
            return new Response(JSON.stringify({ error: 'signerId e channel são obrigatórios' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const signer = await prisma.contractSigner.findUnique({
            where: { id: signerId }
        });

        if (!signer) {
            return new Response(JSON.stringify({ error: 'Signatário não encontrado' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        // Registrar o reenvio no histórico
        await prisma.signatureHistory.create({
            data: {
                generatedContractId: id,
                event: 'REENVIO',
                description: `Solicitação de assinatura reenviada para ${signer.name} (${signer.role}) via ${channel}.`,
                signerName: signer.name,
                signerEmail: signer.email
            }
        });

        // Retornar o contrato atualizado com histórico
        const updatedContract = await prisma.generatedContract.findUnique({
            where: { id },
            include: {
                template: true,
                signers: true,
                histories: { orderBy: { createdAt: 'desc' } }
            }
        });

        const mapped = {
            ...updatedContract,
            _id: updatedContract?.id,
            template: updatedContract?.template ? { ...updatedContract.template, _id: updatedContract.template.id } : null,
            signers: updatedContract?.signers.map(s => ({ ...s, _id: s.id })),
            histories: updatedContract?.histories.map(h => ({ ...h, _id: h.id }))
        };

        return new Response(JSON.stringify(mapped), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('Error re-sending signature request:', error);
        return new Response(JSON.stringify({ error: 'Erro ao reenviar solicitação' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};
