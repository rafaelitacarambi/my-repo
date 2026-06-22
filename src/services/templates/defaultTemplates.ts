export const DEFAULT_TEMPLATES: Record<string, string> = {
    LocacaoResidencial: JSON.stringify([
        {
            key: 'consideracoes_iniciais',
            titulo: 'Considerações Iniciais',
            obrigatoria: true,
            semNumero: true,
            textoHtml: `
<h2 style="text-align: center; color: #ed1c24; margin-bottom: 5px;">CONTRATO DE LOCAÇÃO DE IMÓVEL RESIDENCIAL</h2>
[[IF GARANTIA_CAUCAO]]
<h3 style="text-align: center; color: #666; font-size: 16px; margin-top: 0px; margin-bottom: 20px;">GARANTIA LOCATÍCIA: DEPÓSITO CAUÇÃO</h3>
[[ENDIF]]
[[IF GARANTIA_FIANCA]]
<h3 style="text-align: center; color: #666; font-size: 16px; margin-top: 0px; margin-bottom: 20px;">GARANTIA LOCATÍCIA: FIANÇA</h3>
[[ENDIF]]
[[IF GARANTIA_SEGURO]]
<h3 style="text-align: center; color: #666; font-size: 16px; margin-top: 0px; margin-bottom: 20px;">GARANTIA LOCATÍCIA: SEGURO FIANÇA</h3>
[[ENDIF]]
[[IF GARANTIA_NENHUMA]]
<h3 style="text-align: center; color: #666; font-size: 16px; margin-top: 0px; margin-bottom: 20px;">SEM GARANTIA LOCATÍCIA</h3>
[[ENDIF]]

<div style="margin-top: 20px; font-size: 14px; text-align: left; line-height: 1.6;">
    <p><strong>CONSIDERAÇÕES INICIAIS:</strong></p>
    
    <p><strong>{{LOCADORES_LABEL}}:</strong> {{LOCADORES_LISTA}}</p>

    <p><strong>{{LOCATARIOS_LABEL}}:</strong> {{LOCATARIOS_LISTA}}</p>

    [[IF GARANTIA_FIANCA]]
    <p><strong>{{FIADORES_LABEL}}:</strong> {{FIADORES_LISTA}}</p>
    [[ENDIF]]

    <p><strong>QUALIFICAÇÃO DO IMÓVEL:</strong> {{IMOVEL_TIPO}} [[IF IMOVEL_NUMERO]]nº {{IMOVEL_NUMERO}}[[ENDIF]][[IF IMOVEL_TORRE]], torre {{IMOVEL_TORRE}}[[ENDIF]][[IF IMOVEL_CONDOMINIO_NOME]], do empreendimento denominado “{{IMOVEL_CONDOMINIO_NOME}}”[[ENDIF]], localizado na {{IMOVEL_ENDERECO_COMPLETO}}, CEP: {{IMOVEL_CEP}}, com direito ao uso de {{IMOVEL_VAGAS_GARAGEM}} vaga(s) de garagem.</p>

    <p><strong>FINALIDADE E ATIVIDADE:</strong> {{FINALIDADE}}</p>

    <p><strong>PRAZO DE LOCAÇÃO:</strong> O prazo de locação será de {{PRAZO_MESES}} ({{PRAZO_MESES_EXTENSO}}) meses, com início previsto para o dia {{DATA_INICIO_PREVISTA}}, podendo ser antecipado ou postergado em razão da finalização das obras de reforma no imóvel. A data efetiva de início da locação será aquela em que ocorrer a entrega das chaves aos LOCATÁRIOS, a qual será formalizada mediante assinatura do Termo de Entrega pelas partes.</p>
    <p><em>Parágrafo único:</em> A entrega das chaves e o início da contagem do prazo contratual somente ocorrerão após a conclusão das obras essenciais que permitam o uso regular do imóvel, não sendo devido qualquer valor de aluguel até a efetiva entrega das chaves.</p>

    <p><strong>VALOR DA LOCAÇÃO:</strong> O valor mensal da locação é de R$ {{VALOR_ALUGUEL}} ({{VALOR_ALUGUEL_EXTENSO}}).</p>
    [[IF !IS_PACOTE]]
    <p>Além do aluguel, os LOCATÁRIOS serão responsáveis pelo pagamento do IPTU e da taxa de condomínio, atualmente fixados em:</p>
    <p style="margin-left: 20px; margin-bottom: 15px;">
        • Condomínio (custas ordinárias): R$ {{CONDOMINIO_VALOR}}<br/>
        • IPTU: R$ {{IPTU_VALOR}}
    </p>
    <p>Os valores acima serão cobrados juntamente com o aluguel, em boleto único mensal, emitido pela administradora.</p>
    <p><em>Parágrafo único:</em> Os LOCATÁRIOS serão responsáveis exclusivamente pelas despesas condominiais ordinárias, conforme legislação vigente, incluindo, mas não se limitando a despesas de manutenção, conservação e administração do condomínio. Quaisquer despesas extraordinárias, tais como obras estruturais, melhorias, fundo de reserva, benfeitorias que aumentem o padrão do condomínio ou outras previstas no art. 22 da Lei 8.245/91, serão de responsabilidade do(a) LOCADOR(a). Eventuais ajustes nos valores do condomínio ordinário e/ou IPTU serão automaticamente repassados aos LOCATÁRIOS, passando a integrar o boleto mensal a partir da data de sua vigência.</p>
    [[ENDIF]]

    <p><strong>DATA DE PAGAMENTO DO ALUGUEL:</strong> todo dia {{DIA_PAGAMENTO}} do mês subsequente ao vencido. Devendo ser pago, exclusivamente, através de boleto bancário a ser emitido pela administradora.</p>

    <p><strong>REAJUSTE DO VALOR DO ALUGUEL:</strong> o reajuste do aluguel será anual, a contar do início da locação, de acordo com o {{REAJUSTE_INDICE}}. No entanto, esse reajuste será aplicado somente caso o índice seja positivo. Se o índice for negativo, o valor do aluguel permanecerá inalterado e o contrato não sofrerá qualquer modificação.</p>

    <p><strong>ENCARGOS LOCATÍCIOS:</strong> energia elétrica, devendo ser pagos pelos LOCATÁRIOS diretamente para as empresas prestadoras de serviços. A tarifa bancária cobrada para a geração do boleto de locação será de responsabilidade dos LOCATÁRIOS. O valor correspondente a essa tarifa será cobrado juntamente com o valor do aluguel mensal e demais encargos locatícios.</p>

    <p><strong>MULTA RESCISÓRIA:</strong> {{MULTA_RESCISAO_ALUGUEIS}} (três) aluguéis vigentes à época da rescisão, proporcional ao tempo restante da locação.</p>
</div>
            `
        },
        {
            key: 'garantia_locaticia',
            titulo: 'Garantia Locatícia',
            obrigatoria: true,
            semNumero: true,
            textoHtml: `
<div style="font-size: 14px; text-align: left; line-height: 1.6;">
    <p><strong>GARANTIA DE LOCAÇÃO:</strong></p>
    [[IF GARANTIA_CAUCAO]]
    <p>Os LOCATÁRIOS efetuarão o depósito caução no valor de R$ {{CAUCAO_VALOR}} ({{CAUCAO_VALOR_EXTENSO}}), que ficará sob a posse da LOCADORA durante a vigência do presente contrato. Este valor será corrigido mensalmente pela mesma taxa aplicada às cadernetas de poupança, conforme legislação vigente.</p>
    <p>O valor da caução, devidamente corrigido pela poupança, poderá ser utilizado pela LOCADORA para cobertura de eventuais inadimplementos dos LOCATÁRIOS, tais como aluguéis, encargos locatícios, danos ao imóvel ou quaisquer outras obrigações previstas neste contrato.</p>
    <p>Na hipótese de término contratual, estando os LOCATÁRIOS totalmente adimplentes com suas obrigações contratuais e constatada a ausência de danos ao imóvel, o valor da caução, devidamente corrigido pela poupança, será devolvido aos LOCATÁRIOS no prazo de até 30 (trinta) dias úteis após a entrega das chaves e o encerramento das obrigações contratuais.</p>
    <p><strong>Dados bancários para o depósito caução:</strong><br/>
    • Banco: {{CAUCAO_BANCO}} - {{CAUCAO_BANCO_CODIGO}}<br/>
    • Titular: {{CAUCAO_TITULAR}}<br/>
    • CPF/CNPJ: {{CAUCAO_CPF}}<br/>
    • Agência: {{CAUCAO_AGENCIA}}<br/>
    • Conta: {{CAUCAO_CONTA}}</p>
    [[ENDIF]]
    [[IF GARANTIA_FIANCA]]
    <p>O FIADOR supra qualificado assume responsabilidade solidária por todas as obrigações locatícias até a efetiva entrega das chaves, renunciando expressamente aos benefícios dos artigos 827 e 835 do Código Civil brasileiro.</p>
    [[ENDIF]]
    [[IF GARANTIA_SEGURO]]
    <p>O LOCATÁRIO apresentará apólice de seguro fiança locatícia, renovando-a anualmente enquanto durar a locação. O atraso na renovação ou pagamento da apólice constituirá infração contratual grave, ensejando rescisão por justa causa.</p>
    [[ENDIF]]
    [[IF GARANTIA_NENHUMA]]
    <p>O presente contrato é firmado SEM garantia. Fica autorizado ao Locador exigir o aluguel até o 6º dia útil do mês a vencer e, em caso de inadimplência, acionar despejo liminar em 15 dias.</p>
    [[ENDIF]]
</div>
            `
        },
        {
            key: 'seguro_incendio',
            titulo: 'Seguro Contra Incêndio',
            obrigatoria: true,
            semNumero: true,
            textoHtml: `
<div style="font-size: 14px; text-align: left; line-height: 1.6;">
    <p><strong>SEGURO INCÊNDIO:</strong> Nos termos do artigo 22, inciso VIII da Lei nº 8.245/91, fica convencionado entre as partes que os LOCATÁRIOS assumem a obrigação de contratar e manter vigente, durante toda a locação, um seguro contra incêndio em favor do imóvel, cobrindo danos estruturais, conforme prática de mercado.</p>
    <p>Os LOCATÁRIOS deverão apresentar à LOCADORA a apólice do seguro no prazo máximo de 30 (trinta) dias contados da assinatura deste contrato, bem como manter os pagamentos das parcelas em dia, sob pena de infração contratual.</p>
</div>
            `
        },
        {
            key: 'bases_contratuais_header',
            titulo: 'Título Bases Contratuais',
            obrigatoria: true,
            semNumero: true,
            textoHtml: `
<h3 style="color: #ed1c24; font-size: 16px; border-bottom: 2px solid #ed1c24; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px;">BASES CONTRATUAIS</h3>
            `
        },
        {
            key: 'clausula_finalidade',
            titulo: 'Da Finalidade',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DA FINALIDADE:</strong> Os LOCATÁRIOS comprometem-se a não alterar a finalidade do imóvel locado, sob pena de infração contratual.</p>
            `
        },
        {
            key: 'clausula_devolucao_imovel',
            titulo: 'Da Devolução do Imóvel',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DA DEVOLUÇÃO DO IMÓVEL:</strong> O prazo de locação é determinado, devendo os LOCATÁRIOS restituir o imóvel à LOCADORA imediatamente ao final do prazo, totalmente desocupado, nas mesmas condições em que o recebeu. O contrato pode ser renovado mediante ajuste entre as partes, devendo, para tanto, os LOCATÁRIOS manifestarem sua vontade de renovação com, no mínimo, 60 (sessenta) dias de antecedência em relação ao término do contrato.</p>
            `
        },
        {
            key: 'clausula_multa_atraso',
            titulo: 'Da Multa por Atraso',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DA MULTA POR ATRASO NO PAGAMENTO:</strong> Não vindo a efetuar o pagamento do aluguel até a data estipulada, o locatário fica obrigado a pagar multa de 10% (dez por cento) sobre o valor do aluguel estipulado neste contrato, bem como juros de mora de 1% (um por cento) ao mês, mais correção monetária, sem prejuízo de eventuais multas, juros e correções monetárias por atraso no pagamento do IPTU e condomínio. Na hipótese de cobrança judicial ou extrajudicial dos aluguéis e encargos eventualmente inadimplidos, por assessoria jurídica, fica o locatário obrigado ao pagamento de 20% (vinte por cento) de honorários advocatícios sobre o valor total do débito.
[[IF !IS_PACOTE]]
<br/><em>Parágrafo único:</em> O valor da locação é composto pelo aluguel e pelo IPTU, sendo este repassado, por meio da administradora, à LOCADORA, que ficará responsável pelo pagamento.
[[ENDIF]]</p>
            `
        },
        {
            key: 'clausula_encargos_consumo',
            titulo: 'Dos Encargos e Consumo',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DOS ENCARGOS E CONSUMO:</strong> Os encargos locatícios de consumo de água, energia elétrica e gás são de responsabilidade dos LOCATÁRIOS, conforme detalhado a seguir:<br/>
1. Consumo de água: O consumo de água é medido e cobrado pelo condomínio, sendo o valor correspondente repassado para o boleto de locação, de responsabilidade dos LOCATÁRIOS para pagamento.<br/>
2. Consumo de energia elétrica e gás: Os LOCATÁRIOS deverão proceder com a transferência da conta de energia elétrica e gás para o seu nome junto à concessionária responsável, no prazo máximo de 10 (dez) dias contados da assinatura do presente contrato.</p>
            `
        },
        {
            key: 'clausula_conservacao_habitabilidade',
            titulo: 'Da Conservação e Vistoria',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DA CONSERVAÇÃO E VISTORIA:</strong> O imóvel encontra-se in perfeitas condições de habitabilidade e funcionamento. Os LOCATÁRIOS comprometem-se a zelar pelo imóvel, utilizá-lo de forma adequada, não danificá-lo, destruí-lo ou desviar sua finalidade, sob pena de infração contratual and responsabilização pelos danos, nos termos da lei. Ao término da locação, os LOCATÁRIOS deverão devolver o imóvel [[IF OPCIONAIS.PINTURA_NOVA]]completamente pintado de novo com tinta de primeira qualidade (marca Suvinil ou equivalente)[[ELSE]]pintado[[ENDIF]] e in condições compatíveis com o estado de conservação em que o receberam, conforme verificado no Termo de Vistoria, excetuados os desgastes naturais decorrentes do uso regular. [[IF OPCIONAIS.VISTORIA_DETALHADA]]O presente contrato é acompanhado por um Laudo de Vistoria detalhado com fotografias que atestam o estado real de conservação do imóvel no momento da entrega das chaves, o qual passa a integrar este instrumento para todos os fins de direito.[[ENDIF]]</p>
            `
        },
        {
            key: 'clausula_animais_estimacao',
            titulo: 'Dos Animais de Estimação',
            obrigatoria: false,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DOS ANIMAIS DE ESTIMAÇÃO:</strong> Os LOCATÁRIOS ficam desde já autorizados a manter animais domésticos no imóvel, sob as seguintes condições:<br/>
1. Os animais devem ser mantidos dentro da unidade locada e não devem ser deixados soltos nas áreas comuns do condomínio.<br/>
2. Os LOCATÁRIOS são responsáveis por garantir que os animais não causem perturbação excessiva aos vizinhos, incluindo barulhos excessivos ou comportamento agressivo.<br/>
3. É de responsabilidade dos LOCATÁRIOS garantir que os animais estejam devidamente vacinados e com boa saúde. Os LOCATÁRIOS devem cumprir todas as regras e regulamentos do condomínio relacionados a animais de estimação, incluindo o uso de guia nas áreas comuns.<br/>
4. Em caso de danos causados pelos animais às instalações do imóvel, os LOCATÁRIOS serão responsáveis por cobrir os custos de reparo.</p>
            `
        },
        {
            key: 'clausula_sinistro_desapropriacao',
            titulo: 'Da Desapropriação e Sinistro',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DA DESAPROPRIAÇÃO E SINISTRO:</strong> Em virtude de desapropriação, incêndio ou desabamento ou qualquer ocorrência que impeça o uso normal do imóvel, o presente contrato será resolvido, sendo desnecessário o pagamento de multa ou indenização por ambas as partes.<br/>
<em>Parágrafo único:</em> A parte que der causa ao prejuízo será responsabilizada por sua ação ou omissão, nos termos da lei, além do pagamento das multas previstas neste contrato.</p>
            `
        },
        {
            key: 'clausula_benfeitorias_autorizacao',
            titulo: 'Das Benfeitorias e Sublocação',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DAS BENFEITORIAS E SUBLOCAÇÃO:</strong> Os LOCATÁRIOS não poderão realizar qualquer benfeitoria no imóvel sem a prévia autorização por escrito da LOCADORA, exceto aquelas de caráter urgente que sejam indispensáveis e não possam aguardar a aprovação da LOCADORA. O LOCATÁRIO reconhece que apenas as benfeitorias necessárias, conforme definidas pela lei, darão direito a reembolso pela LOCADORA. Além disso, os LOCATÁRIOS estão expressamente proibidos de realizar qualquer modificação no imóvel, incluindo alterações na pintura, ou modificações nos móveis existentes, sem o consentimento prévio do LOCADOR. Da mesma forma, fica [[IF OPCIONAIS.SUBLOCACAO]]expressamente proibida[[ELSE]]autorizada[[ENDIF]] a sublocação do imóvel, seja parcial ou total, [[IF OPCIONAIS.SUBLOCACAO]]sem[[ELSE]]mediante[[ENDIF]] autorização prévia da LOCADORA.</p>
            `
        },
        {
            key: 'clausula_rescisao_judicial',
            titulo: 'Da Rescisão por Inadimplemento',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DA RESCISÃO POR INADIMPLEMENTO:</strong> O presente contrato poderá ser rescindido pelo inadimplemento de qualquer obrigação contratual, sendo facultada à parte inocente a decisão sobre sua rescisão, nos 30 (trinta) dias subsequentes à data da infração ou de sua descoberta, tendo direito a receber a multa rescisória prevista neste contrato.</p>
            `
        },
        {
            key: 'clausula_desocupacao_vistoria',
            titulo: 'Da Desocupação e Vistoria de Saída',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DA DESOCUPAÇÃO E VISTORIA DE SAÍDA:</strong> Na intenção de desocupação do imóvel antes do término do contrato, os LOCATÁRIOS deverão obrigatoriamente comunicar a administradora com, no mínimo, 30 (trinta) dias de antecedência, e marcar dia e hora para a vistoria de desocupação, sendo obrigatória a presença dos LOCATÁRIOS ou seu representante neste momento.</p>
            `
        },
        {
            key: 'clausula_direito_preferencia_venda',
            titulo: 'Do Direito de Preferência',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DO DIREITO DE PREFERÊNCIA E INTERMEDIAÇÃO:</strong> Caso os LOCATÁRIOS tenham interesse na compra do imóvel objeto desta locação, bem como a LOCADORA tenha interesse em vendê-lo aos LOCATÁRIOS, ambos comprometem-se a realizar a transação por intermédio da R.Sales Imóveis, que ficará responsável por todos os procedimentos referentes à transação imobiliária, desde a negociação entre as partes, o contrato e a formalização do negócio perante o cartório e órgãos competentes, cujos honorários da administradora deverão ser pagos pelo LOCADOR/Vendedor, nos limites estabelecidos pelo Conselho Regional de Corretores de Imóveis de São Paulo – CRECI-SP.</p>
            `
        },
        {
            key: 'clausula_regras_convencoes_condominio',
            titulo: 'Das Regras do Condomínio',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DAS REGRAS DO CONDOMÍNIO:</strong> Sendo o imóvel objeto desta locação unidade de condomínio edilício, os LOCATÁRIOS se obrigam a cumprir todas as suas regras, regulamentos e convenções, sendo responsável por eventuais multas oriundas de suas ações, omissões e conduta perante o condomínio, bem como em qualquer eventual despesa adicional que venha no boleto condominial referente a aluguel de salão de festas entre outros.</p>
            `
        },
        {
            key: 'clausula_infracao_criminal_reputacao',
            titulo: 'Da Infração Criminal',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DA INFRAÇÃO CRIMINAL:</strong> As infrações legais de ordem criminal que os LOCATÁRIOS ou LOCADORA cometerem em relação à propriedade ou uso do imóvel geram faculdade para a parte inocente de rescindir o contrato de locação, sob pena de pagamento de multa rescisória pela parte infringente.</p>
            `
        },
        {
            key: 'clausula_eleicao_foro',
            titulo: 'Do Foro',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DO FORO:</strong> As partes elegem o foro da comarca de [[IF OPCIONAIS.FORO_SAO_PAULO]]São Paulo-SP[[ELSE]]Poá-SP[[ENDIF]] para resolver questões judiciais oriundas deste contrato, ficando a parte vencida responsável pelas despesas judiciais, além de honorários advocatícios na razão de 20% (vinte por cento) sobre o valor da causa.</p>
            `
        },
        {
            key: 'clausula_autorizacao_dados_lgpd',
            titulo: 'Proteção de Dados (LGPD)',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – AUTORIZAÇÃO DE TRATAMENTO DE DADOS (LGPD):</strong> Os CONTRATANTES de forma livre, informada e inequívoca concordam com o tratamento de seus dados pela imobiliária administradora da locação, no legítimo interesse dos mesmos e para a finalidade do presente instrumento, em conformidade com a Lei nº 13.709/2018 – Lei Geral de Proteção de Dados Pessoais (LGPD).</p>
            `
        },
        {
            key: 'clausula_contratacao_assinatura_digital',
            titulo: 'Da Contratação Digital',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DA CONTRATAÇÃO DIGITAL:</strong> Os CONTRATANTES declaram e concordam que o presente instrumento, incluindo todas as páginas de assinatura e eventuais anexos, poderão ser todos formados por meio digital com o qual expressamente declaram concordar, representam a integralidade dos termos entre elas acordados, substituindo quaisquer outros acordos anteriores formalizados por qualquer outro meio, verbal ou escrito, físico ou digital, nos termos dos art. 107, 219 e 220 do Código Civil. Adicionalmente, nos termos do art. 10, § 2º, da Medida Provisória nº 2.200-2, e do art. 2º, I da MP 983/2020, as PARTES expressamente concordam em utilizar e reconhecem como válida qualquer forma de comprovação de anuência aos termos ora acordados em formato eletrônico.</p>
            `
        },
        {
            key: 'anexo_laudo_vistoria',
            titulo: 'Anexo I - Laudo de Vistoria',
            obrigatoria: true,
            semNumero: true,
            textoHtml: `
[[IF ESTADO_CONSERVACAO]]
<div style="page-break-before: always;"></div>
<h3 style="color: #ed1c24; font-size: 16px; border-bottom: 2px solid #ed1c24; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px;">ANEXO I - LAUDO DE CONSERVAÇÃO E VISTORIA DO IMÓVEL</h3>
<p><strong>Data da Vistoria:</strong> {{DATA_VISTORIA}}</p>
<p><strong>1. DESCRIÇÃO DO ESTADO DE CONSERVAÇÃO DO IMÓVEL:</strong></p>
<div style="padding-left: 20px; margin-bottom: 15px;">
    <p>{{ESTADO_CONSERVACAO}}</p>
</div>

<p><strong>2. REGISTRO FOTOGRÁFICO DA VISTORIA:</strong></p>
{{LAUDO_FOTOS_HTML}}
<div style="page-break-before: always;"></div>
[[ENDIF]]
            `
        },
        {
            key: 'assinaturas_finais',
            titulo: 'Assinaturas',
            obrigatoria: true,
            semNumero: true,
            textoHtml: `
{{ASSINATURAS_HTML}}

<p style="text-align: center; margin-top: 50px;">
    {{CIDADE_ASSINATURA}}, {{DATA_DOCUMENTO}}.
</p>
</div>
            `
        }
    ]),
    LocacaoComercial: JSON.stringify([
        {
            key: 'consideracoes_iniciais',
            titulo: 'Considerações Iniciais',
            obrigatoria: true,
            semNumero: true,
            textoHtml: `
<h2 style="text-align: center; color: #ed1c24; margin-bottom: 5px;">CONTRATO DE LOCAÇÃO DE IMÓVEL PARA FINS COMERCIAIS</h2>
[[IF GARANTIA_CAUCAO]]
<h3 style="text-align: center; color: #666; font-size: 16px; margin-top: 0px; margin-bottom: 20px;">GARANTIA LOCATÍCIA: DEPÓSITO CAUÇÃO</h3>
[[ENDIF]]
[[IF GARANTIA_FIANCA]]
<h3 style="text-align: center; color: #666; font-size: 16px; margin-top: 0px; margin-bottom: 20px;">GARANTIA LOCATÍCIA: FIANÇA</h3>
[[ENDIF]]
[[IF GARANTIA_SEGURO]]
<h3 style="text-align: center; color: #666; font-size: 16px; margin-top: 0px; margin-bottom: 20px;">GARANTIA LOCATÍCIA: SEGURO FIANÇA</h3>
[[ENDIF]]
[[IF GARANTIA_NENHUMA]]
<h3 style="text-align: center; color: #666; font-size: 16px; margin-top: 0px; margin-bottom: 20px;">SEM GARANTIA LOCATÍCIA</h3>
[[ENDIF]]

<div style="margin-top: 20px; font-size: 14px; text-align: left; line-height: 1.6;">
    <p><strong>CONSIDERAÇÕES INICIAIS:</strong></p>
    
    <p><strong>{{LOCADORES_LABEL}}:</strong> {{LOCADORES_LISTA}}</p>

    <p><strong>{{LOCATARIOS_LABEL}}:</strong> {{LOCATARIOS_LISTA}}</p>

    [[IF GARANTIA_FIANCA]]
    <p><strong>{{FIADORES_LABEL}}:</strong> {{FIADORES_LISTA}}</p>
    [[ENDIF]]

    <p><strong>QUALIFICAÇÃO DO IMÓVEL COMERCIAL:</strong> {{IMOVEL_TIPO}} [[IF IMOVEL_NUMERO]]nº {{IMOVEL_NUMERO}}[[ENDIF]][[IF IMOVEL_CONDOMINIO_NOME]], do condomínio/centro comercial denominado “{{IMOVEL_CONDOMINIO_NOME}}”[[ENDIF]], localizado na {{IMOVEL_ENDERECO_COMPLETO}}, CEP: {{IMOVEL_CEP}}, destinado exclusivamente para a atividade comercial do ramo de atuação dos LOCATÁRIOS.</p>

    <p><strong>FINALIDADE E ATIVIDADE:</strong> Comercial ({{FINALIDADE}})</p>

    <p><strong>PRAZO DE LOCAÇÃO COMERCIAL:</strong> O prazo de locação comercial será de {{PRAZO_MESES}} ({{PRAZO_MESES_EXTENSO}}) meses, com início previsto para o dia {{DATA_INICIO_PREVISTA}}, data em que ocorrerá a entrega oficial das chaves.</p>

    [[IF IS_PACOTE]]
    <p><strong>VALOR DA LOCAÇÃO:</strong> O aluguel mensal inicial (pacote fechado) é de R$ {{VALOR_ALUGUEL}} ({{VALOR_ALUGUEL_EXTENSO}}).</p>
    [[ELSE]]
    <p><strong>VALOR DA LOCAÇÃO E ENCARGOS:</strong> O aluguel mensal inicial é de R$ {{VALOR_ALUGUEL}} ({{VALOR_ALUGUEL_EXTENSO}}), acrescido de condomínio (R$ {{CONDOMINIO_VALOR}}) e IPTU (R$ {{IPTU_VALOR}}).</p>
    [[ENDIF]]

    <p><strong>DATA DE PAGAMENTO DO ALUGUEL:</strong> todo dia {{DIA_PAGAMENTO}} do mês subsequente ao vencido. Devendo ser pago através de boleto emitido pela administradora.</p>

    <p><strong>REAJUSTE DO VALOR DO ALUGUEL:</strong> O aluguel será reajustado anualmente a contar do início da locação, de acordo com o {{REAJUSTE_INDICE}}, apenas se positivo.</p>

    <p><strong>ENCARGOS LOCATÍCIOS DE CONSUMO:</strong> Água, energia elétrica, gás e despesas de consumo de responsabilidade dos LOCATÁRIOS.</p>

    <p><strong>MULTA RESCISÓRIA:</strong> {{MULTA_RESCISAO_ALUGUEIS}} (três) aluguéis vigentes à época da rescisão, proporcional ao tempo restante do contrato.</p>
</div>
            `
        },
        {
            key: 'garantia_locaticia',
            titulo: 'Garantia Locatícia',
            obrigatoria: true,
            semNumero: true,
            textoHtml: `
<div style="font-size: 14px; text-align: left; line-height: 1.6;">
    <p><strong>GARANTIA DE LOCAÇÃO:</strong></p>
    [[IF GARANTIA_CAUCAO]]
    <p>Os LOCATÁRIOS efetuarão o depósito caução comercial no valor de R$ {{CAUCAO_VALOR}} ({{CAUCAO_VALOR_EXTENSO}}), a ser efetuado na conta bancária designada:<br/>
    • Banco: {{CAUCAO_BANCO}} (Código {{CAUCAO_BANCO_CODIGO}})<br/>
    • Titular: {{CAUCAO_TITULAR}}<br/>
    • CPF/CNPJ: {{CAUCAO_CPF}}<br/>
    • Agência: {{CAUCAO_AGENCIA}}<br/>
    • Conta: {{CAUCAO_CONTA}}</p>
    [[ENDIF]]
    [[IF GARANTIA_FIANCA]]
    <p>Responsabilidade solidária assumida pelo FIADOR qualificado, até a efetiva entrega das chaves.</p>
    [[ENDIF]]
    [[IF GARANTIA_SEGURO]]
    <p>Garantido por Seguro Fiança contratado pelo LOCATÁRIO em favor do LOCADOR.</p>
    [[ENDIF]]
    [[IF GARANTIA_NENHUMA]]
    <p>O presente contrato é firmado SEM garantia locatícia.</p>
    [[ENDIF]]
</div>
            `
        },
        {
            key: 'seguro_incendio',
            titulo: 'Seguro de Incêndio e Responsabilidade Civil',
            obrigatoria: true,
            semNumero: true,
            textoHtml: `
<div style="font-size: 14px; text-align: left; line-height: 1.6;">
    <p><strong>SEGURO DE INCÊNDIO E RESPONSABILIDADE CIVIL:</strong> Os LOCATÁRIOS obrigam-se a contratar seguro de incêndio com cobertura especial de responsabilidade civil comercial.</p>
</div>
            `
        },
        {
            key: 'bases_contratuais_header',
            titulo: 'Título Bases Contratuais',
            obrigatoria: true,
            semNumero: true,
            textoHtml: `
<h3 style="color: #ed1c24; font-size: 16px; border-bottom: 2px solid #ed1c24; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px;">BASES CONTRATUAIS</h3>
            `
        },
        {
            key: 'clausula_licencas_alvaras',
            titulo: 'Das Licenças e Alvarás',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DA OBTENÇÃO DE LICENÇAS E ALVARÁS:</strong> Os LOCATÁRIOS obrigam-se a obter todas as licenças, alvarás e autorizações necessárias para a operação da sua atividade comercial perante os órgãos competentes.</p>
            `
        },
        {
            key: 'clausula_ramo_sublocacao',
            titulo: 'Do Ramo de Atividade e Sublocação',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DO RAMO DE ATIVIDADE E SUBLOCAÇÃO:</strong> É vedada a mudança do ramo de atividade comercial inicialmente declarado, bem como o empréstimo, cessão, sublocação ou transferência deste contrato, sob pena de rescisão e despejo.</p>
            `
        },
        {
            key: 'clausula_multa_atraso',
            titulo: 'Da Multa por Atraso',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DA MULTA POR ATRASO NO PAGAMENTO:</strong> O atraso no pagamento do aluguel implicará multa moratória de 10% (dez por cento) e juros de 1% ao mês, mais correção monetária. Na hipótese de cobrança por assessoria jurídica, arcará com honorários advocatícios de 20%.</p>
            `
        },
        {
            key: 'clausula_reformas_layout',
            titulo: 'Das Reformas e Adequações',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DAS REFORMAS E ADEQUAÇÕES:</strong> Quaisquer reformas, adequações de layout ou instalações elétricas/hidráulicas especiais para fins de comércio exigem prévia e expressa autorização por escrito do LOCADOR.</p>
            `
        },
        {
            key: 'clausula_conservacao_devolucao',
            titulo: 'Da Conservação e Devolução',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DA CONSERVAÇÃO E DEVOLUÇÃO:</strong> Ao término da locação, o imóvel deverá ser devolvido totalmente desocupado, limpo e [[IF OPCIONAIS.PINTURA_NOVA]]completamente pintado de novo com tinta de primeira qualidade[[ELSE]]pintado[[ENDIF]], nas mesmas condições recebidas.</p>
            `
        },
        {
            key: 'clausula_encargos_funcionamento',
            titulo: 'Dos Encargos de Funcionamento',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DOS ENCARGOS E FUNCIONAMENTO:</strong> As despesas com seguro, taxas de funcionamento e impostos de atividade são de responsabilidade integral do locatário.</p>
            `
        },
        {
            key: 'clausula_eleicao_foro',
            titulo: 'Do Foro',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DO FORO:</strong> Fica eleito o foro da comarca de [[IF OPCIONAIS.FORO_SAO_PAULO]]São Paulo-SP[[ELSE]]Poá-SP[[ENDIF]] para dirimir quaisquer dúvidas oriundas deste instrumento.</p>
            `
        },
        {
            key: 'clausula_lgpd_dados',
            titulo: 'Da Proteção de Dados (LGPD)',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – PROTEÇÃO DE DADOS (LGPD):</strong> As partes autorizam o tratamento de seus dados cadastrais para fins de cumprimento contratual e intermediação administrativa da locação.</p>
            `
        },
        {
            key: 'clausula_contratacao_digital',
            titulo: 'Da Contratação Digital',
            obrigatoria: true,
            textoHtml: `
<p><strong>CLÁUSULA {{NUMERO_CLAUSULA_EXTENSO}} – DA CONTRATAÇÃO DIGITAL:</strong> As partes declaram-se cientes e de pleno acordo com a validade jurídica das assinaturas eletrônicas apostas neste instrumento.</p>
            `
        },
        {
            key: 'anexo_laudo_vistoria',
            titulo: 'Anexo I - Laudo de Vistoria',
            obrigatoria: true,
            semNumero: true,
            textoHtml: `
[[IF ESTADO_CONSERVACAO]]
<div style="page-break-before: always;"></div>
<h3 style="color: #ed1c24; font-size: 16px; border-bottom: 2px solid #ed1c24; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px;">ANEXO I - LAUDO DE CONSERVAÇÃO E VISTORIA DO IMÓVEL</h3>
<p><strong>Data da Vistoria:</strong> {{DATA_VISTORIA}}</p>
<p><strong>1. DESCRIÇÃO DO ESTADO DE CONSERVAÇÃO DO IMÓVEL:</strong></p>
<div style="padding-left: 20px; margin-bottom: 15px;">
    <p>{{ESTADO_CONSERVACAO}}</p>
</div>

<p><strong>2. REGISTRO FOTOGRÁFICO DA VISTORIA:</strong></p>
{{LAUDO_FOTOS_HTML}}
<div style="page-break-before: always;"></div>
[[ENDIF]]
            `
        },
        {
            key: 'assinaturas_finais',
            titulo: 'Assinaturas',
            obrigatoria: true,
            semNumero: true,
            textoHtml: `
{{ASSINATURAS_HTML}}

<p style="text-align: center; margin-top: 50px;">
    {{CIDADE_ASSINATURA}}, {{DATA_DOCUMENTO}}.
</p>
</div>
            `
        }
    ]),
    CompraEVenda: `
<h2 style="text-align: center; color: #ed1c24; margin-bottom: 5px;">INSTRUMENTO PARTICULAR DE PROMESSA DE COMPRA E VENDA DE IMÓVEL</h2>
<h3 style="text-align: center; color: #666; font-size: 16px; margin-top: 0px; margin-bottom: 20px;">COM CLÁUSULA DE IRREVOGABILIDADE E IRRETRATABILIDADE</h3>

<div style="margin-top: 20px; font-size: 14px; text-align: left; line-height: 1.6;">
    <p><strong>DAS PARTES CONTRATANTES:</strong></p>
    
    <p><strong>{{VENDEDORES_LABEL}} (PROMITENTE VENDEDOR):</strong> {{VENDEDORES_LISTA}}</p>

    <p><strong>{{COMPRADORES_LABEL}} (PROMITENTE COMPRADOR):</strong> {{COMPRADORES_LISTA}}</p>

    <p><strong>CLÁUSULA PRIMEIRA - DO OBJETO:</strong> O objeto deste contrato é a promessa de compra e venda do imóvel: {{IMOVEL_TIPO}} [[IF IMOVEL_NUMERO]]nº {{IMOVEL_NUMERO}}[[ENDIF]][[IF IMOVEL_TORRE]], torre {{IMOVEL_TORRE}}[[ENDIF]][[IF IMOVEL_CONDOMINIO_NOME]], do condomínio “{{IMOVEL_CONDOMINIO_NOME}}”[[ENDIF]], situado na {{IMOVEL_ENDERECO_COMPLETO}}, matriculado sob o nº <strong>{{MATRICULA}}</strong> perante o Cartório de Registro de Imóveis competente, totalmente livre e desembaraçado de quaisquer ônus, impostos, taxas, dívidas ou gravames judiciais ou extrajudiciais.</p>

    <p><strong>CLÁUSULA SEGUNDA - DO PREÇO E DA FORMA DE PAGAMENTO:</strong> O preço total ajustado para a compra e venda do imóvel é de R$ <strong>{{VALOR_TOTAL}}</strong> ({{VALOR_TOTAL_EXTENSO}}), que será quitado da seguinte forma:</p>
    
    <p><strong>1. Sinal e Princípio de Pagamento:</strong> R$ {{VALOR_ENTRADA}} ({{VALOR_ENTRADA_EXTENSO}}), pagos na assinatura deste instrumento a título de sinal.</p>
    
    [[IF FORMA_PAGAMENTO]]
    <p><strong>2. Saldo Devedor e Condições Complementares:</strong> {{FORMA_PAGAMENTO}}</p>
    [[ELSE]]
    <p><strong>2. Saldo Devedor:</strong> O saldo devedor restante será pago in conformidade com as tratativas financeiras diretas entre as partes.</p>
    [[ENDIF]]

    <p><strong>CLÁUSULA TERCEIRA - DA IMISSÃO NA POSSE:</strong> O PROMITENTE COMPRADOR será imitido na posse precária do imóvel na data de outorga da escritura definitiva ou conforme data de entrega acordada: {{DATA_ENTREGA_CHAVES_OBS}}, passando a arcar com os impostos, condomínios e taxas que incidirem sobre o imóvel a partir da mesma.</p>

    <p><strong>CLÁUSULA QUARTA - DAS CERTIDÕES E DO DESEMBARAÇO:</strong> O(s) PROMITENTE(S) VENDEDOR(ES) obriga-se a apresentar todas as certidões negativas de ônus reais, certidões fiscais municipais, estaduais e federais, e certidões de distribuição de ações judiciais que comprovem a sua idoneidade financeira e a regularidade do imóvel objeto desta transação.</p>

    <p><strong>CLÁUSULA QUINTA - DA IRREVOGABILIDADE E IRRETRATABILIDADE:</strong> O presente contrato é pactuado em caráter irrevogável e irretratável, obrigando-se as partes, seus herdeiros e sucessores a qualquer título, renunciando expressamente ao direito de arrependimento.</p>

    <p><strong>CLÁUSULA SEXTA - DA ESCRITURA E DO REGISTRO:</strong> As despesas com a outorga da escritura pública de compra e venda, imposto de transmissão (ITBI) e taxas de registro cartorário correrão por conta exclusiva do PROMITENTE COMPRADOR.</p>

    <p><strong>CLÁUSULA SÉTIMA - DA MULTA CONVENCIONAL:</strong> O descumprimento de qualquer uma das cláusulas deste contrato sujeitará a parte infratora ao pagamento de multa equivalente a 10% (dez por cento) sobre o valor total do negócio, cobrada pela via judicial ou extrajudicial, sem prejuízo de perdas e danos.</p>

    <p><strong>CLÁUSULA OITAVA - DA AUTORIZAÇÃO DE TRATAMENTO DE DADOS (LGPD):</strong> Os contratantes consentem com o tratamento de seus dados pela administradora R.Sales Imóveis para os fins deste negócio.</p>

    <p><strong>CLÁUSULA NONA - DO FORO E DA ASSINATURA DIGITAL:</strong> As partes elegem o foro da comarca de [[IF OPCIONAIS.FORO_SAO_PAULO]]São Paulo-SP[[ELSE]]Poá-SP[[ENDIF]] para dirimir eventuais litígios judiciais. E, por estarem acordadas, assinam eletronicamente o presente instrumento.</p>
</div>
    `,
    CompraEVendaResidencial: `
<h2 style="text-align: center; color: #ed1c24; margin-bottom: 5px;">INSTRUMENTO PARTICULAR DE PROMESSA DE COMPRA E VENDA DE IMÓVEL RESIDENCIAL</h2>
<h3 style="text-align: center; color: #666; font-size: 16px; margin-top: 0px; margin-bottom: 20px;">COM CLÁUSULA DE IRREVOGABILIDADE E IRRETRATABILIDADE</h3>

<div style="margin-top: 20px; font-size: 14px; text-align: left; line-height: 1.6;">
    <p><strong>DAS PARTES CONTRATANTES:</strong></p>
    
    <p><strong>{{VENDEDORES_LABEL}} (PROMITENTE VENDEDOR):</strong> {{VENDEDORES_LISTA}}</p>

    <p><strong>{{COMPRADORES_LABEL}} (PROMITENTE COMPRADOR):</strong> {{COMPRADORES_LISTA}}</p>

    <p><strong>[CLAUSULA:clausula_partes] - DA QUALIFICAÇÃO E CAPACIDADE:</strong> As partes acima qualificadas declaram, sob as penas da lei, possuir plena capacidade civil para a celebração deste compromisso, obrigando-se por si, seus herdeiros e sucessores ao fiel cumprimento de todas as obrigações pactuadas.</p>

    <p><strong>[CLAUSULA:clausula_objeto] - DO OBJETO:</strong> O objeto deste contrato é a promessa de compra e venda do imóvel residencial: {{IMOVEL_TIPO}} [[IF IMOVEL_NUMERO]]nº {{IMOVEL_NUMERO}}[[ENDIF]][[IF IMOVEL_TORRE]], torre {{IMOVEL_TORRE}}[[ENDIF]][[IF IMOVEL_CONDOMINIO_NOME]], do condomínio “{{IMOVEL_CONDOMINIO_NOME}}”[[ENDIF]], situado na {{IMOVEL_ENDERECO_COMPLETO}}, matriculado sob o nº <strong>{{MATRICULA}}</strong> perante o Cartório de Registro de Imóveis competente, totalmente livre e desembaraçado de quaisquer ônus, impostos, taxas, dívidas ou gravames judiciais ou extrajudiciais.</p>

    <p><strong>[CLAUSULA:clausula_ad_corpus] - DA VENDA "AD CORPUS":</strong> A presente transação imobiliária é pactuada em caráter "Ad Corpus", ou seja, o imóvel é vendido como coisa certa e discriminada, sendo as dimensões e áreas descritas na matrícula meramente enunciativas, sem direito a qualquer complemento de área ou abatimento de preço caso ocorram eventuais divergências de metragem.</p>

    <p><strong>[CLAUSULA:clausula_preco_pagamento] - DO PREÇO E DA FORMA DE PAGAMENTO:</strong> O preço total ajustado para a compra e venda do imóvel é de R$ <strong>{{VALOR_TOTAL}}</strong> ({{VALOR_TOTAL_EXTENSO}}), que será quitado da seguinte forma:</p>
    
    <p style="padding-left: 20px;"><strong>1. Sinal e Princípio de Pagamento:</strong> R$ {{VALOR_ENTRADA}} ({{VALOR_ENTRADA_EXTENSO}}), pagos na assinatura deste instrumento a título de sinal e princípio de pagamento.</p>

    [[IF PAGAMENTO_AVISTA_QUITACAO]]
    <div style="padding-left: 20px;">
        <p><strong>[CLAUSULA:clausula_pagamento_avista_quitacao] - DA QUITAÇÃO DE DÍVIDA E SALDO À VISTA:</strong> O saldo devedor restante será quitado à vista, sendo que parte deste valor será destinado pelo PROMITENTE COMPRADOR diretamente para a liquidação integral do saldo devedor da alienação fiduciária existente junto à instituição financeira credora, com o objetivo de obter o termo de quitação e baixa de gravame. O saldo remanescente será pago no ato da outorga da Escritura Definitiva de Compra e Venda.</p>
    </div>
    [[ENDIF]]

    [[IF PAGAMENTO_FINANCIADO]]
    <div style="padding-left: 20px;">
        <p><strong>[CLAUSULA:clausula_pagamento_financiado] - DO SALDO MEDIANTE FINANCIAMENTO BANCÁRIO:</strong> O saldo devedor restante será quitado mediante recursos obtidos de Financiamento Bancário, a ser contratado pelo PROMITENTE COMPRADOR no prazo estimado de até 90 (noventa) dias contados desta data.</p>
        <p style="padding-left: 20px;"><strong>Parágrafo Único (Aprovação Parcial de Crédito):</strong> Caso a instituição financeira conceda crédito em montante inferior ao saldo necessário para a quitação integral da transação (condicionamento de crédito), o PROMITENTE COMPRADOR obriga-se a pagar a diferença diretamente ao PROMITENTE VENDEDOR, com recursos próprios, no prazo improrrogável de até 20 (vinte) dias contados da respectiva notificação da aprovação parcial.</p>
    </div>
    [[ENDIF]]

    [[IF FORMA_PAGAMENTO_OUTROS]]
    <div style="padding-left: 20px;">
        <p><strong>2. Saldo Devedor e Condições Complementares:</strong> {{FORMA_PAGAMENTO}}</p>
    </div>
    [[ENDIF]]

    <p><strong>[CLAUSULA:clausula_imissao_posse] - DA IMISSÃO NA POSSE:</strong> O PROMITENTE COMPRADOR será imitido na posse precária do imóvel na data de outorga da escritura definitiva ou conforme data de entrega acordada: {{DATA_ENTREGA_CHAVES_OBS}}, passando a arcar com os impostos, condomínios e taxas que incidirem sobre o imóvel a partir da mesma.</p>

    [[IF BENS_INCLUSOS]]
    <p><strong>[CLAUSULA:clausula_bens_inclusos] - DOS MÓVEIS E BENFEITORIAS INCLUSAS:</strong> Estão inclusos no preço e integram a presente transação os móveis planejados, jacuzzi, aparelhos de ar condicionado e demais benfeitorias/itens de mobília listados no inventário a seguir, que guarnecem o imóvel e serão entregues pelo PROMITENTE VENDEDOR em perfeito estado de funcionamento: <br/>{{INVENTARIO_MOVEIS}}</p>
    [[ENDIF]]

    [[IF MULTA_POSSE]]
    <p><strong>[CLAUSULA:clausula_multa_posse] - DA MULTA POR ATRASO NA ENTREGA DA POSSE (TAXA DE OCUPAÇÃO):</strong> Caso o PROMITENTE VENDEDOR não proceda à entrega definitiva das chaves e da posse do imóvel no prazo acordado, incidirá, a título de taxa de ocupação e aluguel pró-rata, multa de R$ {{TAXA_OCUPACAO_MENSAL}} ({{TAXA_OCUPACAO_MENSAL_EXTENSO}}) por mês de atraso, contada dia a dia até a efetiva imissão do PROMITENTE COMPRADOR na posse do imóvel, sem prejuízo das demais penalidades cabíveis.</p>
    [[ENDIF]]

    <p><strong>[CLAUSULA:clausula_certidoes] - DAS CERTIDÕES E DO DESEMBARAÇO:</strong> O(s) PROMITENTE(S) VENDEDOR(ES) obriga-se a apresentar todas as certidões negativas de ônus reais, certidões fiscais municipais, estaduais e federais, e certidões de distribuição de ações judiciais que comprovem a sua idoneidade financeira e a regularidade do imóvel objeto desta transação.</p>

    <p><strong>[CLAUSULA:clausula_comissao_fixa] - DA COMISSÃO DE INTERMEDIAÇÃO:</strong> As partes reconhecem expressamente que a imobiliária <strong>R. Sales Imóveis</strong> realizou a intermediação útil da presente transação, fazendo jus à comissão de corretagem acordada. O PROMITENTE VENDEDOR assume a responsabilidade exclusiva pelo pagamento integral da referida comissão à intermediadora, a ser paga no ato do recebimento do sinal previsto na {ref:clausula_preco_pagamento}, aplicando-se as penalidades da {ref:clausula_multa_convencional} em caso de inadimplemento.</p>

    <p><strong>[CLAUSULA:clausula_irrevogabilidade] - DA IRREVOGABILIDADE E IRRETRATABILIDADE:</strong> O presente contrato é pactuado em caráter irrevogável e irretratável, obrigando-se as partes, seus herdeiros e sucessores a qualquer título, renunciando expressamente ao direito de arrependimento.</p>

    <p><strong>[CLAUSULA:clausula_escritura] - DA ESCRITURA E DO REGISTRO:</strong> As despesas com a outorga da escritura pública de compra e venda, imposto de transmissão (ITBI) e taxas de registro cartorário correrão por conta exclusiva do PROMITENTE COMPRADOR.</p>

    <p><strong>[CLAUSULA:clausula_multa_convencional] - DA MULTA CONVENCIONAL:</strong> O descumprimento de qualquer uma das cláusulas deste contrato sujeitará a parte infratora ao pagamento de multa equivalente a 10% (dez por cento) sobre o valor total do negócio, cobrada pela via judicial ou extrajudicial, sem prejuízo de perdas e danos.</p>

    <p><strong>[CLAUSULA:clausula_lgpd] - DA LGPD:</strong> Os contratantes consentem com o tratamento de seus dados pela administradora R.Sales Imóveis para os fins deste negócio.</p>

    <p><strong>[CLAUSULA:clausula_foro] - DO FORO E ELEIÇÃO:</strong> As partes elegem o foro da comarca de [[IF OPCIONAIS.FORO_SAO_PAULO]]São Paulo-SP[[ELSE]]Poá-SP[[ENDIF]] para dirimir eventuais litígios judiciais.</p>

    <p><strong>[CLAUSULA:clausula_assinatura_eletronica] - DA ASSINATURA ELETRÔNICA:</strong> As partes declaram-se cientes e de acordo com a validade jurídica das assinaturas eletrônicas apostas neste contrato por meio da plataforma You Digital (em conformidade com a ICP-Brasil), reconhecendo-as como plenamente válidas e eficazes para todos os fins de direito.</p>

    [[IF ESTADO_CONSERVACAO]]
    <div style="page-break-before: always;"></div>
    <h3 style="color: #ed1c24; font-size: 16px; border-bottom: 2px solid #ed1c24; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px;">ANEXO I - LAUDO DE CONSERVAÇÃO E VISTORIA DO IMÓVEL</h3>
    <p><strong>Data da Vistoria:</strong> {{DATA_VISTORIA}}</p>
    <p><strong>1. DESCRIÇÃO DO ESTADO DE CONSERVAÇÃO DO IMÓVEL:</strong></p>
    <div style="padding-left: 20px; margin-bottom: 15px;">
        <p>{{ESTADO_CONSERVACAO}}</p>
    </div>
    
    <p><strong>2. REGISTRO FOTOGRÁFICO DA VISTORIA:</strong></p>
    {{LAUDO_FOTOS_HTML}}
    <div style="page-break-before: always;"></div>
    [[ENDIF]]

    {{ASSINATURAS_HTML}}

    <p style="text-align: center; margin-top: 50px;">
        {{CIDADE_ASSINATURA}}, {{DATA_DOCUMENTO}}.
    </p>
</div>
    `,
    CompraEVendaComercial: `
<h2 style="text-align: center; color: #ed1c24; margin-bottom: 5px;">INSTRUMENTO PARTICULAR DE PROMESSA DE COMPRA E VENDA DE IMÓVEL COMERCIAL</h2>
<h3 style="text-align: center; color: #666; font-size: 16px; margin-top: 0px; margin-bottom: 20px;">COM CLÁUSULA DE IRREVOGABILIDADE E IRRETRATABILIDADE</h3>

<div style="margin-top: 20px; font-size: 14px; text-align: left; line-height: 1.6;">
    <p><strong>DAS PARTES CONTRATANTES:</strong></p>
    
    <p><strong>{{VENDEDORES_LABEL}} (PROMITENTE VENDEDOR):</strong> {{VENDEDORES_LISTA}}</p>

    <p><strong>{{COMPRADORES_LABEL}} (PROMITENTE COMPRADOR):</strong> {{COMPRADORES_LISTA}}</p>

    <p><strong>[CLAUSULA:clausula_partes_pj] - DA QUALIFICAÇÃO E CAPACIDADE DAS PARTES:</strong> As partes acima identificadas, sendo representadas na forma de seus atos constitutivos quando pessoas jurídicas, declaram sob as penas da lei possuir plena capacidade jurídica e poderes bastantes para assumir os compromissos aqui pactuados, obrigando-se por si, seus herdeiros, sucessores e cessionários ao fiel cumprimento deste contrato.</p>

    <p><strong>[CLAUSULA:clausula_objeto_comercial] - DO OBJETO:</strong> O objeto do presente contrato é a promessa de compra e venda do imóvel comercial de tipo {{IMOVEL_TIPO}} [[IF IMOVEL_NUMERO]]nº {{IMOVEL_NUMERO}}[[ENDIF]][[IF IMOVEL_TORRE]], torre {{IMOVEL_TORRE}}[[ENDIF]][[IF IMOVEL_CONDOMINIO_NOME]], do condomínio “{{IMOVEL_CONDOMINIO_NOME}}”[[ENDIF]], situado na {{IMOVEL_ENDERECO_COMPLETO}}, matriculado sob o nº <strong>{{MATRICULA}}</strong> perante o Cartório de Registro de Imóveis competente, totalmente livre e desembaraçado de quaisquer ônus, gravames, impostos, taxas ou dívidas, [[IF IMOVEL_LOCADO]]com observância ao disposto na {ref:clausula_respeito_locacao},[[ENDIF]] declarando o PROMITENTE COMPRADOR ter vistoriado o imóvel e aceito o seu estado de conservação.</p>

    <p><strong>[CLAUSULA:clausula_preco_pagamento_comercial] - DO PREÇO E DA FORMA DE PAGAMENTO:</strong> O preço total e certo ajustado para a compra e venda do imóvel comercial é de R$ <strong>{{VALOR_TOTAL}}</strong> ({{VALOR_TOTAL_EXTENSO}}), que será quitado pelo PROMITENTE COMPRADOR da seguinte forma:</p>
    
    <p style="padding-left: 20px;"><strong>1. Sinal e Princípio de Pagamento:</strong> R$ {{VALOR_ENTRADA}} ({{VALOR_ENTRADA_EXTENSO}}), pagos na assinatura deste instrumento a título de sinal e princípio de pagamento.</p>

    [[IF PAGAMENTO_AVISTA_QUITACAO]]
    <div style="padding-left: 20px;">
        <p><strong>[CLAUSULA:clausula_pagamento_comercial_avista_quitacao] - DA QUITAÇÃO DE DÍVIDA E SALDO À VISTA:</strong> O saldo devedor restante será quitado à vista, sendo que parte deste valor será destinado pelo PROMITENTE COMPRADOR diretamente para a liquidação integral do saldo devedor da alienação fiduciária existente junto à instituição financeira credora, com o objetivo de obter o termo de quitação e baixa de gravame. O saldo remanescente será pago no ato da outorga da Escritura Definitiva de Compra e Venda.</p>
    </div>
    [[ENDIF]]

    [[IF PAGAMENTO_FINANCIADO]]
    <div style="padding-left: 20px;">
        <p><strong>[CLAUSULA:clausula_pagamento_comercial_financiado] - DO SALDO MEDIANTE FINANCIAMENTO BANCÁRIO:</strong> O saldo devedor restante será quitado mediante recursos obtidos de Financiamento Bancário, a ser contratado pelo PROMITENTE COMPRADOR no prazo estimado de até 90 (noventa) dias contados desta data.</p>
        <p style="padding-left: 20px;"><strong>Parágrafo Único (Aprovação Parcial de Crédito):</strong> Caso a instituição financeira conceda crédito em montante inferior ao saldo necessário para a quitação integral da transação (condicionamento de crédito), o PROMITENTE COMPRADOR obriga-se a pagar a diferença diretamente ao PROMITENTE VENDEDOR, com recursos próprios, no prazo improrrogável de até 20 (vinte) dias contados da respectiva notificação da aprovação parcial.</p>
    </div>
    [[ENDIF]]

    [[IF FORMA_PAGAMENTO_OUTROS]]
    <div style="padding-left: 20px;">
        <p><strong>2. Saldo Devedor e Condições Complementares:</strong> {{FORMA_PAGAMENTO}}</p>
    </div>
    [[ENDIF]]

    <p><strong>[CLAUSULA:clausula_imissao_posse_comercial] - DA IMISSÃO NA POSSE:</strong> O PROMITENTE COMPRADOR será imitido na posse definitiva do imóvel na data de outorga da escritura definitiva ou conforme data de entrega acordada: {{DATA_ENTREGA_CHAVES_OBS}}, passando a arcar com todos os impostos, condomínios, taxas e tarifas de consumo que incidirem sobre o imóvel a partir desta data.</p>

    [[IF VENDA_FUNDO_COMERCIO]]
    <p><strong>[CLAUSULA:clausula_trespasse] - DA TRANSFERÊNCIA DE FUNDO DE COMÉRCIO (TRESPASSE):</strong> A presente transação compreende a venda do fundo de comércio localizado no imóvel, incluindo a transferência definitiva do ponto comercial, estoque de mercadorias, máquinas, equipamentos, utensílios e direito de uso da marca e do CNPJ operantes no local, conforme inventário de bens que passa a integrar este instrumento.</p>
    [[ELSE]]
    <p><strong>[CLAUSULA:clausula_imovel_vazio] - DA ENTREGA DO IMÓVEL COMERCIAL VAZIO E DESCARACTERIZADO:</strong> O PROMITENTE VENDEDOR obriga-se a entregar o imóvel comercial completamente desocupado de pessoas e coisas, bem como totalmente descaracterizado de sua marca, identidade visual, letreiros e operação anterior, de modo que o PROMITENTE COMPRADOR possa iniciar sua própria atividade sem embaraço de qualquer natureza.</p>
    [[ENDIF]]

    [[IF IMOVEL_LOCADO]]
    <p><strong>[CLAUSULA:clausula_respeito_locacao] - DO RESPEITO À LOCAÇÃO E INQUILINO EXISTENTE:</strong> O PROMITENTE COMPRADOR declara ter plena ciência de que o imóvel encontra-se locado a terceiros. O comprador assume expressamente a obrigação de respeitar os termos do contrato de locação vigente, sub-rogando-se em todos os direitos e deveres do locador anterior. Declaram ainda as partes que o direito de preferência legal do inquilino atual foi devidamente ofertado por escrito e formalmente declinado.</p>
    [[ENDIF]]

    [[IF RESPONSABILIDADE_ALVARA_COMPRADOR]]
    <p><strong>[CLAUSULA:clausula_risco_zoneamento] - DA RESPONSABILIDADE POR LICENÇAS, ALVARÁS E ZONEAMENTO:</strong> O PROMITENTE COMPRADOR declara sob sua inteira responsabilidade que procedeu à prévia consulta de viabilidade técnica e zoneamento urbano junto à Prefeitura Municipal, assumindo total e exclusivo risco quanto à obtenção e manutenção de alvarás de funcionamento, licenças ambientais, sanitárias e demais autorizações necessárias para a abertura e operação de sua atividade comercial específica no imóvel objeto desta venda, isentando o PROMITENTE VENDEDOR e a intermediadora de qualquer responsabilidade.</p>
    [[ENDIF]]

    <p><strong>[CLAUSULA:clausula_certidoes_comercial] - DAS CERTIDÕES E DO DESEMBARAÇO:</strong> O(s) PROMITENTE(S) VENDEDOR(ES) obriga-se a apresentar todas as certidões negativas de ônus reais, certidões fiscais municipais, estaduais e federais, e certidões de distribuição de ações judiciais que comprovem a sua idoneidade financeira e a regularidade do imóvel objeto desta transação.</p>

    <p><strong>[CLAUSULA:clausula_comissao] - DA COMISSÃO DE INTERMEDIAÇÃO E BASE IMOBILIÁRIA:</strong> As partes reconhecem expressamente que a imobiliária <strong>R. Sales Imóveis</strong> realizou a intermediação útil da presente transação, fazendo jus à comissão de corretagem acordada. O PROMITENTE VENDEDOR assume a responsabilidade exclusiva pelo pagamento integral da referida comissão à intermediadora, a ser paga no ato do recebimento do sinal previsto na {ref:clausula_preco_pagamento_comercial}, aplicando-se as penalidades da {ref:clausula_multa_convencional_comercial} em caso de inadimplemento.</p>

    <p><strong>[CLAUSULA:clausula_irrevogabilidade_comercial] - DA IRREVOGABILIDADE E IRRETRATABILIDADE:</strong> O presente contrato é pactuado em caráter irrevogável e irretratável, obrigando-se as partes, seus herdeiros e sucessores a qualquer título, renunciando expressamente ao direito de arrependimento.</p>

    <p><strong>[CLAUSULA:clausula_escritura_comercial] - DA ESCRITURA E DO REGISTRO:</strong> As despesas com a outorga da escritura pública de compra e venda, imposto de transmissão (ITBI) e taxas de registro cartorário correrão por conta exclusiva do PROMITENTE COMPRADOR.</p>

    <p><strong>[CLAUSULA:clausula_multa_convencional_comercial] - DA MULTA CONVENCIONAL:</strong> O descumprimento de qualquer uma das cláusulas deste contrato sujeitará a parte infratora ao pagamento de multa equivalente a 10% (dez por cento) sobre o valor total do negócio, cobrada pela via judicial ou extrajudicial, sem prejuízo de perdas e danos.</p>

    <p><strong>[CLAUSULA:clausula_lgpd_comercial] - DA LGPD:</strong> Os contratantes consentem com o tratamento de seus dados pela administradora R.Sales Imóveis para os fins deste negócio.</p>

    <p><strong>[CLAUSULA:clausula_foro] - DO FORO COMPETENTE E ELEIÇÃO:</strong> As partes elegem o foro da comarca de [[IF OPCIONAIS.FORO_SAO_PAULO]]São Paulo-SP[[ELSE]]Poá-SP[[ENDIF]] para dirimir eventuais litígios judiciais decorrentes deste instrumento.</p>

    <p><strong>[CLAUSULA:clausula_assinatura_eletronica_comercial] - DA ASSINATURA ELETRÔNICA:</strong> As partes declaram-se cientes e de acordo com a validade jurídica das assinaturas eletrônicas apostas neste contrato por meio da plataforma You Digital (em conformidade com a ICP-Brasil), reconhecendo-as como plenamente válidas e eficazes para todos os fins de direito.</p>

    [[IF ESTADO_CONSERVACAO]]
    <div style="page-break-before: always;"></div>
    <h3 style="color: #ed1c24; font-size: 16px; border-bottom: 2px solid #ed1c24; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px;">ANEXO I - LAUDO DE CONSERVAÇÃO E VISTORIA DO IMÓVEL COMERCIAL</h3>
    <p><strong>Data da Vistoria:</strong> {{DATA_VISTORIA}}</p>
    <p><strong>1. DESCRIÇÃO DO ESTADO DE CONSERVAÇÃO DO IMÓVEL:</strong></p>
    <div style="padding-left: 20px; margin-bottom: 15px;">
        <p>{{ESTADO_CONSERVACAO}}</p>
    </div>
    
    <p><strong>2. REGISTRO FOTOGRÁFICO DA VISTORIA:</strong></p>
    {{LAUDO_FOTOS_HTML}}
    <div style="page-break-before: always;"></div>
    [[ENDIF]]

    {{ASSINATURAS_HTML}}

    <p style="text-align: center; margin-top: 50px;">
        {{CIDADE_ASSINATURA}}, {{DATA_DOCUMENTO}}.
    </p>
</div>
    `,
    EntregaChaves: `
<h2 style="text-align: center; color: #ed1c24; margin-bottom: 5px;">TERMO DE VISTORIA E ENTREGA DE CHAVES</h2>
<h3 style="text-align: center; color: #666; font-size: 16px; margin-top: 0px; margin-bottom: 20px;">ANEXO INTEGRANTE DO CONTRATO DE LOCAÇÃO</h3>

<div style="margin-top: 20px; font-size: 14px; text-align: left; line-height: 1.6;">
    <p><strong>DA QUALIFICAÇÃO DO ATO:</strong></p>
    
    <p><strong>IMOVEL:</strong> {{IMOVEL_TIPO}} [[IF IMOVEL_NUMERO]]nº {{IMOVEL_NUMERO}}[[ENDIF]], localizado na {{IMOVEL_ENDERECO_COMPLETO}}.</p>
    <p><strong>{{LOCATARIOS_LABEL}}:</strong> {{LOCATARIOS_LISTA}}</p>
    <p><strong>{{LOCADORES_LABEL}}:</strong> {{LOCADORES_LISTA}}</p>

    <p>Pelo presente instrumento, as partes formalizam a entrega das chaves da unidade acima qualificada na data de {{DATA_ENTREGA_CHAVES}}, declarando e assentindo o seguinte:</p>

    <p><strong>CLÁUSULA PRIMEIRA - DA ENTREGA DAS CHAVES:</strong> O LOCADOR, por sua intermediadora R.Sales Imóveis, procede nesta data de {{DATA_ENTREGA_CHAVES}} à entrega de <strong>{{IMOVEL_VAGAS_GARAGEM}}</strong> cópia(s) de chaves de portas de acesso e controles de garagem aos LOCATÁRIOS, que declaram o recebimento das mesmas em pleno funcionamento.</p>

    <p><strong>CLÁUSULA SEGUNDA - DA VISTORIA E ACEITAÇÃO:</strong> Os LOCATÁRIOS declaram que efetuaram vistoria minuciosa no imóvel e atestam que o mesmo encontra-se nas exatas condições descritas no Laudo de Vistoria anexo com fotografias, com instalações elétricas, hidráulicas, pintura e portas em prefeito estado de conservação, habitabilidade e funcionamento.</p>

    <p><strong>CLÁUSULA TERCEIRA - DOS ENCARGOS DO IMÓVEL:</strong> A partir desta data de {{DATA_ENTREGA_CHAVES}}, os LOCATÁRIOS assumem a responsabilidade integral por todas as despesas decorrentes do uso do imóvel, tais como condomínio ordinário, IPTU, consumo de água, energia elétrica, gás e seguros.</p>

    <p><strong>CLÁUSULA QUARTA - DO FORO:</strong> Elegem o foro deste contrato nos mesmos termos do contrato de locação principal.</p>

    <h3 style="color: #ed1c24; font-size: 16px; border-bottom: 2px solid #ed1c24; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px;">LAUDO DE CONSERVAÇÃO E VISTORIA</h3>
    <p><strong>Data da Vistoria:</strong> {{DATA_VISTORIA}}</p>
    <p><strong>1. DESCRIÇÃO DO ESTADO DE CONSERVAÇÃO DO IMÓVEL:</strong></p>
    <div style="padding-left: 20px; margin-bottom: 15px;">
        <p>[[IF ESTADO_CONSERVACAO]]{{ESTADO_CONSERVACAO}}[[ELSE]]O imóvel é entregue em perfeito estado de conservação, habitabilidade e funcionamento, sem quaisquer ressalvas ou pendências apontadas pelas partes neste ato.[[ENDIF]]</p>
    </div>
    
    <p><strong>2. REGISTRO FOTOGRÁFICO DA VISTORIA:</strong></p>
    {{LAUDO_FOTOS_HTML}}

    {{ASSINATURAS_HTML}}

    <p style="text-align: center; margin-top: 50px;">
        {{CIDADE_ASSINATURA}}, {{DATA_DOCUMENTO}}.
    </p>
</div>
    `,
    DevolucaoChaves: `
<h2 style="text-align: center; color: #ed1c24; margin-bottom: 5px;">TERMO DE ENTREGA PROVISÓRIA DE CHAVES E VISTORIA DE SAÍDA</h2>
<h3 style="text-align: center; color: #666; font-size: 16px; margin-top: 0px; margin-bottom: 20px;">INSTRUMENTO DE DESOCUPAÇÃO E VISTORIA FINAL</h3>

<div style="margin-top: 20px; font-size: 14px; text-align: left; line-height: 1.6;">
    <p><strong>DATA:</strong> {{DATA_DOCUMENTO}}</p>
    <p><strong>{{LOCADORES_LABEL}}:</strong> {{LOCADORES_LISTA}}</p>
    <p><strong>{{LOCATARIOS_LABEL}}:</strong> {{LOCATARIOS_LISTA}}</p>
    <p><strong>IMÓVEL:</strong> {{IMOVEL_TIPO}} [[IF IMOVEL_NUMERO]]nº {{IMOVEL_NUMERO}}[[ENDIF]], localizado na {{IMOVEL_ENDERECO_COMPLETO}}.</p>

    <p>Pelo presente instrumento, as partes declaram:</p>

    <p><strong>1. DA ENTREGA DAS CHAVES:</strong><br/>
    O(A) {{LOCATARIOS_LABEL}} realiza, nesta data ({{DATA_VISTORIA}}), a entrega das chaves do imóvel acima descrito para a realização da Vistoria de Saída, em cumprimento à Cláusula Décima do contrato.</p>

    <p><strong>2. DA ISENÇÃO/COBRANÇA DE MULTA CONTRATUAL:</strong><br/>
    As partes reconhecem que [[IF INCIDE_MULTA]]incide[[ELSE]]não incide[[ENDIF]] multa rescisória pela desocupação antecipada [[IF MULTA_JUSTIFICATIVA]]({{MULTA_JUSTIFICATIVA}})[[ELSE]](uma vez que já foi cumprido o período mínimo de locação estipulado ou o prazo contratual foi integralmente observado)[[ENDIF]].</p>

    <p><strong>3. DA VISTORIA E APONTAMENTOS:</strong><br/>
    A entrega das chaves neste ato é provisória e não configura quitação plena. A quitação final dependerá da aprovação do estado de conservação do imóvel na vistoria a ser realizada.<br/>
    O imóvel deve ser devolvido nas mesmas condições in que foi recebido, exceto pelo desgaste natural, conforme a Cláusula Segunda e Cláusula Quinta do contrato original.<br/>
    Qualquer dano, furação não autorizada ou alteração na pintura constatada será apontada para reparo ou indenização.</p>

    <p><strong>3.1 DESCRIÇÃO DO ESTADO DE CONSERVAÇÃO (VISTORIA DE SAÍDA):</strong></p>
    <p><strong>Data da Vistoria:</strong> {{DATA_VISTORIA}}</p>
    <div style="padding-left: 20px; margin-bottom: 15px;">
        <p>[[IF ESTADO_CONSERVACAO]]{{ESTADO_CONSERVACAO}}[[ELSE]]O imóvel é devolvido em perfeito estado de conservação, ressalvados apenas os desgastes naturais decorrentes do uso regular, sem pendências adicionais constatadas na vistoria final.[[ENDIF]]</p>
    </div>

    <p><strong>3.2 REGISTRO FOTOGRÁFICO DA VISTORIA:</strong></p>
    {{LAUDO_FOTOS_HTML}}

    <p><strong>4. PENDÊNCIAS FINANCEIRAS E CONSUMO:</strong><br/>
    O Termo de Rescisão Final e a devolução da garantia serão processados após a verificação de:<br/>
    • Quitação dos aluguéis e condomínio proporcionais até a data de hoje;<br/>
    • Apresentação dos comprovantes de pagamento final e desligamento/transferência de titularidade das contas de Energia Elétrica e Gás;<br/>
    • Pagamento de eventual excedente de consumo de água cobrado pelo condomínio.</p>

    <p><strong>5. DA GARANTIA LOCATÍCIA:</strong><br/>
    O valor da garantia [[IF GARANTIA_CAUCAO]](Depósito Caução de R$ {{CAUCAO_VALOR}})[[ENDIF]][[IF GARANTIA_FIADOR]](Garantia por Fiador)[[ENDIF]][[IF GARANTIA_SEGURO_FIANCA]](Seguro Fiança)[[ENDIF]] será utilizado no acerto de contas final (deduzindo eventuais reparos ou débitos) ou devolvido/liberado integralmente caso não haja pendências, conforme Cláusula de Garantia do contrato.</p>

    {{ASSINATURAS_HTML}}

    <p style="text-align: center; margin-top: 50px;">
        {{CIDADE_ASSINATURA}}, {{DATA_DOCUMENTO}}.
    </p>
</div>
    `,
    AutorizacaoDivulgacao: `
<h2 style="text-align: center; color: #ed1c24; margin-bottom: 5px;">AUTORIZAÇÃO PARA INTERMEDIAÇÃO E COMERCIALIZAÇÃO DE IMÓVEIS</h2>
<h3 style="text-align: center; color: #666; font-size: 16px; margin-top: 0px; margin-bottom: 20px;">DIRETRIZES DE EXCLUSIVIDADE E LGPD</h3>

<div style="margin-top: 20px; font-size: 14px; text-align: left; line-height: 1.6;">
    <p><strong>DO PROPRIETÁRIO CONCEDENTE:</strong></p>
    <p><strong>PROPRIETÁRIO(S):</strong> {{LOCADORES_LISTA}}</p>
    <p><strong>ADMINISTRADORA AUTORIZADA:</strong> R.SALES IMÓVEIS, devidamente credenciada perante o CRECI-SP.</p>

    <p><strong>CLÁUSULA PRIMEIRA - DO OBJETO E FINALIDADE:</strong> O PROPRIETÁRIO outorga à R.Sales Imóveis autorização exclusiva para a intermediação de {{FINALIDADE}} do imóvel: {{IMOVEL_TIPO}} [[IF IMOVEL_NUMERO]]nº {{IMOVEL_NUMERO}}[[ENDIF]], localizado na {{IMOVEL_ENDERECO_COMPLETO}}, matriculado sob o nº {{MATRICULA}}.</p>

    <p><strong>CLÁUSULA SEGUNDA - DA EXCLUSIVIDADE:</strong> Fica convencionado que a presente autorização é outorgada [[IF OPCIONAIS.EXCLUSIVIDADE]]com caráter de EXCLUSIVIDADE pelo prazo de 90 dias[[ELSE]]sem exclusividade[[ENDIF]].</p>

    <p><strong>CLÁUSULA TERCEIRA - DOS HONORÁRIOS DE CORRETAGEM:</strong> Na consecução do negócio, os honorários devidos pelo Proprietário à R.Sales Imóveis serão equivalentes a 6% (seis por cento) do valor total da venda, ou o valor correspondente a 1 (um) aluguel integral em caso de locação.</p>

    <p><strong>CLÁUSULA QUARTA - DO TRATAMENTO DE DADOS (LGPD):</strong> O PROPRIETÁRIO autoriza expressamente a captação de fotografias, vídeos e dados do imóvel para fins de marketing nos portais e mídias sociais.</p>

    {{ASSINATURAS_HTML}}

    <p style="text-align: center; margin-top: 50px;">
        {{CIDADE_ASSINATURA}}, {{DATA_DOCUMENTO}}.
    </p>
</div>
    `,
    VistoriaEntrada: `
<h2 style="text-align: center; color: #000; font-size: 18px; margin-bottom: 20px;">Termo de Vistoria de Imóvel Locado</h2>

<div style="font-size: 14px; text-align: left; line-height: 1.6;">
    <p><strong>Data da Vistoria:</strong> {{DATA_VISTORIA}}</p>
    
    <p style="margin-top: 20px;"><strong>LOCADOR(A):</strong> {{LOCADORES_LISTA}}</p>
    
    <p style="margin-top: 20px;"><strong>LOCATÁRIO(A):</strong> {{LOCATARIOS_LISTA}}</p>
    
    <p style="margin-top: 20px;"><strong>QUALIFICAÇÃO DO IMÓVEL:</strong> {{IMOVEL_TIPO}} [[IF IMOVEL_NUMERO]]nº {{IMOVEL_NUMERO}}[[ENDIF]], localizado na {{IMOVEL_ENDERECO_COMPLETO}}.</p>
    
    <h3 style="color: #000; font-size: 15px; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">DESCRIÇÃO DO ESTADO DE CONSERVAÇÃO DO IMÓVEL</h3>
    <div style="padding-left: 20px; margin-top: 10px; margin-bottom: 15px;">
        <p>[[IF ESTADO_CONSERVACAO]]{{ESTADO_CONSERVACAO}}[[ELSE]]O imóvel é entregue em perfeito estado de conservação, habitabilidade e funcionamento, sem quaisquer ressalvas apontadas pelas partes neste ato.[[ENDIF]]</p>
    </div>

    <p style="margin-top: 20px;"><strong>Observação:</strong> Todas as condições descritas e o estado geral do imóvel encontram-se devidamente documentados no laudo fotográfico anexo, que passa a integrar o presente termo de vistoria para todos os fins de direito.</p>
    <p>Este documento é parte integrante do Contrato de Locação acordado entre as partes.</p>
    
    <h3 style="color: #000; font-size: 15px; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">REGISTRO FOTOGRÁFICO DA VISTORIA</h3>
    {{LAUDO_FOTOS_HTML}}
    
    [[IF DATA_ENTREGA_CHAVES]]
    <p style="margin-top: 20px;">{{TEXTO_RESPONSABILIDADE_CHAVES_DATA}}</p>
    [[ELSE]]
    <p style="margin-top: 20px;">{{TEXTO_RESPONSABILIDADE_CHAVES}}</p>
    [[ENDIF]]
    <p>{{TEXTO_COMPROMISSO_DEVOLUCAO}}</p>
    <p>Assim as partes nomeiam o foro da Comarca de {{IMOVEL_CIDADE}} ({{IMOVEL_ESTADO}}) para dirimir quaisquer dúvidas, renunciando a qualquer outro por mais privilegiado que seja, e assinam o presente no formato digital, juntamente com as testemunhas que também assinam.</p>

    {{ASSINATURAS_HTML}}

    <p style="text-align: center; margin-top: 50px;">
        {{CIDADE_ASSINATURA}}, {{DATA_DOCUMENTO}}.
    </p>
</div>`,

    VistoriaSaida: `
<h2 style="text-align: center; color: #000; font-size: 18px; margin-bottom: 20px; font-weight: bold;">Termo de Vistoria de desocupação</h2>

<div style="font-size: 14px; text-align: left; line-height: 1.6;">
    <p><strong>Data da Vistoria:</strong> {{DATA_VISTORIA}}</p>
    
    <p style="margin-top: 20px;"><strong>{{LOCADORES_LABEL}}:</strong> {{LOCADORES_LISTA}}</p>
    
    <p style="margin-top: 20px;"><strong>{{LOCATARIOS_LABEL}}:</strong> {{LOCATARIOS_LISTA}}</p>
    
    <p style="margin-top: 20px;"><strong>QUALIFICAÇÃO DO IMÓVEL:</strong> {{IMOVEL_TIPO}} [[IF IMOVEL_NUMERO]]nº {{IMOVEL_NUMERO}}[[ENDIF]], localizado na {{IMOVEL_ENDERECO_COMPLETO}}.</p>
    
    <h3 style="color: #000; font-size: 15px; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">DESCRIÇÃO DO ESTADO DE CONSERVAÇÃO DO IMÓVEL (VISTORIA DE SAÍDA)</h3>
    <div style="padding-left: 20px; margin-top: 10px; margin-bottom: 15px;">
        <p>[[IF ESTADO_CONSERVACAO]]{{ESTADO_CONSERVACAO}}[[ELSE]]O imóvel é devolvido em perfeito estado de conservação, habitabilidade e funcionamento, em conformidade com o estado recebido na vistoria de entrada, ressalvados apenas os desgastes naturais do uso regular, sem ressalvas adicionais.[[ENDIF]]</p>
    </div>

    <p style="margin-top: 20px;"><strong>Observação:</strong> O estado de conservação geral na devolução encontra-se documentado no laudo fotográfico anexo, que passa a integrar este termo para fins de vistoria final e desocupação.</p>
    
    <h3 style="color: #000; font-size: 15px; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">REGISTRO FOTOGRÁFICO DA VISTORIA</h3>
    {{LAUDO_FOTOS_HTML}}
    
    <p style="margin-top: 25px;">O presente Termo de Vistoria de Saída tem por finalidade registrar a restituição do imóvel ao {{LOCADORES_LABEL}}, declarando que foi realizada a vistoria final do imóvel, apurando-se seu estado de conservação em comparação com a vistoria de entrada.</p>
    
    <p>Assim as partes nomeiam o foro da Comarca de {{IMOVEL_CIDADE}} ({{IMOVEL_ESTADO}}) para dirimir quaisquer dúvidas, renunciando a qualquer outro por mais privilegiado que seja, e assinam o presente no formato digital.</p>

    {{ASSINATURAS_HTML}}

    <p style="text-align: center; margin-top: 50px;">
        {{CIDADE_ASSINATURA}}, {{DATA_DOCUMENTO}}.
    </p>
</div>`,
    EntregaChavesVenda: `
<h2 style="text-align: center; color: #ed1c24; margin-bottom: 5px;">TERMO DE ENTREGA DE CHAVES E VISTORIA – COMPRA E VENDA</h2>

<div style="margin-top: 20px; font-size: 14px; text-align: left; line-height: 1.6;">
    <p><strong>QUALIFICAÇÃO DO ATO:</strong></p>
    
    <p><strong>{{VENDEDORES_LABEL}} (PROMITENTE VENDEDOR):</strong> {{VENDEDORES_LISTA}}</p>
    <p><strong>{{COMPRADORES_LABEL}} (PROMITENTE COMPRADOR):</strong> {{COMPRADORES_LISTA}}</p>
    <p><strong>IMÓVEL:</strong> {{IMOVEL_TIPO}} [[IF IMOVEL_NUMERO]]nº {{IMOVEL_NUMERO}}[[ENDIF]], localizado na {{IMOVEL_ENDERECO_COMPLETO}}.</p>

    <p>Pelo presente instrumento, as partes formalizam a entrega das chaves da unidade acima qualificada na data de {{DATA_ENTREGA_CHAVES}}, declarando e assentindo o seguinte:</p>

    <p><strong>1. DA IMISSÃO NA POSSE E ENTREGA DAS CHAVES:</strong><br/>
    O(S) VENDEDOR(ES) realiza(m), na data de {{DATA_ENTREGA_CHAVES}}, a entrega definitiva das chaves do imóvel acima descrito ao(s) COMPRADOR(ES), transferindo-lhe(s) a posse direta do bem, em estrito cumprimento ao Instrumento Particular de Compromisso de Compra e Venda firmado entre as partes.</p>

    <p><strong>2. DA VISTORIA DE ENTREGA:</strong><br/>
    O(S) COMPRADOR(ES) declara(m) ter vistoriado o imóvel na data de {{DATA_ENTREGA_CHAVES}}, recebendo-o nas exatas condições físicas e de conservação acordadas no contrato de compra e venda. Declara(m), ainda, que as instalações elétricas, hidráulicas e os acabamentos encontram-se em conformidade com o que foi negociado, não havendo ressalvas a fazer (exceto as eventualmente apontadas no registro fotográfico abaixo).</p>

    <p><strong>3. TRANSFERÊNCIA DE RESPONSABILIDADES E CONSUMO:</strong><br/>
    A partir desta data de entrega das chaves ({{DATA_ENTREGA_CHAVES}}), passam a ser de inteira e exclusiva responsabilidade do(s) COMPRADOR(ES):<br/>
    • O pagamento de todos os impostos (IPTU) e taxas incidentes sobre o imóvel;<br/>
    • O pagamento das cotas condominiais ordinárias e extraordinárias;<br/>
    • A transferência de titularidade junto às concessionárias de serviços públicos (Energia Elétrica, Água, Gás, etc.), isentando o(s) VENDEDOR(ES) de qualquer responsabilidade sobre o consumo a partir desta data de entrega das chaves ({{DATA_ENTREGA_CHAVES}}).<br/>
    O(s) VENDEDOR(ES) declara(m) ter quitado o consumo proporcional até esta data de {{DATA_ENTREGA_CHAVES}}.</p>

    <p><strong>4. DESCRIÇÃO DO ESTADO DE CONSERVAÇÃO DO IMÓVEL:</strong></p>
    <p><strong>Data da Vistoria:</strong> {{DATA_VISTORIA}}</p>
    <div style="padding-left: 20px; margin-bottom: 15px;">
        <p>[[IF ESTADO_CONSERVACAO]]{{ESTADO_CONSERVACAO}}[[ELSE]]O imóvel é entregue pelo(s) VENDEDOR(ES) e recebido pelo(s) COMPRADOR(ES) em perfeito estado de conservação, habitabilidade e funcionamento, em conformidade com o que foi negociado pelas partes, sem quaisquer ressalvas ou pendências de reparo.[[ENDIF]]</p>
    </div>
    
    <p><strong>5. REGISTRO FOTOGRÁFICO DA VISTORIA:</strong></p>
    {{LAUDO_FOTOS_HTML}}

    <p><strong>6. QUITAÇÃO:</strong><br/>
    Com a assinatura deste termo e a respectiva entrega das chaves, as partes dão por cumprida a obrigação de imissão na posse estipulada no contrato de compra e venda, nada mais tendo a reclamar sobre o estado físico do imóvel.</p>

    {{ASSINATURAS_HTML}}

    <p style="text-align: center; margin-top: 50px;">
        {{CIDADE_ASSINATURA}}, {{DATA_DOCUMENTO}}.
    </p>
</div>
`
};
