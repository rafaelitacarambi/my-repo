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

export const POST: APIRoute = async ({ request }) => {
    // Handler for sending messages from the UI (which also calls WhatsAppService)
    // This is a proxy to keep logic securely on server
    try {
        const body = await request.json();
        const { to, text, conversationId } = body;

        // 1. Call WhatsAppService (Simulated here since we don't have real creds in dev usually)
        // In real app: await WhatsAppService.sendTextMessage(to, text);

        // 2. Save to ServerStore
        const newMessage = ServerStore.saveMessage({
            whatsappNumber: to,
            origin: 'Atendente', // From UI
            text: { body: text },
            type: 'text',
            isSent: true,
            deliveryStatus: 'sent'
        });

        return new Response(JSON.stringify(newMessage), { status: 200 });
    } catch (error) {
        console.error('Error sending message:', error);
        return new Response('Error', { status: 500 });
    }
}
