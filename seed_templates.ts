import { BaseCrudService } from './src/integrations';

const templates = [
    {
        _id: 'templ-locacao-residencial-1',
        templateName: 'Locação Residencial v1.0',
        contractType: 'LocacaoResidencial',
        version: 1,
        isActive: true,
        templateContent: `
CONTRATO DE LOCAÇÃO RESIDENCIAL

LOCADOR: {{LOCADOR_NOME}}, inscrito no CPF sob nº {{LOCADOR_CPF}}, residente em {{LOCADOR_ENDERECO}}.
LOCATÁRIO: {{LOCATARIO_NOME}}, inscrito no CPF sob nº {{LOCATARIO_CPF}}, residente em {{LOCATARIO_ENDERECO}}.

OBJETO: Imóvel situado na {{IMOVEL_ENDERECO}}, nº {{IMOVEL_NUMERO}}, bairro {{IMOVEL_BAIRRO}}, {{IMOVEL_CIDADE}}.

VALOR DO ALUGUEL: R$ {{VALOR_ALUGUEL}} mensais.
PRAZO: {{PRAZO_MESES}} meses, com início em {{DATA_INICIO}}.

[[IF TEM_FIADOR]]
CLÁUSULA DE GARANTIA (FIADOR):
O(A) FIADOR(A) {{FIADOR_NOME}} assume responsabilidade solidária por todas as obrigações deste contrato.
[[ENDIF]]

[[IF TEM_CAUCAO]]
CLÁUSULA DE GARANTIA (CAUÇÃO):
O LOCATÁRIO deposita neste ato o valor de R$ {{VALOR_CAUCAO}} a título de caução.
[[ENDIF]]

São Paulo, {{DATA_GERACAO}}.
    `,
    },
    {
        _id: 'templ-compra-venda-1',
        templateName: 'Compra e Venda v1.0',
        contractType: 'CompraEVenda',
        version: 1,
        isActive: true,
        templateContent: `
INSTRUMENTO PARTICULAR DE COMPRA E VENDA DE IMÓVEL

VENDEDOR: {{VENDEDOR_NOME}}, CPF {{VENDEDOR_CPF}}.
COMPRADOR: {{COMPRADOR_NOME}}, CPF {{COMPRADOR_CPF}}.

Pelo presente instrumento, o VENDEDOR se obriga a vender ao COMPRADOR o imóvel código {{IMOVEL_CODIGO}}, localizado em {{IMOVEL_ENDERECO}}.

VALOR DA TRANSAÇÃO: R$ {{VALOR_VENDA}}.
FORMA DE PAGAMENTO: {{FORMA_PAGAMENTO}}.

São Paulo, {{DATA_GERACAO}}.
    `,
    },
    {
        _id: 'templ-chaves-1',
        templateName: 'Termo de Entrega de Chaves',
        contractType: 'EntregaChaves',
        version: 1,
        isActive: true,
        templateContent: `
TERMO DE ENTREGA DE CHAVES

Pelo presente, o LOCATÁRIO {{LOCATARIO_NOME}} recebe as chaves do imóvel situado em {{IMOVEL_ENDERECO}}, nº {{IMOVEL_NUMERO}}, declarando que o mesmo se encontra nas condições vistoriadas.

DATA DA ENTREGA: {{DATA_ENTREGA}}.

Assinatura do Locatário: ___________________________
    `,
    },
    {
        _id: 'templ-autorizacao-1',
        templateName: 'Autorização de Divulgação',
        contractType: 'AutorizacaoDivulgacao',
        version: 1,
        isActive: true,
        templateContent: `
AUTORIZAÇÃO PARA DIVULGAÇÃO E CAPTAÇÃO DE IMÓVEL

O PROPRIETÁRIO {{PROPRIETARIO_NOME}} autoriza a R SALES IMÓVEIS a promover a divulgação do imóvel código {{IMOVEL_CODIGO}} para fins de {{FINALIDADE}}.

[[IF EXCLUSIVIDADE]]
Esta autorização é concedida com caráter de EXCLUSIVIDADE pelo prazo de {{PRAZO_AUTORIZACAO}} dias.
[[ELSE]]
A divulgação será feita sem exclusividade.
[[ENDIF]]

COMISSÃO: Ficando acordada a comissão de {{COMISSAO}}% sobre o valor da transação.

São Paulo, {{DATA_GERACAO}}.
    `,
    }
];

async function seedTemplates() {
    console.log('Iniciando seed de templates de contrato...');
    for (const template of templates) {
        try {
            await BaseCrudService.create('templatescontratos', template);
            console.log(`Template criado: ${template.templateName}`);
        } catch (e) {
            console.log(`Template ${template.templateName} já existe ou erro na criação.`);
        }
    }
}

// Para rodar este script, ele precisaria ser importado corretamente no ambiente
// Como estou em modo agente, vou apenas documentar os templates ou criar um botão de "Popular" na interface.
