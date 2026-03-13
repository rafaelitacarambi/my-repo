import type { APIRoute } from 'astro';
import { EmailService } from '../../../../services/EmailService';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { to, subject, html, template, data } = body;

        if (!to) {
            return new Response(JSON.stringify({ error: 'Destinatário ausente' }), { status: 400 });
        }

        let result;

        // Se passar um nome de template conhecido, usamos ele.
        if (template === 'contract_link' && data) {
            result = await EmailService.sendContractLink(
                to,
                data.tenantName || 'Cliente',
                data.contractId || '1234',
                data.propertyTitle || 'Imóvel sem título'
            );
        } else {
            // Caso contrário, usamos o HTML customizado direto (Disparo Manual)
            result = await EmailService.sendEmail(to, subject || 'Mensagem Genérica', html || '<p>Olá</p>');
        }

        return new Response(JSON.stringify(result), { status: 200 });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
