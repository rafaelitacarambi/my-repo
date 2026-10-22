import { verifyWhatsAppSignature } from '@/lib/whatsapp-signature';
import type { APIRoute } from 'astro';
import { ServerStore } from '@/lib/server-store';

export const GET: APIRoute = ({ request }) => {
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    // Verify Token should be an environment variable
    const VERIFY_TOKEN = import.meta.env.WHATSAPP_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN;

    if (!VERIFY_TOKEN) return new Response('Webhook not configured', { status: 503 });
    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            return new Response(challenge, { status: 200 });
        } else {
            return new Response('Forbidden', { status: 403 });
        }
    }

    return new Response('Bad Request', { status: 400 });
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const secret = import.meta.env.WHATSAPP_APP_SECRET || process.env.WHATSAPP_APP_SECRET;
        if (!secret) return new Response('Webhook not configured', { status: 503 });
        const raw = await request.text();
        if (!verifyWhatsAppSignature(raw, request.headers.get('x-hub-signature-256'), secret)) {
            return new Response('Invalid signature', { status: 401 });
        }
        let body;
        try { body = JSON.parse(raw); }
        catch { return new Response('Invalid JSON', { status: 400 }); }

        if (body.object) {
            if (
                body.entry &&
                body.entry[0].changes &&
                body.entry[0].changes[0] &&
                body.entry[0].changes[0].value.messages &&
                body.entry[0].changes[0].value.messages[0]
            ) {
                const phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
                const from = body.entry[0].changes[0].value.messages[0].from; // sender phone number
                const msg_body = body.entry[0].changes[0].value.messages[0].text?.body; // message text
                const type = body.entry[0].changes[0].value.messages[0].type;
                const wamid = body.entry[0].changes[0].value.messages[0].id;

                // Save to our 'DB'
                ServerStore.saveMessage({
                    whatsappNumber: from,
                    origin: 'Cliente',
                    text: msg_body,
                    type: type,
                    wamid: wamid,
                    isSent: false,
                    deliveryStatus: 'received'
                });
            }
            return new Response('EVENT_RECEIVED', { status: 200 });
        } else {
            return new Response('Not Found', { status: 404 });
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
};
