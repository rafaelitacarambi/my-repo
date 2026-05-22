import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const PUT: APIRoute = async ({ request, params }) => {
    const { id } = params;

    if (!id) {
        return new Response(JSON.stringify({ error: 'ID do template não fornecido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const data = await request.json();

        const updatedTemplate = await prisma.contractTemplate.update({
            where: { id },
            data: {
                nome: data.nome,
                categoria: data.categoria,
                tipoOperacao: data.tipoOperacao,
                subtipo: data.subtipo,
                garantia: data.garantia,
                conteudoHtml: data.conteudoHtml,
                variaveisDetectadas: data.variaveisDetectadas || [],
                ativo: data.ativo ?? true,
                versao: data.versao,
            },
        });

        return new Response(JSON.stringify(updatedTemplate), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error(`Error updating template ${id}:`, error);
        return new Response(JSON.stringify({ error: 'Erro ao atualizar template' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

export const DELETE: APIRoute = async ({ params }) => {
    const { id } = params;

    if (!id) {
        return new Response(JSON.stringify({ error: 'ID do template não fornecido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        await prisma.contractTemplate.delete({
            where: { id }
        });
        
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error(`Error deleting template ${id}:`, error);
        return new Response(JSON.stringify({ error: 'Erro ao deletar template' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
