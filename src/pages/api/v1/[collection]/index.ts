import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapeamento das coleções antigas Mockadas para tabelas Prisma
const resolveModel = (collectionId: string) => {
    switch (collectionId) {
        case 'imoveis': return prisma.property;
        case 'clientes':
        case 'leads': return prisma.client;
        case 'usuariossistema': return prisma.user;
        case 'contratos': return prisma.contract;
        case 'cobrancas': return prisma.invoice;
        default: return null;
    }
}

export const GET: APIRoute = async ({ params, request }) => {
    const { collection } = params;
    const model = resolveModel(collection as string);
    if (!model) return new Response(JSON.stringify({ error: `Not implemented for ${collection}` }), { status: 404 });

    try {
        // Implementação extremamente simplificada de getAll (com bypass em filtros complexos por hora)
        // @ts-ignore
        const items = await model.findMany({
            take: 200,
            orderBy: { createdAt: 'desc' }
        });

        return new Response(JSON.stringify({
            items,
            totalCount: items.length,
            hasNext: false,
            currentPage: 0,
            pageSize: items.length
        }), { status: 200 });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export const POST: APIRoute = async ({ params, request }) => {
    const { collection } = params;
    const model = resolveModel(collection as string);
    if (!model) return new Response(JSON.stringify({ error: `Not implemented for ${collection}` }), { status: 404 });

    try {
        const body = await request.json();
        const dataForPrisma = mapForPrismaCreate(collection as string, body);

        // @ts-ignore
        const created = await model.create({ data: dataForPrisma });
        return new Response(JSON.stringify(created), { status: 201 });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

const mapForPrismaCreate = (collection: string, item: any) => {
    if (collection === 'imoveis') {
        return {
            id: item._id || crypto.randomUUID(),
            code: item.codigoReference || `MCK-NEW-${Date.now()}`,
            title: item.resumoImovel || 'Novo Imóvel',
            type: item.tipoImovel || 'Imóvel',
            salePrice: Number(item.precoVenda) || null,
            rentPrice: Number(item.precoLocacao) || null,
        }
    }
    // Repassa raw as is e espera que as props coincidam (Aviso: para funcionar 100% de imediato vamos aceitar erros e adaptar caso a caso)
    return { ...item, id: item._id || crypto.randomUUID() };
}
