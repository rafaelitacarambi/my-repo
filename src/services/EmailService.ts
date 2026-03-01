import { Resend } from 'resend';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// A checagem da chave evita crashes caso a variável ainda não esteja no .env
const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

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
                console.warn('⚠️ [EmailService] RESEND_API_KEY não configurada. Simulando envio.');
                status = 'SENT';
                resendId = `simulado_${Date.now()}`;
            } else {
                const { data, error } = await resend.emails.send({
                    from: 'R Sales Imobiliária <nao-responda@rsales.com>', // Necessário validar domínio no Resend depois
                    to,
                    subject,
                    html,
                });

                if (error) {
                    status = 'FAILED';
                    errorMsg = error.message;
                    console.error('❌ Erro no envio Resend:', error);
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
        const subject = `Assinatura de Contrato - ${propertyTitle}`;
        const link = `https://rsales.com/contrato/${contractId}`; // Placeholder

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h2 style="color: #6366f1;">Olá, ${tenantName}!</h2>
                <p>O seu contrato de locação para o imóvel <strong>${propertyTitle}</strong> já está disponível para assinatura digital.</p>
                <div style="margin: 30px 0;">
                    <a href="${link}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                        Acessar Contrato
                    </a>
                </div>
                <p>Se tiver qualquer dúvida, responda este e-mail.</p>
                <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
                <p style="font-size: 12px; color: #888;">Equipe R Sales Imobiliária</p>
            </div>
        `;

        return this.sendEmail(tenantEmail, subject, html);
    }
}
