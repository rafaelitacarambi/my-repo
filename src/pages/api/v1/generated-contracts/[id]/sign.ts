import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const POST: APIRoute = async ({ params, request }) => {
    try {
        const { id } = params;
        if (!id) {
            return new Response(JSON.stringify({ error: 'ID do contrato é obrigatório' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const data = await request.json();
        const { signerId, method, ipAddress, userAgent, certificateDetails } = data;

        if (!signerId || !method) {
            return new Response(JSON.stringify({ error: 'signerId e method são obrigatórios' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // 1. Atualizar o status do signatário
        const updatedSigner = await prisma.contractSigner.update({
            where: { id: signerId },
            data: {
                status: 'ASSINADO',
                signedAt: new Date(),
                ipAddress: ipAddress || '192.168.1.1',
                certificateDetails: certificateDetails || null
            }
        });

        // 2. Registrar no histórico de assinaturas
        const certDesc = certificateDetails ? ` (Certificado: ${certificateDetails})` : '';
        await prisma.signatureHistory.create({
            data: {
                generatedContractId: id,
                event: 'ASSINATURA',
                description: `Assinado por ${updatedSigner.name} (${updatedSigner.role}) via assinatura ${method} - IP: ${updatedSigner.ipAddress}${certDesc}.`,
                signerName: updatedSigner.name,
                signerEmail: updatedSigner.email,
                ipAddress: updatedSigner.ipAddress,
                userAgent: userAgent || 'Browser Simulation'
            }
        });

        // 3. Verificar se todos os participantes assinaram
        const allSigners = await prisma.contractSigner.findMany({
            where: { generatedContractId: id }
        });

        const allSigned = allSigners.every(s => s.status === 'ASSINADO');

        // 4. Se todos assinaram, atualiza o status do contrato
        if (allSigned) {
            await prisma.generatedContract.update({
                where: { id },
                data: {
                    status: 'ASSINADO'
                }
            });

            // Registrar finalização no histórico
            await prisma.signatureHistory.create({
                data: {
                    generatedContractId: id,
                    event: 'CONCLUIDO',
                    description: 'Processo de assinatura concluído! Todos os participantes assinaram o documento.'
                }
            });
        } else {
            // Se pelo menos um assinou mas não todos, marca como PARCIAL
            await prisma.generatedContract.update({
                where: { id },
                data: {
                    status: 'PARCIAL'
                }
            });
        }

        // 5. Retornar o contrato atualizado completo
        const finalContract = await prisma.generatedContract.findUnique({
            where: { id },
            include: {
                template: true,
                signers: true,
                histories: { orderBy: { createdAt: 'desc' } }
            }
        });

        const mapped = {
            ...finalContract,
            _id: finalContract?.id,
            template: finalContract?.template ? { ...finalContract.template, _id: finalContract.template.id } : null,
            signers: finalContract?.signers.map(s => ({ ...s, _id: s.id })),
            histories: finalContract?.histories.map(h => ({ ...h, _id: h.id }))
        };

        return new Response(JSON.stringify(mapped), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('Error signing document:', error);
        return new Response(JSON.stringify({ error: 'Erro ao assinar documento' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};
