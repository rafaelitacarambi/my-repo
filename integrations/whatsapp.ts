export class WhatsAppService {
    private static readonly API_URL = 'https://graph.facebook.com/v19.0';
    private static readonly PHONE_ID = import.meta.env.WHATSAPP_PHONE_ID;
    private static readonly API_TOKEN = import.meta.env.WHATSAPP_API_TOKEN;

    private static getHeaders() {
        return {
            'Authorization': `Bearer ${this.API_TOKEN}`,
            'Content-Type': 'application/json',
        };
    }

    /**
     * Envia uma mensagem de texto simples
     */
    static async sendTextMessage(to: string, text: string) {
        if (!this.PHONE_ID || !this.API_TOKEN) {
            console.error('WhatsApp Credentials not found');
            return;
        }

        try {
            const response = await fetch(`${this.API_URL}/${this.PHONE_ID}/messages`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: to,
                    type: 'text',
                    text: { body: text }
                })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error sending WhatsApp message:', error);
            throw error;
        }
    }

    /**
     * Envia um template (obrigatório para iniciar conversam se não houver janela de 24h)
     */
    static async sendTemplate(to: string, templateName: string, languageCode: string = 'pt_BR') {
        if (!this.PHONE_ID || !this.API_TOKEN) {
            console.error('WhatsApp Credentials not found');
            return;
        }

        try {
            const response = await fetch(`${this.API_URL}/${this.PHONE_ID}/messages`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'template',
                    template: {
                        name: templateName,
                        language: { code: languageCode }
                    }
                })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error sending WhatsApp template:', error);
            throw error;
        }
    }

    /**
     * Marca uma mensagem como lida
     */
    static async markAsRead(messageId: string) {
        if (!this.PHONE_ID || !this.API_TOKEN) {
            console.error('WhatsApp Credentials not found');
            return;
        }

        try {
            await fetch(`${this.API_URL}/${this.PHONE_ID}/messages`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    status: 'read',
                    message_id: messageId
                })
            });
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    }
}
