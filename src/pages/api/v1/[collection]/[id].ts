import { requireAdmin } from '@/lib/require-admin';
import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { mapForFrontend, mapForPrismaCreate } from './index';

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
    if (params.collection === 'usuariossistema') {
        const denied = await requireAdmin(request);
        if (denied) return denied;
    }
    const { collection, id } = params;
    const model = resolveModel(collection as string);
    if (!model) return new Response(JSON.stringify({ error: `Not implemented for ${collection}` }), { status: 404 });

    try {
        // @ts-ignore
        const item = await model.findUnique({ where: { id: id as string } });
        const mappedItem = item ? mapForFrontend(collection as string, item) : null;
        return new Response(JSON.stringify(mappedItem), { status: 200 });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export const PUT: APIRoute = async ({ params, request }) => {
    if (params.collection === 'usuariossistema') {
        const denied = await requireAdmin(request);
        if (denied) return denied;
    }
    const { collection, id } = params;
    const model = resolveModel(collection as string);
    if (!model) return new Response(JSON.stringify({ error: `Not implemented for ${collection}` }), { status: 404 });

    try {
        const body = await request.json();
        let dataForPrisma = body;

        if (collection === 'usuariossistema') {
            dataForPrisma = mapForPrismaCreate(collection, body);
            delete dataForPrisma.id; // Não atualiza o ID
        } else if (collection === 'imoveis') {
            dataForPrisma = mapForPrismaCreate(collection, body);
            delete dataForPrisma.id;
        } else if (collection === 'clientes' || collection === 'leads') {
            dataForPrisma = {};
            if (body.clientName !== undefined) dataForPrisma.name = body.clientName;
            if (body.nomeFantasia !== undefined) dataForPrisma.name = body.nomeFantasia;
            if (body.name !== undefined) dataForPrisma.name = body.name;
            if (body.email !== undefined) dataForPrisma.email = body.email;
            if (body.cpfCnpj !== undefined) dataForPrisma.document = body.cpfCnpj;
            if (body.document !== undefined) dataForPrisma.document = body.document;
            if (body.phoneNumber !== undefined) dataForPrisma.phone = body.phoneNumber;
            if (body.phone !== undefined) dataForPrisma.phone = body.phone;
            if (body.address !== undefined) dataForPrisma.address = body.address;
            if (body.gender !== undefined) dataForPrisma.gender = body.gender;
            if (body.status !== undefined) dataForPrisma.status = body.status;
            if (body.type !== undefined) dataForPrisma.type = body.type;
            if (body.notes !== undefined) dataForPrisma.notes = body.notes;
            if (body.papeis !== undefined) dataForPrisma.papeis = body.papeis;
            if (body.canalOrigem !== undefined) dataForPrisma.canalOrigem = body.canalOrigem;
            if (body.responsavelInternoId !== undefined) dataForPrisma.responsavelInternoId = body.responsavelInternoId;
            if (body.rg !== undefined) dataForPrisma.rg = body.rg;
            if (body.nationality !== undefined) dataForPrisma.nationality = body.nationality;
            if (body.maritalStatus !== undefined) dataForPrisma.maritalStatus = body.maritalStatus;
            if (body.profession !== undefined) dataForPrisma.profession = body.profession;
        }

        // Remove unknown Prisma fields that might have leaked in from raw body for other collections
        delete dataForPrisma._id;
        delete dataForPrisma.id;

        // @ts-ignore
        const updated = await model.update({ where: { id: id as string }, data: dataForPrisma });
        return new Response(JSON.stringify(updated), { status: 200 });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export const DELETE: APIRoute = async ({ params, request }) => {
    if (params.collection === 'usuariossistema') {
        const denied = await requireAdmin(request);
        if (denied) return denied;
    }
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
