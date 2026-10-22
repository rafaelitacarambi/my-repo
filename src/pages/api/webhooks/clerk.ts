import { verifyWebhook } from '@clerk/backend/webhooks';
import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const POST: APIRoute = async ({ request }) => {
    const secret = import.meta.env.CLERK_WEBHOOK_SIGNING_SECRET || process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!secret) return new Response('Webhook not configured', { status: 503 });
    let payload;
    try { payload = await verifyWebhook(request, { signingSecret: secret }); }
    catch { return new Response('Invalid signature', { status: 401 }); }
    try {
        const { type, data } = payload;

        if (type === 'user.created' || type === 'user.updated') {
            const email = data.email_addresses && data.email_addresses.length > 0
                ? data.email_addresses[0].email_address
                : null;

            if (!email) {
                return new Response(JSON.stringify({ error: 'User has no email' }), { status: 400 });
            }

            const firstName = data.first_name || '';
            const lastName = data.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim() || 'Usuário Sem Nome';

            await prisma.user.upsert({
                where: { email },
                create: {
                    clerkId: data.id,
                    name: fullName,
                    email: email,
                    role: 'USER', // Perfil padrão, pode ser ajustado na aplicação depois
                    status: 'ACTIVE'
                },
                update: {
                    clerkId: data.id,
                    name: fullName,
                }
            });

            console.log(`✅ Clerk Webhook: User ${data.id} synchronized to Supabase.`);
        }

        if (type === 'user.deleted') {
            if (data.id) {
                await prisma.user.updateMany({
                    where: { clerkId: data.id },
                    data: { status: 'INACTIVE' } // Soft delete
                });
                console.log(`✅ Clerk Webhook: User ${data.id} marked as INACTIVE.`);
            }
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e: any) {
        console.error("Clerk webhook processing failed.");
        return new Response(JSON.stringify({ error: 'Webhook processing failed' }), { status: 500 });
    }
}
