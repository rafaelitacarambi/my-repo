import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const POST: APIRoute = async ({ request }) => {
    try {
        const payload = await request.json();

        // Em um ambiente de produção, importe `Webhook` do `svix` e verifique a assinatura
        // usando a variável de ambiente CLERK_WEBHOOK_SECRET

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
        console.error("Clerk Webhook Error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
