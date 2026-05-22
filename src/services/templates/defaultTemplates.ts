export const DEFAULT_TEMPLATES: Record<string, string> = {
    LocacaoResidencial: `
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

    <p><strong>QUALIFICAÇÃO DO IMÓVEL:</strong> {{IMOVEL_TIPO}} [[IF IMOVEL_NUMERO]]nº {{IMOVEL_NUMERO}}[[ENDIF]][[IF IMOVEL_TORRE]], torre {{IMOVEL_TORRE}}[[ENDIF]][[IF IMOVEL_CONDOMINIO_NOME]], do empreendimento denominado “{{IMOVEL_CONDOMINIO_NOME}}”[[ENDIF]], localizado na {{IMOVEL_ENDERECO_COMPLETO}}, CEP: {{IMOVEL_CEP}}, com direito ao uso de {{IMOVEL_VAGAS_GARAGEM}} vaga(s) de garagem.</p>

    <p><strong>FINALIDADE E ATIVIDADE:</strong> {{FINALIDADE}}</p>

    <p><strong>PRAZO DE LOCAÇÃO:</strong> O prazo de locação será de {{PRAZO_MESES}} ({{PRAZO_MESES_EXTENSO}}) meses, com início previsto para o dia {{DATA_INICIO_PREVISTA}}, podendo ser antecipado ou postergado em razão da finalização das obras de reforma no imóvel. A data efetiva de início da locação será aquela em que ocorrer a entrega das chaves aos LOCATÁRIOS, a qual será formalizada mediante assinatura do Termo de Entrega pelas partes.</p>
    <p><em>Parágrafo único:</em> A entrega das chaves e o início da contagem do prazo contratual somente ocorrerão após a conclusão das obras essenciais que permitam o uso regular do imóvel, não sendo devido qualquer valor de aluguel até a efetiva entrega das chaves.</p>

    <p><strong>VALOR DA LOCAÇÃO:</strong> O valor mensal da locação é de R$ {{VALOR_ALUGUEL}} ({{VALOR_ALUGUEL_EXTENSO}}).</p>
    <p>Além do aluguel, os LOCATÁRIOS serão responsáveis pelo pagamento do IPTU e da taxa de condomínio, atualmente fixados em:</p>
    <p style="margin-left: 20px; margin-bottom: 15px;">
        • Condomínio (custas ordinárias): R$ {{CONDOMINIO_VALOR}}<br/>
        • IPTU: R$ {{IPTU_VALOR}}
    </p>
    <p>Os valores acima serão cobrados juntamente com o aluguel, em boleto único mensal, emitido pela administradora.</p>
    <p><em>Parágrafo único:</em> Os LOCATÁRIOS serão responsáveis exclusivamente pelas despesas condominiais ordinárias, conforme legislação vigente, incluindo, mas não se limitando a despesas de manutenção, conservação e administração do condomínio. Quaisquer despesas extraordinárias, tais como obras estruturais, melhorias, fundo de reserva, benfeitorias que aumentem o padrão do condomínio ou outras previstas no art. 22 da Lei 8.245/91, serão de responsabilidade do(a) LOCADOR(a). Eventuais ajustes nos valores do condomínio ordinário e/ou IPTU serão automaticamente repassados aos LOCATÁRIOS, passando a integrar o boleto mensal a partir da data de sua vigência.</p>

    <p><strong>DATA DE PAGAMENTO DO ALUGUEL:</strong> todo dia {{DIA_PAGAMENTO}} do mês subsequente ao vencido. Devendo ser pago, exclusively, através de boleto bancário a ser emitido pela administradora.</p>

    <p><strong>REAJUSTE DO VALOR DO ALUGUEL:</strong> o reajuste do aluguel será anual, a contar do início da locação, de acordo com o {{REAJUSTE_INDICE}}. No entanto, esse reajuste será aplicado somente caso o índice seja positivo. Se o índice for negativo, o valor do aluguel permanecerá inalterado e o contrato não sofrerá qualquer modificação.</p>

    <p><strong>ENCARGOS LOCATÍCIOS:</strong> energia elétrica, devendo ser pagos pelos LOCATÁRIOS diretamente para as empresas prestadoras de serviços. A tarifa bancária cobrada para a geração do boleto de locação será de responsabilidade dos LOCATÁRIOS. O valor correspondente a essa tarifa será cobrado juntamente com o valor do aluguel mensal e demais encargos locatícios.</p>

    <p><strong>MULTA RESCISÓRIA:</strong> {{MULTA_RESCISAO_ALUGUEIS}} (três) aluguéis vigentes à época da rescisão, proporcional ao tempo restante da locação.</p>

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

    <p><strong>SEGURO INCÊNDIO:</strong> Nos termos do artigo 22, inciso VIII da Lei nº 8.245/91, fica convencionado entre as partes que os LOCATÁRIOS assumem a obrigação de contratar e manter vigente, durante toda a locação, um seguro contra incêndio em favor do imóvel, cobrindo danos estruturais, conforme prática de mercado.</p>
    <p>Os LOCATÁRIOS deverão apresentar à LOCADORA a apólice do seguro no prazo máximo de 30 (trinta) dias contados da assinatura deste contrato, bem como manter os pagamentos das parcelas em dia, sob pena de infração contratual.</p>

    <h3 style="color: #ed1c24; font-size: 16px; border-bottom: 2px solid #ed1c24; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px;">BASES CONTRATUAIS</h3>

    <p><strong>PRIMEIRA:</strong> Os LOCATÁRIOS comprometem-se a não alterar a finalidade do imóvel locado, sob pena de infração contratual.</p>

    <p><strong>SEGUNDA:</strong> O prazo de locação é determinado, devendo os LOCATÁRIOS restituir o imóvel à LOCADORA imediatamente ao final do prazo, totalmente desocupado, nas mesmas condições em que o recebeu. O contrato pode ser renovado mediante ajuste entre as partes, devendo, para tanto, os LOCATÁRIOS manifestarem sua vontade de renovação com, no mínimo, 60 (sessenta) dias de antecedência em relação ao término do contrato.</p>

    <p><strong>TERCEIRA:</strong> Não vindo a efetuar o pagamento do aluguel até a data estipulada, o locatário fica obrigado a pagar multa de 10% (dez por cento) sobre o valor do aluguel estipulado neste contrato, bem como juros de mora de 1% (um por cento) ao mês, mais correção monetária, sem prejuízo de eventuais multas, juros e correções monetárias por atraso no pagamento do IPTU e condomínio. Na hipótese de cobrança judicial ou extrajudicial dos aluguéis e encargos eventualmente inadimplidos, por assessoria jurídica, fica o locatário obrigado ao pagamento de 20% (vinte por cento) de honorários advocatícios sobre o valor total do débito.</p>
    <p><em>Parágrafo único:</em> O valor da locação é composto pelo aluguel e pelo IPTU, sendo este repassado, por meio da administradora, à LOCADORA, que ficará responsável pelo pagamento.</p>

    <p><strong>QUARTA:</strong> Os encargos locatícios de consumo de água, energia elétrica e gás são de responsabilidade dos LOCATÁRIOS, conforme detalhado a seguir:<br/>
    1. Consumo de água: O consumo de água é medido e cobrado pelo condomínio, sendo o valor correspondente repassado para o boleto de locação, de responsabilidade dos LOCATÁRIOS para pagamento.<br/>
    2. Consumo de energia elétrica e gás: Os LOCATÁRIOS deverão proceder com a transferência da conta de energia elétrica e gás para o seu nome junto à concessionária responsável, no prazo máximo de 10 (dez) dias contados da assinatura do presente contrato.</p>

    <p><strong>QUINTA:</strong> O imóvel encontra-se em perfeitas condições de habitabilidade e funcionamento. Os LOCATÁRIOS comprometem-se a zelar pelo imóvel, utilizá-lo de forma adequada, não danificá-lo, destruí-lo ou desviar sua finalidade, sob pena de infração contratual e responsabilização pelos danos, nos termos da lei. Ao término da locação, os LOCATÁRIOS deverão devolver o imóvel [[IF OPCIONAIS.PINTURA_NOVA]]completamente pintado de novo com tinta de primeira qualidade (marca Suvinil ou equivalente)[[ELSE]]pintado[[ENDIF]] e em condições compatíveis com o estado de conservação em que o receberam, conforme verificado no Termo de Vistoria, excetuados os desgastes naturais decorrentes do uso regular. [[IF OPCIONAIS.VISTORIA_DETALHADA]]O presente contrato é acompanhado por um Laudo de Vistoria detalhado com fotografias que atestam o estado real de conservação do imóvel no momento da entrega das chaves, o qual passa a integrar este instrumento para todos os fins de direito.[[ENDIF]]</p>

    <p><strong>SEXTA:</strong> Os LOCATÁRIOS ficam desde já autorizados a manter animais domésticos no imóvel, sob as seguintes condições:<br/>
    1. Os animais devem ser mantidos dentro da unidade locada e não devem ser deixados soltos nas áreas comuns do condomínio.<br/>
    2. Os LOCATÁRIOS são responsáveis por garantir que os animais não causem perturbação excessiva aos vizinhos, incluindo barulhos excessivos ou comportamento agressivo.<br/>
    3. É de responsabilidade dos LOCATÁRIOS garantir que os animais estejam devidamente vacinados e com boa saúde. Os LOCATÁRIOS devem cumprir todas as regras e regulamentos do condomínio relacionados a animais de estimação, incluindo o uso de guia nas áreas comuns.<br/>
    4. Em caso de danos causados pelos animais às instalações do imóvel, os LOCATÁRIOS serão responsáveis por cobrir os custos de reparo.</p>

    <p><strong>SÉTIMA:</strong> Em virtude de desapropriação, incêndio ou desabamento ou qualquer ocorrência que impeça o uso normal do imóvel, o presente contrato será resolvido, sendo desnecessário o pagamento de multa ou indenização por ambas as partes.<br/>
    <em>Parágrafo único:</em> A parte que der causa ao prejuízo será responsabilizada por sua ação ou omissão, nos termos da lei, além do pagamento das multas previstas neste contrato.</p>

    <p><strong>OITAVA:</strong> Os LOCATÁRIOS não poderão realizar qualquer benfeitoria no imóvel sem a prévia autorização por escrito da LOCADORA, exceto aquelas de caráter urgente que sejam indispensáveis e não possam aguardar a aprovação da LOCADORA. O LOCATÁRIO reconhece que apenas as benfeitorias necessárias, conforme definidas pela lei, darão direito a reembolso pela LOCADORA. Além disso, os LOCATÁRIOS estão expressamente proibidos de realizar qualquer modificação no imóvel, incluindo alterações na pintura, ou modificações nos móveis existentes, sem o consentimento prévio do LOCADOR. Da mesma forma, fica [[IF OPCIONAIS.SUBLOCACAO]]expressamente proibida[[ELSE]]autorizada[[ENDIF]] a sublocação do imóvel, seja parcial ou total, [[IF OPCIONAIS.SUBLOCACAO]]sem[[ELSE]]mediante[[ENDIF]] autorização prévia da LOCADORA.</p>

    <p><strong>NONA:</strong> O presente contrato poderá ser rescindido pelo inadimplemento de qualquer obrigação contratual, sendo facultada à parte inocente a decisão sobre sua rescisão, nos 30 (trinta) dias subsequentes à data da infração ou de sua descoberta, tendo direito a receber a multa rescisória prevista neste contrato.</p>

    <p><strong>DÉCIMA:</strong> Na intenção de desocupação do imóvel antes do término do contrato, os LOCATÁRIOS deverão obrigatoriamente comunicar a administradora com, no mínimo, 30 (trinta) dias de antecedência, e marcar dia e hora para a vistoria de desocupação, sendo obrigatória a presença dos LOCATÁRIOS ou seu representante neste momento.</p>

    <p><strong>DÉCIMA PRIMEIRA:</strong> Caso os LOCATÁRIOS tenham interesse na compra do imóvel objeto desta locação, bem como a LOCADORA tenha interesse em vendê-lo aos LOCATÁRIOS, ambos comprometem-se a realizar a transação por intermédio da R.Sales Imóveis, que ficará responsável por todos os procedimentos referentes à transação imobiliária, desde a negociação entre as partes, o contrato e a formalização do negócio perante o cartório e órgãos competentes, cujos honorários da administradora deverão ser pagos pelo LOCADOR/Vendedor, nos limites estabelecidos pelo Conselho Regional de Corretores de Imóveis de São Paulo – CRECI-SP.</p>

    <p><strong>DÉCIMA SEGUNDA:</strong> Sendo o imóvel objeto desta locação unidade de condomínio edilício, os LOCATÁRIOS se obrigam a cumprir todas as suas regras, regulamentos e convenções, sendo responsável por eventuais multas oriundas de suas ações, omissões e conduta perante o condomínio, bem como em qualquer eventual despesa adicional que venha no boleto condominial referente a aluguel de salão de festas entre outros.</p>

    <p><strong>DÉCIMA TERCEIRA:</strong> As infrações legais de ordem criminal que os LOCATÁRIOS ou LOCADORA cometerem em relação à propriedade ou uso do imóvel geram faculdade para a parte inocente de rescindir o contrato de locação, sob pena de pagamento de multa rescisória pela parte infringente.</p>

    <p><strong>DÉCIMA QUARTA:</strong> As partes elegem o foro da comarca de [[IF OPCIONAIS.FORO_SAO_PAULO]]São Paulo-SP[[ELSE]]Poá-SP[[ENDIF]] para resolver questões judiciais oriundas deste contrato, ficando a parte vencida responsável pelas despesas judiciais, além de honorários advocatícios na razão de 20% (vinte por cento) sobre o valor da causa.</p>

    <p><strong>DÉCIMA QUINZE - AUTORIZAÇÃO DE TRATAMENTO DE DADOS (LGPD):</strong> Os CONTRATANTES de forma livre, informada e inequívoca concordam com o tratamento de seus dados pela imobiliária administradora da locação, no legítimo interesse dos mesmos e para a finalidade do presente instrumento, em conformidade com a Lei nº 13.709/2018 – Lei Geral de Proteção de Dados Pessoais (LGPD).</p>

    <p><strong>DÉCIMA SEXTA - DA CONTRATAÇÃO DIGITAL:</strong> Os CONTRATANTES declaram e concordam que o presente instrumento, incluindo todas as páginas de assinatura e eventuais anexos, poderão ser todos formados por meio digital com o qual expressamente declaram concordar, representam a integralidade dos termos entre elas acordados, substituindo quaisquer outros acordos anteriores formalizados por qualquer outro meio, verbal ou escrito, físico ou digital, nos termos dos art. 107, 219 e 220 do Código Civil. Adicionalmente, nos termos do art. 10, § 2º, da Medida Provisória nº 2.200-2, e do art. 2º, I da MP 983/2020, as PARTES expressamente concordam em utilizar e reconhecem como válida qualquer forma de comprovação de anuência aos termos ora acordados em formato eletrônico.</p>

    <div style="margin-top: 40px; border-top: 2px solid #eee; padding-top: 20px;" class="keep-together">
        <p><strong>ASSINATURAS E TESTEMUNHAS:</strong></p>
        <p>Por estarem assim justas e contratadas, as partes assinam o presente instrumento por meio eletrônico e digital.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
            <tr>
                <td style="width: 48%; vertical-align: top; padding-bottom: 30px;">
                    <p style="margin-bottom: 40px;"><strong>LOCADORA:</strong></p>
                    <div style="border-top: 1px solid #999; width: 90%; padding-top: 5px;">
                        <strong>{{LOCADORA_NOME}}</strong>
                    </div>
                </td>
                <td style="width: 4%;">&nbsp;</td>
                <td style="width: 48%; vertical-align: top; padding-bottom: 30px;">
                    <p style="margin-bottom: 40px;"><strong>LOCATÁRIO(S):</strong></p>
                    <div style="border-top: 1px solid #999; width: 90%; padding-top: 5px;">
                        <strong>{{LOCATARIOS_NOMES}}</strong>
                    </div>
                </td>
            </tr>
            <tr>
                <td style="width: 48%; vertical-align: top; padding-top: 20px;">
                    <p style="margin-bottom: 40px;"><strong>Testemunha 1:</strong></p>
                    <div style="border-top: 1px solid #999; width: 90%; padding-top: 5px;">
                        Nome: {{TESTEMUNHA1_NOME}}<br/>
                        RG/CPF: {{TESTEMUNHA1_RG}}
                    </div>
                </td>
                <td style="width: 4%;">&nbsp;</td>
                <td style="width: 48%; vertical-align: top; padding-top: 20px;">
                    <p style="margin-bottom: 40px;"><strong>Testemunha 2:</strong></p>
                    <div style="border-top: 1px solid #999; width: 90%; padding-top: 5px;">
                        Nome: {{TESTEMUNHA2_NOME}}<br/>
                        RG/CPF: {{TESTEMUNHA2_RG}}
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <p style="text-align: center; margin-top: 50px;">
        {{CIDADE_ASSINATURA}}, {{DATA_HOJE}}.
    </p>
</div>
    `,
    LocacaoComercial: `
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

    <p><strong>QUALIFICAÇÃO DO IMÓVEL COMERCIAL:</strong> {{IMOVEL_TIPO}} [[IF IMOVEL_NUMERO]]nº {{IMOVEL_NUMERO}}[[ENDIF]][[IF IMOVEL_CONDOMINIO_NOME]], do condomínio/centro comercial denominado “{{IMOVEL_CONDOMINIO_NOME}}”[[ENDIF]], localizado na {{IMOVEL_ENDERECO_COMPLETO}}, CEP: {{IMOVEL_CEP}}, destinado exclusivamente para a atividade comercial do ramo de atuação dos LOCATÁRIOS.</p>

    <p><strong>FINALIDADE E ATIVIDADE:</strong> Comercial ({{FINALIDADE}})</p>

    <p><strong>PRAZO DE LOCAÇÃO COMERCIAL:</strong> O prazo de locação comercial será de {{PRAZO_MESES}} ({{PRAZO_MESES_EXTENSO}}) meses, com início previsto para o dia {{DATA_INICIO_PREVISTA}}, data em que ocorrerá a entrega oficial das chaves.</p>

    <p><strong>VALOR DA LOCAÇÃO E ENCARGOS:</strong> O aluguel mensal inicial é de R$ {{VALOR_ALUGUEL}} ({{VALOR_ALUGUEL_EXTENSO}}), acrescido de condomínio (R$ {{CONDOMINIO_VALOR}}) e IPTU (R$ {{IPTU_VALOR}}).</p>

    <p><strong>DATA DE PAGAMENTO DO ALUGUEL:</strong> todo dia {{DIA_PAGAMENTO}} do mês subsequente ao vencido. Devendo ser pago através de boleto emitido pela administradora.</p>

    <p><strong>REAJUSTE DO VALOR DO ALUGUEL:</strong> O aluguel será reajustado anualmente a contar do início da locação, de acordo com o {{REAJUSTE_INDICE}}, apenas se positivo.</p>

    <p><strong>ENCARGOS LOCATÍCIOS DE CONSUMO:</strong> Água, energia elétrica, gás e despesas de consumo de responsabilidade dos LOCATÁRIOS.</p>

    <p><strong>MULTA RESCISÓRIA:</strong> {{MULTA_RESCISAO_ALUGUEIS}} (três) aluguéis vigentes à época da rescisão, proporcional ao tempo restante do contrato.</p>

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

    <p><strong>SEGURO DE INCÊNDIO E RESPONSABILIDADE CIVIL:</strong> Os LOCATÁRIOS obrigam-se a contratar seguro de incêndio com cobertura especial de responsabilidade civil comercial.</p>

    <h3 style="color: #ed1c24; font-size: 16px; border-bottom: 2px solid #ed1c24; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px;">BASES CONTRATUAIS</h3>

    <p><strong>PRIMEIRA:</strong> Os LOCATÁRIOS obrigam-se a obter todas as licenças, alvarás e autorizações necessárias para a operação da sua atividade comercial perante os órgãos competentes.</p>

    <p><strong>SEGUNDA:</strong> É vedada a mudança do ramo de atividade comercial inicialmente declarado, bem como o empréstimo, cessão, sublocação ou transferência deste contrato, sob pena de rescisão e despejo.</p>

    <p><strong>TERCEIRA:</strong> O atraso no pagamento do aluguel implicará multa moratória de 10% (dez por cento) e juros de 1% ao mês, mais correção monetária. Na hipótese de cobrança por assessoria jurídica, arcará com honorários advocatícios de 20%.</p>

    <p><strong>QUARTA:</strong> Quaisquer reformas, adequações de layout ou instalações elétricas/hidráulicas especiais para fins de comércio exigem prévia e expressa autorização por escrito do LOCADOR.</p>

    <p><strong>QUINTA:</strong> Ao término da locação, o imóvel deverá ser devolvido totalmente desocupado, limpo e [[IF OPCIONAIS.PINTURA_NOVA]]completamente pintado de novo com tinta de primeira qualidade[[ELSE]]pintado[[ENDIF]], nas mesmas condições recebidas.</p>

    <p><strong>SEXTA:</strong> As despesas com seguro, taxas de funcionamento e impostos de atividade são de responsabilidade integral do locatário.</p>

    <p><strong>SÉTIMA:</strong> Fica eleito o foro da comarca de [[IF OPCIONAIS.FORO_SAO_PAULO]]São Paulo-SP[[ELSE]]Poá-SP[[ENDIF]] para dirimir quaisquer dúvidas oriundas deste instrumento.</p>

    <p><strong>OITAVA - AUTORIZAÇÃO DE TRATAMENTO DE DADOS (LGPD):</strong> As partes autorizam o tratamento de seus dados cadastrais para fins de cumprimento contratual e intermediação administrativa da locação.</p>

    <p><strong>NONA - DA CONTRATAÇÃO DIGITAL:</strong> As partes declaram-se cientes e de pleno acordo com a validade jurídica das assinaturas eletrônicas apostas neste instrumento.</p>

    <div style="margin-top: 40px; border-top: 2px solid #eee; padding-top: 20px;" class="keep-together">
        <p><strong>ASSINATURAS E TESTEMUNHAS:</strong></p>
        <p>Por estarem justos e contratados, assinam eletronicamente o presente instrumento.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
            <tr>
                <td style="width: 48%; vertical-align: top; padding-bottom: 30px;">
                    <p style="margin-bottom: 40px;"><strong>LOCADORA:</strong></p>
                    <div style="border-top: 1px solid #999; width: 90%; padding-top: 5px;">
                        <strong>{{LOCADORA_NOME}}</strong>
                    </div>
                </td>
                <td style="width: 4%;">&nbsp;</td>
                <td style="width: 48%; vertical-align: top; padding-bottom: 30px;">
                    <p style="margin-bottom: 40px;"><strong>LOCATÁRIO(S):</strong></p>
                    <div style="border-top: 1px solid #999; width: 90%; padding-top: 5px;">
                        <strong>{{LOCATARIOS_NOMES}}</strong>
                    </div>
                </td>
            </tr>
            <tr>
                <td style="width: 48%; vertical-align: top; padding-top: 20px;">
                    <p style="margin-bottom: 40px;"><strong>Testemunha 1:</strong></p>
                    <div style="border-top: 1px solid #999; width: 90%; padding-top: 5px;">
                        Nome: {{TESTEMUNHA1_NOME}}<br/>
                        RG/CPF: {{TESTEMUNHA1_RG}}
                    </div>
                </td>
                <td style="width: 4%;">&nbsp;</td>
                <td style="width: 48%; vertical-align: top; padding-top: 20px;">
                    <p style="margin-bottom: 40px;"><strong>Testemunha 2:</strong></p>
                    <div style="border-top: 1px solid #999; width: 90%; padding-top: 5px;">
                        Nome: {{TESTEMUNHA2_NOME}}<br/>
                        RG/CPF: {{TESTEMUNHA2_RG}}
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <p style="text-align: center; margin-top: 50px;">
        {{CIDADE_ASSINATURA}}, {{DATA_HOJE}}.
    </p>
</div>
    `,
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
    <p><strong>2. Saldo Devedor:</strong> O saldo devedor restante será pago em conformidade com as tratativas financeiras diretas entre as partes.</p>
    [[ENDIF]]

    <p><strong>CLÁUSULA TERCEIRA - DA IMISSÃO NA POSSE:</strong> O PROMITENTE COMPRADOR será imitido na posse precária do imóvel na data de outorga da escritura definitiva ou conforme data de entrega acordada: {{DATA_ENTREGA_CHAVES_OBS}}, passando a arcar com os impostos, condomínios e taxas que incidirem sobre o imóvel a partir da mesma.</p>

    <p><strong>CLÁUSULA QUARTA - DAS CERTIDÕES E DO DESEMBARAÇO:</strong> O(s) PROMITENTE(S) VENDEDOR(ES) obriga-se a apresentar todas as certidões negativas de ônus reais, certidões fiscais municipais, estaduais e federais, e certidões de distribuição de ações judiciais que comprovem a sua idoneidade financeira e a regularidade do imóvel objeto desta transação.</p>

    <p><strong>CLÁUSULA QUINTA - DA IRREVOGABILIDADE E IRRETRATABILIDADE:</strong> O presente contrato é pactuado em caráter irrevogável e irretratável, obrigando-se as partes, seus herdeiros e sucessores a qualquer título, renunciando expressamente ao direito de arrependimento.</p>

    <p><strong>CLÁUSULA SEXTA - DA ESCRITURA E DO REGISTRO:</strong> As despesas com a outorga da escritura pública de compra e venda, imposto de transmissão (ITBI) e taxas de registro cartorário correrão por conta exclusiva do PROMITENTE COMPRADOR.</p>

    <p><strong>CLÁUSULA SÉTIMA - DA MULTA CONVENCIONAL:</strong> O descumprimento de qualquer uma das cláusulas deste contrato sujeitará a parte infratora ao pagamento de multa equivalente a 10% (dez por cento) sobre o valor total do negócio, cobrada pela via judicial ou extrajudicial, sem prejuízo de perdas e danos.</p>

    <p><strong>CLÁUSULA OITAVA - DA AUTORIZAÇÃO DE TRATAMENTO DE DADOS (LGPD):</strong> Os contratantes consentem com o tratamento de seus dados pela administradora R.Sales Imóveis para os fins deste negócio.</p>

    <p><strong>CLÁUSULA NONA - DO FORO E DA ASSINATURA DIGITAL:</strong> As partes elegem o foro da comarca de [[IF OPCIONAIS.FORO_SAO_PAULO]]São Paulo-SP[[ELSE]]Poá-SP[[ENDIF]] para dirimir eventuais litígios judiciais. E, por estarem acordadas, assinam eletronicamente o presente instrumento na presença das testemunhas abaixo.</p>

    <div style="margin-top: 40px; border-top: 2px solid #eee; padding-top: 20px;" class="keep-together">
        <p><strong>ASSINATURAS E TESTEMUNHAS:</strong></p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
            <tr>
                <td style="width: 48%; vertical-align: top; padding-bottom: 30px;">
                    <p style="margin-bottom: 40px;"><strong>PROMITENTE VENDEDOR:</strong></p>
                    <div style="border-top: 1px solid #999; width: 90%; padding-top: 5px;">
                        <strong>{{VENDEDORES_NOMES}}</strong>
                    </div>
                </td>
                <td style="width: 4%;">&nbsp;</td>
                <td style="width: 48%; vertical-align: top; padding-bottom: 30px;">
                    <p style="margin-bottom: 40px;"><strong>PROMITENTE COMPRADOR:</strong></p>
                    <div style="border-top: 1px solid #999; width: 90%; padding-top: 5px;">
                        <strong>{{COMPRADORES_NOMES}}</strong>
                    </div>
                </td>
            </tr>
            <tr>
                <td style="width: 48%; vertical-align: top; padding-top: 20px;">
                    <p style="margin-bottom: 40px;"><strong>Testemunha 1:</strong></p>
                    <div style="border-top: 1px solid #999; width: 90%; padding-top: 5px;">
                        Nome: {{TESTEMUNHA1_NOME}}<br/>
                        RG/CPF: {{TESTEMUNHA1_RG}}
                    </div>
                </td>
                <td style="width: 4%;">&nbsp;</td>
                <td style="width: 48%; vertical-align: top; padding-top: 20px;">
                    <p style="margin-bottom: 40px;"><strong>Testemunha 2:</strong></p>
                    <div style="border-top: 1px solid #999; width: 90%; padding-top: 5px;">
                        Nome: {{TESTEMUNHA2_NOME}}<br/>
                        RG/CPF: {{TESTEMUNHA2_RG}}
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <p style="text-align: center; margin-top: 50px;">
        {{CIDADE_ASSINATURA}}, {{DATA_HOJE}}.
    </p>
</div>
    `,
    EntregaChaves: `
<h2 style="text-align: center; color: #ed1c24; margin-bottom: 5px;">TERMO DE VISTORIA E ENTREGA DEFINITIVA DE CHAVES</h2>
<h3 style="text-align: center; color: #666; font-size: 16px; margin-top: 0px; margin-bottom: 20px;">ANEXO INTEGRANTE DO CONTRATO DE LOCAÇÃO</h3>

<div style="margin-top: 20px; font-size: 14px; text-align: left; line-height: 1.6;">
    <p><strong>DA QUALIFICAÇÃO DO ATO:</strong></p>
    
    <p><strong>IMOVEL:</strong> {{IMOVEL_TIPO}} [[IF IMOVEL_NUMERO]]nº {{IMOVEL_NUMERO}}[[ENDIF]], localizado na {{IMOVEL_ENDERECO_COMPLETO}}.</p>
    <p><strong>LOCATÁRIO(S):</strong> {{LOCATARIOS_LISTA}}</p>
    <p><strong>LOCADOR(A):</strong> {{LOCADORA_NOME}}</p>

    <p>Pelo presente instrumento, as partes formalizam a entrega das chaves da unidade acima qualificada, declarando e assentindo o seguinte:</p>

    <p><strong>CLÁUSULA PRIMEIRA - DA ENTREGA DAS CHAVES:</strong> O LOCADOR, por sua intermediadora R.Sales Imóveis, procede neste ato à entrega definitiva de <strong>{{IMOVEL_VAGAS_GARAGEM}}</strong> cópia(s) de chaves de portas de acesso e controles de garagem aos LOCATÁRIOS, que declaram o recebimento das mesmas em pleno funcionamento.</p>

    <p><strong>CLÁUSULA SEGUNDA - DA VISTORIA E ACEITAÇÃO:</strong> Os LOCATÁRIOS declaram que efetuaram vistoria minuciosa no imóvel e atestam que o mesmo encontra-se nas exatas condições descritas no Laudo de Vistoria anexo com fotografias, com instalações elétricas, hidráulicas, pintura e portas em prefeito estado de conservação, habitabilidade e funcionamento.</p>

    <p><strong>CLÁUSULA TERCEIRA - DOS ENCARGOS DO IMÓVEL:</strong> A partir desta data, os LOCATÁRIOS assumem a responsabilidade integral por todas as despesas decorrentes do uso do imóvel, tais como condomínio ordinário, IPTU, consumo de água, energia elétrica, gás e seguros.</p>

    <p><strong>CLÁUSULA QUARTA - DO FORO:</strong> Elegem o foro deste contrato nos mesmos termos do contrato de locação principal.</p>

    <div style="margin-top: 40px; border-top: 2px solid #eee; padding-top: 20px;" class="keep-together">
        <p><strong>ASSINATURAS:</strong></p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
            <tr>
                <td style="width: 48%; vertical-align: top; padding-bottom: 30px;">
                    <p style="margin-bottom: 40px;"><strong>LOCADOR(A):</strong></p>
                    <div style="border-top: 1px solid #999; width: 90%; padding-top: 5px;">
                        <strong>{{LOCADORA_NOME}}</strong>
                    </div>
                </td>
                <td style="width: 4%;">&nbsp;</td>
                <td style="width: 48%; vertical-align: top; padding-bottom: 30px;">
                    <p style="margin-bottom: 40px;"><strong>LOCATÁRIO(S):</strong></p>
                    <div style="border-top: 1px solid #999; width: 90%; padding-top: 5px;">
                        <strong>{{LOCATARIOS_NOMES}}</strong>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <p style="text-align: center; margin-top: 50px;">
        {{CIDADE_ASSINATURA}}, {{DATA_HOJE}}.
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

    <div style="margin-top: 40px; border-top: 2px solid #eee; padding-top: 20px;" class="keep-together">
        <p><strong>ASSINATURAS:</strong></p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
            <tr>
                <td style="width: 48%; vertical-align: top; padding-bottom: 30px;">
                    <p style="margin-bottom: 40px;"><strong>PROPRIETÁRIO(S):</strong></p>
                    <div style="border-top: 1px solid #999; width: 90%; padding-top: 5px;">
                        <strong>{{LOCADORES_NOMES}}</strong>
                    </div>
                </td>
                <td style="width: 4%;">&nbsp;</td>
                <td style="width: 48%; vertical-align: top; padding-bottom: 30px;">
                    <p style="margin-bottom: 40px;"><strong>CORRETOR AUTORIZADO (R.SALES IMÓVEIS):</strong></p>
                    <div style="border-top: 1px solid #999; width: 90%; padding-top: 5px;">
                        <strong>Gestão e Parcerias R.Sales</strong>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <p style="text-align: center; margin-top: 50px;">
        {{CIDADE_ASSINATURA}}, {{DATA_HOJE}}.
    </p>
</div>
    `,
    'VistoriaEntrada': `
<h2 style="text-align: center; color: #000; font-size: 18px; margin-bottom: 20px;">Termo de Vistoria de Imóvel Locado</h2>

<div style="font-size: 14px; text-align: left; line-height: 1.6;">
    <p><strong>Data da Vistoria:</strong> {{DATA_VISTORIA}}</p>
    
    <p style="margin-top: 20px;"><strong>LOCADOR(A):</strong> {{LOCADORES_LISTA}}</p>
    
    <p style="margin-top: 20px;"><strong>LOCATÁRIO(A):</strong> {{LOCATARIOS_LISTA}}</p>
    
    <p style="margin-top: 20px;"><strong>QUALIFICAÇÃO DO IMÓVEL:</strong> {{IMOVEL_TIPO}} [[IF IMOVEL_NUMERO]]nº {{IMOVEL_NUMERO}}[[ENDIF]], localizado na {{IMOVEL_ENDERECO_COMPLETO}}.</p>
    
    [[IF ESTADO_CONSERVACAO]]
    <p style="margin-top: 30px;"><strong>CONDIÇÕES DO IMÓVEL NA ENTREGA:</strong></p>
    <div style="padding-left: 20px;">
        <p>{{ESTADO_CONSERVACAO}}</p>
    </div>

    <p style="margin-top: 30px;"><strong>Observação:</strong> Todas as condições acima descritas encontram-se registradas em laudo fotográfico anexo, que passa a integrar o presente termo de vistoria.</p>
    <p>Este documento é parte integrante do Contrato de Locação acordado entre as partes.</p>
    [[ENDIF]]
    {{LAUDO_FOTOS_HTML}}
    
    [[IF DATA_ENTREGA_CHAVES]]
    <p style="margin-top: 20px;">{{TEXTO_RESPONSABILIDADE_CHAVES_DATA}}</p>
    [[ELSE]]
    <p style="margin-top: 20px;">{{TEXTO_RESPONSABILIDADE_CHAVES}}</p>
    [[ENDIF]]
    <p>{{TEXTO_COMPROMISSO_DEVOLUCAO}}</p>
    <p>Assim as partes nomeiam o foro da Comarca de Poá (SP) para dirimir quaisquer dúvidas, renunciando a qualquer outro por mais privilegiado que seja, e assinam o presente no formato digital, juntamente com as testemunhas que também assinam.</p>

    {{ASSINATURAS_HTML}}
</div>`,

    'VistoriaSaida': `
<h2 style="text-align: center; color: #ed1c24; margin-bottom: 5px;">TERMO DE VISTORIA FINAL E ENTREGA DE CHAVES</h2>
<h3 style="text-align: center; color: #666; font-size: 16px; margin-top: 0px; margin-bottom: 20px;">RESCISÃO CONTRATUAL E SAÍDA DO IMÓVEL</h3>

<div style="margin-top: 20px; font-size: 14px; text-align: left; line-height: 1.6;">
    <p><strong>DA QUALIFICAÇÃO DO ATO:</strong></p>
    <p><strong>IMOVEL:</strong> {{IMOVEL_TIPO}} [[IF IMOVEL_NUMERO]]nº {{IMOVEL_NUMERO}}[[ENDIF]], localizado na {{IMOVEL_ENDERECO_COMPLETO}}.</p>
    <p><strong>LOCADOR(A):</strong> {{LOCADORES_LISTA}}</p>
    <p><strong>LOCATÁRIO(A):</strong> {{LOCATARIOS_LISTA}}</p>
    
    <p style="margin-top: 20px;">O presente Termo de Vistoria de Saída tem por finalidade registrar a entrega das chaves e a restituição do imóvel ao LOCADOR(A).</p>
    
    <p>As partes reconhecem e declaram que foi realizada a vistoria final do imóvel, apurando-se seu estado de conservação em comparação com a vistoria de entrada.</p>
    
    <p>O imóvel foi restituído no mesmo estado de conservação em que foi recebido, exceto eventuais ressalvas descritas no laudo anexo.</p>

    {{ASSINATURAS_HTML}}
</div>`
};
