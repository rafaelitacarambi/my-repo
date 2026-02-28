/**
 * Provedor de Assinatura Digital (Certisign / YouDigital)
 * Implementação inicial como Stub/Mock para validação do fluxo.
 */

export interface Signer {
    name: string;
    email: string;
    cpf: string;
    role: 'Locador' | 'Locatario' | 'Testemunha';
}

export interface SignatureEnvelope {
    id: string;
    status: 'Pending' | 'Completed' | 'Canceled';
    signers: Signer[];
    pdfUrl: string;
    auditLog: any[];
}

export class SignatureProvider {
    /**
     * Cria um envelope de assinatura no provedor.
     */
    static async createEnvelope(contractId: string, pdfBase64: string, signers: Signer[]): Promise<string> {
        console.log(`[SignatureProvider] Criando envelope para contrato ${contractId}`, { signers });

        // Simulação de delay de API
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Retorna um ID de envelope fictício
        return `env_${Math.random().toString(36).substring(7)}`;
    }

    /**
     * Envia os links de assinatura para os participantes.
     */
    static async sendLinks(envelopeId: string): Promise<boolean> {
        console.log(`[SignatureProvider] Enviando links para envelope ${envelopeId}`);
        await new Promise(resolve => setTimeout(resolve, 800));
        return true;
    }

    /**
     * Verifica o status de um envelope.
     */
    static async checkStatus(envelopeId: string): Promise<string> {
        return 'Pending';
    }
}
