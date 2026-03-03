import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { mapForPrismaUpdate } from '../[collection]/index';

export const PUT: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { ids, updateData } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return new Response(JSON.stringify({ error: "No IDs provided for batch update" }), { status: 400 });
        }

        const dataForPrisma = mapForPrismaUpdate('imoveis', updateData);

        const updated = await prisma.property.updateMany({
            where: {
                id: { in: ids }
            },
            data: dataForPrisma
        });

        return new Response(JSON.stringify({ success: true, count: updated.count }), { status: 200 });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
