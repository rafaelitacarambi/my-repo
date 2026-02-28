import { NumberToWords } from '../lib/number-to-words';

/**
 * Motor de Contratos R Sales Imóveis
 * Responsável por processar templates e gerar o conteúdo final.
 */

export interface ContractData {
    [key: string]: any;
}

export class ContractEngine {
    /**
     * Processa o template substituindo placeholders e avaliando condicionais.
     * 
     * Placeholder: {{CHAVE}}
     * Condicional: [[IF CHAVE]] ... [[ELSE]] ... [[ENDIF]]
     */
    static processTemplate(template: string, data: ContractData): string {
        let content = template;

        // 1. Processar Condicionais [[IF key]] ... [[ENDIF]]
        const conditionalRegex = /\[\[IF\s+(!?\w+)]]([\s\S]*?)(?:\[\[ELSE]]([\s\S]*?))?\[\[ENDIF]]/g;

        content = content.replace(conditionalRegex, (match, key, thenBlock, elseBlock) => {
            let isNegative = key.startsWith('!');
            let cleanKey = isNegative ? key.substring(1) : key;

            // Suporte para chaves aninhadas (ex: OPCIONAIS.SUBLOCACAO)
            const keys = cleanKey.split('.');
            let value = data;
            for (const k of keys) {
                value = value?.[k];
            }

            let conditionMet = !!value;
            if (isNegative) conditionMet = !conditionMet;

            return conditionMet ? thenBlock : (elseBlock || '');
        });

        // 2. Processar Placeholders {{CHAVE}}
        const placeholderRegex = /\{\{([\w.]+)\}\}/g;
        content = content.replace(placeholderRegex, (match, key) => {
            const keys = key.split('.');
            let value = data;
            for (const k of keys) {
                value = value?.[k];
            }

            if (value !== undefined && value !== null) {
                return value.toString();
            }
            return match;
        });

        return content;
    }

    static mapEntitiesToData(atendimento: any, clientes: any[], imovel: any, extraData: any): ContractData {
        const data: ContractData = {
            // Atendimento & Global
            ATENDIMENTO_ID: atendimento?._id || '',
            PASTA_INTERNA: atendimento?.pastaInterna || '',
            CIDADE_ASSINATURA: 'Poá', // Default for this client
            DATA_ASSINATURA: new Date().toLocaleDateString('pt-BR'),
            DATA_HOJE: new Date().toLocaleDateString('pt-BR'),
            DIA_HOJE: new Date().getDate(),
            MES_HOJE_EXTENSO: new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date()),
            ANO_HOJE: new Date().getFullYear(),
            LOGO_RSALES: 'https://static.wixstatic.com/media/9b23b4_8b5ff4d697054133a09457af0365ebeb~mv2.png',

            // Imóvel
            IMOVEL_TIPO: imovel?.tipoImovel || 'Apartamento',
            IMOVEL_NUMERO: imovel?.numero || '',
            IMOVEL_TORRE: (imovel as any)?.torre || '',
            IMOVEL_CONDOMINIO_NOME: imovel?.nomeCondominio || '',
            IMOVEL_ENDERECO_COMPLETO: imovel ? `${imovel.logradouro}, ${imovel.numero}${imovel.complemento ? ' - ' + imovel.complemento : ''}, ${imovel.bairro}, ${imovel.cidade}-${imovel.uf}` : '',
            IMOVEL_CEP: imovel?.cep || '',
            IMOVEL_VAGAS_GARAGEM: imovel?.vagas || 0,
            MATRICULA: (imovel as any)?.matricula || '',

            // Condições
            FINALIDADE: imovel?.finalidade || 'Residencial',
            PRAZO_MESES: extraData?.PRAZO_MESES || '30',
            DATA_INICIO_PREVISTA: extraData?.DATA_INICIO_PREVISTA || '',
            DATA_ENTREGA_CHAVES_OBS: extraData?.DATA_ENTREGA_CHAVES_OBS || '',
            VALOR_ALUGUEL: extraData?.VALOR_ALUGUEL || 0,
            VALOR_ALUGUEL_EXTENSO: extraData?.VALOR_ALUGUEL ? NumberToWords.convertCurrency(parseFloat(extraData.VALOR_ALUGUEL)) : '',
            DATA_VENCIMENTO: extraData?.DATA_VENCIMENTO || '10',
            CONDOMINIO_VALOR: imovel?.valorCondominio || 0,
            IPTU_VALOR: imovel?.valorIPTU || 0,
            REAJUSTE_INDICE: extraData?.REAJUSTE_INDICE || 'IGP-M (FGV)',
            MULTA_RESCISAO_ALUGUEIS: extraData?.MULTA_RESCISAO_ALUGUEIS || '3',
            CAUCAO_VALOR: extraData?.CAUCAO_VALOR || 0,
            CAUCAO_VALOR_EXTENSO: extraData?.CAUCAO_VALOR ? NumberToWords.convertCurrency(parseFloat(extraData.CAUCAO_VALOR)) : '',

            // Dados Caução
            CAUCAO_BANCO: extraData?.CAUCAO_BANCO || '',
            CAUCAO_BANCO_CODIGO: extraData?.CAUCAO_BANCO_CODIGO || '',
            CAUCAO_TITULAR: extraData?.CAUCAO_TITULAR || '',
            CAUCAO_CPF: extraData?.CAUCAO_CPF || '',
            CAUCAO_AGENCIA: extraData?.CAUCAO_AGENCIA || '',
            CAUCAO_CONTA: extraData?.CAUCAO_CONTA || '',

            // Testemunhas
            TESTEMUNHA1_NOME: extraData?.TESTEMUNHA1_NOME || '________________________________',
            TESTEMUNHA1_RG: extraData?.TESTEMUNHA1_RG || '',
            TESTEMUNHA2_NOME: extraData?.TESTEMUNHA2_NOME || '________________________________',
            TESTEMUNHA2_RG: extraData?.TESTEMUNHA2_RG || '',

            // Legacy support
            ...extraData
        };

        // Helper para qualificação detalhada com overrides
        const getQualification = (clientId: string) => {
            const client = clientes.find(c => c._id === clientId);
            if (!client && !extraData?.PARTICIPANT_DETAILS?.[clientId]) return '';

            const o = extraData?.PARTICIPANT_DETAILS?.[clientId] || {};
            const name = o.name || client?.clientName || '';
            const gender = o.gender || (client as any)?.gender || 'Masculino';

            const isFem = gender === 'Feminino';

            const nationality = o.nationality || (client as any)?.nationality || (isFem ? 'brasileira' : 'brasileiro');
            const maritalStatus = o.maritalStatus || (client as any)?.maritalStatus || (isFem ? 'estado civil n/d' : 'estado civil n/d');
            const profession = o.profession || (client as any)?.profession || 'profissão n/d';
            const rg = o.rg || (client as any)?.rg || '';
            const cpf = o.cpf || client?.cpfCnpj || '';
            const address = o.address || client?.address || '';
            const email = o.email || client?.emailPrincipal || '';

            // Qualificação de gênero nas palavras
            const portador = isFem ? 'portadora' : 'portador';
            const residente = 'residente'; // Neutro
            const domiciliado = isFem ? 'domiciliada' : 'domiciliado';

            let text = `${name}, ${nationality}, ${maritalStatus}, ${profession}, ${portador} do RG nº ${rg} e CPF nº ${cpf}, ${residente} e ${domiciliado} em ${address}`;
            if (email) text += `, e-mail ${email}`;

            // Interligação de Cônjuge
            if (o.spouseId && o.spouseId !== 'no_spouse') {
                const spouse = clientes.find(c => c._id === o.spouseId);
                const so = extraData?.PARTICIPANT_DETAILS?.[o.spouseId] || {};
                const sName = so.name || spouse?.clientName || '';
                const sCpf = so.cpf || spouse?.cpfCnpj || '';
                const connector = isFem ? 'casada com' : 'casado com';
                text += `, ${connector} ${sName}, inscrito(a) no CPF sob o nº ${sCpf}`;
            }

            return text;
        };

        // Helper para labels de grupo (Ex: VENDEDOR, VENDEDORA, VENDEDORES, VENDEDORAS)
        const getGroupRoleLabel = (ids: string[], roleBase: string) => {
            if (ids.length === 0) return '';

            const participants = ids.map(id => {
                const client = clientes.find(c => c._id === id);
                const o = extraData?.PARTICIPANT_DETAILS?.[id] || {};
                return { gender: o.gender || (client as any)?.gender || 'Masculino' };
            });

            const allFem = participants.every(p => p.gender === 'Feminino');
            const isPlural = ids.length > 1;

            const map: any = {
                'Locador': { ms: 'O LOCADOR', fs: 'A LOCADORA', mp: 'OS LOCADORES', fp: 'AS LOCADORAS' },
                'Locatário': { ms: 'O LOCATÁRIO', fs: 'A LOCATÁRIA', mp: 'OS LOCATÁRIOS', fp: 'AS LOCATÁRIAS' },
                'Vendedor': { ms: 'O VENDEDOR', fs: 'A VENDEDORA', mp: 'OS VENDEDORES', fp: 'AS VENDEDORAS' },
                'Comprador': { ms: 'O COMPRADOR', fs: 'A COMPRADORA', mp: 'OS COMPRADORES', fp: 'AS COMPRADORAS' },
                'Proprietário': { ms: 'O PROPRIETÁRIO', fs: 'A PROPRIETÁRIA', mp: 'OS PROPRIETÁRIOS', fp: 'AS PROPRIETÁRIAS' },
            };

            const labels = map[roleBase] || { ms: roleBase, fs: roleBase, mp: roleBase, fp: roleBase };

            if (isPlural) {
                return allFem ? labels.fp : labels.mp;
            } else {
                return participants[0].gender === 'Feminino' ? labels.fs : labels.ms;
            }
        };

        // Mapear LOCADORA (Proprietário principal) - Mantendo por legado, mas agora com gênero
        const locadoraIds = extraData?.LOCADORES_IDS || [];
        if (locadoraIds.length > 0) {
            const firstId = locadoraIds[0];
            const client = clientes.find(c => c._id === firstId);
            const o = extraData?.PARTICIPANT_DETAILS?.[firstId] || {};
            const isFem = (o.gender || (client as any)?.gender) === 'Feminino';

            data.LOCADORA_LABEL = isFem ? 'A LOCADORA' : 'O LOCADOR';
            data.LOCADORA_NOME = o.name || client?.clientName || '';
            data.LOCADORA_QUALIFICACAO = getQualification(firstId);

            // Campos individuais
            const nationality = o.nationality || (client as any)?.nationality || (isFem ? 'brasileira' : 'brasileiro');
            data.LOCADORA_NACIONALIDADE = nationality;
            data.LOCADORA_ESTADO_CIVIL = o.maritalStatus || (client as any)?.maritalStatus || '';
            data.LOCADORA_PROFISSAO = o.profession || (client as any)?.profession || '';
            data.LOCADORA_DOCUMENTO_NUM = o.rg || (client as any)?.rg || '';
            data.LOCADORA_CPF = o.cpf || client?.cpfCnpj || '';
            data.LOCADORA_EMAIL = o.email || client?.emailPrincipal || '';
            data.LOCADORA_ENDERECO_COMPLETO = o.address || client?.address || '';
        }

        // Mapear LISTAS e LABELS Dinâmicos
        const locadorIds = extraData?.LOCADORES_IDS || [];
        data.LOCADORES_LABEL = getGroupRoleLabel(locadorIds, 'Locador');
        data.LOCADORES_LISTA = locadorIds.map((id: string) => getQualification(id)).filter(Boolean).join('; ');

        const locatarioIds = extraData?.LOCATARIOS_IDS || [];
        data.LOCATARIOS_LABEL = getGroupRoleLabel(locatarioIds, 'Locatário');
        data.LOCATARIOS_LISTA = locatarioIds.map((id: string) => getQualification(id)).filter(Boolean).join('; ');

        const vendedorIds = extraData?.VENDEDORES_IDS || [];
        data.VENDEDORES_LABEL = getGroupRoleLabel(vendedorIds, 'Vendedor');
        data.VENDEDORES_LISTA = vendedorIds.map((id: string) => getQualification(id)).filter(Boolean).join('; ');

        const compradorIds = extraData?.COMPRADORES_IDS || [];
        data.COMPRADORES_LABEL = getGroupRoleLabel(compradorIds, 'Comprador');
        data.COMPRADORES_LISTA = compradorIds.map((id: string) => getQualification(id)).filter(Boolean).join('; ');

        return data;
    }

    /**
     * Gera o HTML final pronto para o Preview e PDF, incluindo CSS básico e Logo.
     */
    static renderContract(template: string, data: ContractData): string {
        const body = this.processTemplate(template, data);

        return `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 40px; max-width: 800px; margin: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ed1c24; padding-bottom: 10px; margin-bottom: 30px;">
                    <img src="${data.LOGO_RSALES || ''}" style="width: 150px; height: auto;" />
                    <div style="text-align: right;">
                        <h1 style="margin: 0; font-size: 18px; color: #ed1c24;">CONTRATO DE LOCAÇÃO</h1>
                        <p style="margin: 0; font-size: 12px; color: #666;">Instrumento Particular / ${data.FINALIDADE || ''}</p>
                    </div>
                </div>
                
                <div style="font-size: 14px; text-align: justify;">
                    ${body}
                </div>

                <div style="margin-top: 50px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 10px; text-align: center;">
                    Este documento é uma via digital gerada pelo sistema R.Sales Imóveis.
                </div>
            </div>
        `;
    }
}

