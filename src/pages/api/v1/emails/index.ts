import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const limit = Number(url.searchParams.get('limit')) || 20;

        const items = await prisma.emailLog.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' }
        });

        return new Response(JSON.stringify({
            items,
            totalCount: items.length
        }), { status: 200 });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
