import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

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

export const GET: APIRoute = async ({ params }) => {
    const { collection, id } = params;
    const model = resolveModel(collection as string);
    if (!model) return new Response(JSON.stringify({ error: `Not implemented for ${collection}` }), { status: 404 });

    try {
        // @ts-ignore
        const item = await model.findUnique({ where: { id: id as string } });
        return new Response(JSON.stringify(item), { status: 200 });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export const PUT: APIRoute = async ({ params, request }) => {
    const { collection, id } = params;
    const model = resolveModel(collection as string);
    if (!model) return new Response(JSON.stringify({ error: `Not implemented for ${collection}` }), { status: 404 });

    try {
        const body = await request.json();
        // @ts-ignore
        const updated = await model.update({ where: { id: id as string }, data: body });
        return new Response(JSON.stringify(updated), { status: 200 });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export const DELETE: APIRoute = async ({ params }) => {
    const { collection, id } = params;
    const model = resolveModel(collection as string);
    if (!model) return new Response(JSON.stringify({ error: `Not implemented for ${collection}` }), { status: 404 });

    try {
        // @ts-ignore
        const deleted = await model.delete({ where: { id: id as string } });
        return new Response(JSON.stringify(deleted), { status: 200 });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
