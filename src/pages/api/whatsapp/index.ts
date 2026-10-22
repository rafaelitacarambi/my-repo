import type { APIRoute } from 'astro';
import { ServerStore } from '@/lib/server-store';

export const GET: APIRoute = ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'conversations' or 'messages'
    const conversationId = url.searchParams.get('conversationId');

    if (type === 'conversations') {
        const conversas = ServerStore.getConversations();
        // Sort by last message timestamp desc
        conversas.sort((a: any, b: any) =>
            new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
        );
        return new Response(JSON.stringify(conversas), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (type === 'messages') {
        const messages = ServerStore.getMessages(conversationId || undefined);
        // Sort by timestamp asc
        messages.sort((a: any, b: any) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        return new Response(JSON.stringify(messages), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response('Invalid request', { status: 400 });
};

export const POST: APIRoute = async () => Response.json({
    error: 'Envio de WhatsApp ainda não integrado. Nenhuma mensagem foi enviada.',
}, { status: 501 });
