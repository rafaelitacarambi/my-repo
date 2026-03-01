export const DEFAULT_TEMPLATES = {
    LocacaoResidencial: `
<h2 style="text-align: center; color: #ed1c24;">CONTRATO DE LOCAÇÃO IMÓVEL RESIDENCIAL</h2>

<div style="margin-top: 30px;">
    <p><strong>CONSIDERAÇÕES INICIAIS:</strong></p>
    
    <p><strong>LOCADORES:</strong> {{LOCADORES_LISTA}}.</p>

    <p><strong>LOCATÁRIOS:</strong> {{LOCATARIOS_LISTA}}.</p>

    <p><strong>QUALIFICAÇÃO DO IMÓVEL:</strong> {{IMOVEL_ENDERECO_COMPLETO}}, incluindo {{IMOVEL_TIPO}} {{IMOVEL_NUMERO}} {{IMOVEL_TORRE}} {{IMOVEL_CONDOMINIO_NOME}}.</p>

    <p><strong>FINALIDADE E ATIVIDADE:</strong> {{FINALIDADE}}</p>

    <p><strong>PRAZO DE LOCAÇÃO:</strong> {{PRAZO_MESES}} meses, a iniciar em {{DATA_INICIO_PREVISTA}}.</p>

    [[IF PRAZO_IGUAL_SUPERIOR_30]]
    <p>*(Prazo igual ou superior a 30 meses)*: Fica garantido o direito do Locador à "denúncia vazia" ao fim do prazo, podendo retomar o imóvel imotivadamente concedendo 30 dias para desocupação.</p>
    [[ENDIF]]
    
    [[IF !PRAZO_IGUAL_SUPERIOR_30]]
    <p>*(Prazo inferior a 30 meses)*: Findo o prazo, o contrato se prorroga automaticamente e o Locador só poderá retomar o imóvel de forma justificada (ex: uso próprio, demolição, etc.) conforme art. 47 da Lei do Inquilinato.</p>
    [[ENDIF]]

    <p><strong>COMPÕE O VALOR DO PACOTE LOCAÇÃO:</strong></p>
    <ul style="list-style-type: disc; margin-left: 20px;">
        <li>Aluguel: R$ {{VALOR_ALUGUEL}}</li>
        <li>IPTU: R$ {{IPTU_VALOR}}</li>
        <li>Condomínio: R$ {{CONDOMINIO_VALOR}}, exceto despesas extraordinárias que são de responsabilidade do Locador.</li>
    </ul>

    <p><strong>DATA DE PAGAMENTO DO ALUGUEL:</strong> Todo dia {{DIA_HOJE}} do mês subsequente ao vencido.</p>

    <p><strong>REAJUSTE DO VALOR DO ALUGUEL:</strong> A cada 12 (doze) meses, o valor do aluguel será reajustado de acordo com o {{REAJUSTE_INDICE}}.</p>

    <p><strong>MULTA RESCISÓRIA:</strong></p>
    <p>A multa rescisória é fixada no valor de {{MULTA_RESCISAO_ALUGUEIS}} aluguéis vigentes.
    A multa será cobrada de forma <strong>proporcional</strong> ao tempo restante para o término do contrato.</p>
    <p>O Locatário também fica dispensado da multa se a devolução decorrer de transferência pelo seu empregador para outra localidade, notificando o Locador com 30 dias de antecedência.</p>

    <p><strong>GARANTIA DE LOCAÇÃO:</strong></p>
    [[IF GARANTIA_CAUCAO]]
    <p>O LOCATÁRIO efetuará o depósito caução no valor de R$ {{CAUCAO_VALOR}}. O valor será depositado em caderneta de poupança e devolvido corrigido ao fim do contrato, caso não haja débitos ou danos.</p>
    [[ENDIF]]
    
    [[IF GARANTIA_FIANCA]]
    <p>O FIADOR supra qualificado assume responsabilidade solidária por todas as obrigações locatícias até a efetiva entrega das chaves.</p>
    [[ENDIF]]

    [[IF GARANTIA_SEGURO]]
    <p>O LOCATÁRIO apresentará apólice de seguro fiança locatícia, renovando-a anualmente enquanto durar a locação.</p>
    [[ENDIF]]

    [[IF GARANTIA_NENHUMA]]
    <p>O presente contrato é firmado SEM garantia. Fica autorizado ao Locador exigir o aluguel até o 6º dia útil do mês a vencer e, em caso de inadimplência, acionar despejo liminar em 15 dias.</p>
    [[ENDIF]]

    <hr style="margin-top: 30px; margin-bottom: 30px;">
    <h3 style="text-align: center;">BASES CONTRATUAIS (Cláusulas Gerais)</h3>
    
    <p><strong>CLÁUSULA PRIMEIRA - Finalidade:</strong> É expressamente proibido alterar a finalidade da locação.</p>
    <p><strong>CLÁUSULA SEGUNDA - Atraso de Pagamento:</strong> O não pagamento na data estipulada gera multa de 10% e juros de mora de 1% ao mês, além de correção monetária.</p>
    <p><strong>CLÁUSULA TERCEIRA - Transferência de Titularidade:</strong> O LOCATÁRIO deverá transferir as contas de consumo (energia, gás, etc.) para o seu nome até a data de entrega das chaves.</p>
    <p><strong>CLÁUSULA QUARTA - Conservação e Benfeitorias:</strong> O LOCATÁRIO renuncia expressamente a qualquer direito de retenção ou indenização por benfeitorias realizadas (necessárias, úteis ou voluptuárias), de acordo com a Súmula 335 do STJ.</p>

    <p style="text-align: center; margin-top: 50px;">
        {{CIDADE_ASSINATURA}}, {{DATA_HOJE}}.
    </p>
</div>
    `
};
