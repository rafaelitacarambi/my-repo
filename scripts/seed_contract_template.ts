
// Scripts para popular o template de contrato de locação
const TEMPLATE_BODY = `
    <h2 style="text-align: center; color: #333;">INSTRUMENTO PARTICULAR DE CONTRATO DE LOCAÇÃO RESIDENCIAL</h2>
    
    <p><strong>LOCADORA:</strong> {{LOCADORA_NOME}}, {{LOCADORA_NACIONALIDADE}}, {{LOCADORA_ESTADO_CIVIL}}, {{LOCADORA_PROFISSAO}}, portadora do {{LOCADORA_DOCUMENTO_TIPO}} nº {{LOCADORA_DOCUMENTO_NUM}} e inscrita no CPF sob nº {{LOCADORA_CPF}}, residente e domiciliada em {{LOCADORA_ENDERECO_COMPLETO}}, e-mail {{LOCADORA_EMAIL}}.</p>

    <p><strong>LOCATÁRIO(S):</strong> {{LOCATARIOS_LISTA}}.</p>

    <h3>CLÁUSULA PRIMEIRA - DO OBJETO</h3>
    <p>O objeto do presente contrato é a locação do imóvel localizado em {{IMOVEL_ENDERECO_COMPLETO}}, CEP {{IMOVEL_CEP}}, para fins exclusivamente residenciais.</p>

    <h3>CLÁUSULA SEGUNDA - DO PRAZO</h3>
    <p>O prazo da locação é de {{PRAZO_MESES}} meses, com início em {{DATA_INICIO_PREVISTA}} e término previsto para {{ANO_HOJE}}.</p>

    <h3>CLÁUSULA TERCEIRA - DO VALOR E REAJUSTE</h3>
    <p>O valor mensal do aluguel é de R$ {{VALOR_ALUGUEL}}, devendo ser pago até o dia {{DATA_VENCIMENTO}} de cada mês. O reajuste será anual com base no índice {{REAJUSTE_INDICE}}.</p>

    <h3>CLÁUSULA QUARTA - DA GARANTIA (CAUÇÃO)</h3>
    <p>Como garantia, o LOCATÁRIO deposita a quantia de R$ {{CAUCAO_VALOR}} na conta do banco {{CAUCAO_BANCO}} (Cód: {{CAUCAO_BANCO_CODIGO}}), Agência {{CAUCAO_AGENCIA}}, Conta {{CAUCAO_CONTA}}, de titularidade de {{CAUCAO_TITULAR}}, CPF {{CAUCAO_CPF}}.</p>

    [[IF OPCIONAIS.PINTURA_NOVA]]
    <h3>CLÁUSULA QUINTA - DA PINTURA</h3>
    <p>O imóvel é entregue com pintura nova (Marca Suvinil ou equivalente), devendo ser devolvido nas mesmas condições.</p>
    [[ENDIF]]

    <div style="margin-top: 40px;">
        <p>{{CIDADE_ASSINATURA}}, {{DATA_ASSINATURA}}.</p>
        
        <br/><br/>
        <p>_______________________________________________________</p>
        <p><strong>{{LOCADORA_NOME}}</strong><br/>Locadora</p>

        <br/><br/>
        <p>_______________________________________________________</p>
        <p><strong>LOCATÁRIOS</strong></p>

        <br/><br/>
        <div style="display: flex; gap: 50px;">
            <div>
                <p>__________________________</p>
                <p>Testemunha: {{TESTEMUNHA1_NOME}}</p>
                <p>RG: {{TESTEMUNHA1_RG}}</p>
            </div>
            <div>
                <p>__________________________</p>
                <p>Testemunha: {{TESTEMUNHA2_NOME}}</p>
                <p>RG: {{TESTEMUNHA2_RG}}</p>
            </div>
        </div>
    </div>
`;

console.log("Template gerado. Para aplicar, execute no console do navegador ou via script de migração:");
console.log(JSON.stringify({
    templateName: "Locação Residencial – Depósito Caução",
    contractType: "LocacaoResidencial",
    version: 1,
    templateFormat: "HTML",
    templateBody: TEMPLATE_BODY,
    templateContent: TEMPLATE_BODY, // Mantendo ambos por compatibilidade
    isActive: true,
    placeholders: ["LOCADORA_NOME", "LOCATARIOS_LISTA", "VALOR_ALUGUEL", "CAUCAO_VALOR"]
}, null, 2));
