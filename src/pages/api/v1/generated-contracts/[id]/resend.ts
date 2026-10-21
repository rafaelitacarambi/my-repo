import type { APIRoute } from 'astro';

// Never write a resend history entry until a delivery provider confirms acceptance.
export const POST: APIRoute = async () => Response.json({
    error: 'Reenvio de assinatura ainda não integrado. Nenhuma mensagem foi enviada.',
}, { status: 501 });
