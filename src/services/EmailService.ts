import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';



export class EmailService {

    /**
     * Dispara um e-mail transacional e salva no banco de dados (EmailLog).
     */
    static async sendEmail(to: string, subject: string, html: string) {
        let status = 'PENDING';
        let errorMsg = null;
        let resendId = null;

        try {
            if (!process.env.RESEND_API_KEY) {
                status = 'FAILED';
                errorMsg = 'Envio de e-mail não configurado. Nenhuma mensagem foi enviada.';
            } else {
                const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
                    from: 'R Sales Imobiliária <nao-responda@rsales.com>', // Necessário validar domínio no Resend depois
                    to,
                    subject,
                    html,
                });

                if (error) {
                    status = 'FAILED';
                    errorMsg = error.message;
                    console.error('❌ Erro no envio Resend:', error);
                } else if (!data?.id) {
                    status = 'FAILED';
                    errorMsg = 'O provedor não confirmou o envio.';
                } else {
                    status = 'SENT';
                    resendId = data?.id;
                }
            }
        } catch (e: any) {
            status = 'FAILED';
            errorMsg = e.message;
        }

        // Salvar auditoria do e-mail no banco Postgres
        try {
            await prisma.emailLog.create({
                data: {
                    to,
                    subject,
                    status,
                    resendId,
                    errorMsg
                }
            });
        } catch (dbErr) {
            console.error('⚠️ Falha ao registrar EmailLog no Prisma:', dbErr);
        }

        return { status, errorMsg, resendId };
    }

    /**
     * Template: Enviar link do contrato para assinatura
     */
    static async sendContractLink(tenantEmail: string, tenantName: string, contractId: string, propertyTitle: string) {
        return {
            status: 'FAILED', resendId: null,
            errorMsg: 'Envio de link de assinatura ainda não integrado. Nenhuma mensagem foi enviada.',
        };
    }
}
