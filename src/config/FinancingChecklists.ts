
export interface ChecklistItem {
    id: string;
    text: string;
    isConditional?: boolean;
    conditionType?: 'fgts' | 'empreendimento_caixa' | 'nao_empreendimento_caixa' | 'cartorio_rsales';
}

export interface ChecklistAnswer {
    checked: boolean;
    status: 'checked' | 'unchecked' | 'irrelevant' | 'failed';
}

export const STAGE_CHECKLISTS: Record<string, ChecklistItem[]> = {
    'novos-clientes': [
        { id: 'simulacao_validada', text: 'A simulação de financiamento foi realizada e validada com o cliente?' },
        { id: 'docs_recebidos', text: 'Todos os documentos foram recebidos e conferidos?' },
        { id: 'pasta_organizada', text: 'A pasta “Compradores” foi criada e organizada no Drive?' },
        { id: 'verificacao_pendencias', text: 'Foi verificada a existência de propostas antigas ou pendências no CPF do cliente?' }
    ],
    'cadastro-cliente': [
        { id: 'cadastro_realizado', text: 'O cadastro do cliente foi realizado?' },
        { id: 'cadastro_conferido', text: 'O cadastro do cliente foi conferido?' }
    ],
    'avaliacao-risco': [
        { id: 'avaliacoes_solicitadas', text: 'As avaliações de risco foram solicitadas? (habitação, cartão e cheque)' },
        { id: 'resultado_informado', text: 'O resultado da avaliação habitacional foi recebido e informado ao cliente?' },
        { id: 'formularios_salvos', text: 'Os formulários foram salvos corretamente na pasta correspondente?' }
    ],
    'aprovados': [
        { id: 'cliente_comunicado', text: 'O cliente foi comunicado sobre a aprovação?' },
        { id: 'seguir_engenharia', text: 'O processo está pronto para seguir para engenharia?' }
    ],
    'condicionados': [
        { id: 'nova_simulacao', text: 'Uma nova simulação foi realizada com os parâmetros condicionados?' },
        { id: 'novos_parametros_explicados', text: 'Os novos parâmetros foram explicados e validados com o cliente?' }
    ],
    'reprovados': [
        { id: 'agencia_consultada', text: 'A agência foi consultada para identificar os motivos da reprovação?' },
        { id: 'cliente_informado_reprovacao', text: 'O cliente foi informado sobre a reprovação e orientado sobre os próximos passos?' }
    ],
    'fgts': [
        { id: 'extratos_solicitados', text: 'Extratos atualizados solicitado para o cliente?', isConditional: true, conditionType: 'fgts' },
        { id: 'debito_ciweb', text: 'Foi realizado a solicitação de débito fgts do cliente no CIWEB?', isConditional: true, conditionType: 'fgts' },
        { id: 'fgts_ressarcido', text: 'FGTS do cliente foi ressarcido?', isConditional: true, conditionType: 'fgts' }
    ],
    'engenharia': [
        { id: 'docs_solicitados', text: 'A documentação do imóvel, dos vendedores e da conta para crédito foi solicitada?' },
        { id: 'matricula_responsavel', text: 'Somos os responsáveis pela solicitação da matrícula?' },
        { id: 'cliente_enviou_matricula', text: 'O cliente enviou a matrícula atualizada?' },
        { id: 'matricula_solicitada_registradores', text: 'A matrícula atualizada foi solicitada via Registradores?' },
        { id: 'codigo_pagamento_enviado', text: 'O código de pagamento da matrícula foi enviado ao cliente?' },
        { id: 'imovel_cadastrado_siopi', text: 'O imóvel foi cadastrado no SIOPI e o boleto de vistoria foi gerado?' },
        { id: 'boleto_siopi_enviado', text: 'O boleto do SIOPI foi enviado ao cliente?' },
        { id: 'boleto_siopi_pago', text: 'O boleto do SIOPI foi pago pelo cliente?' },
        { id: 'houve_pept', text: 'Houve PEPT?' },
        { id: 'pendencias_pept_analisadas', text: 'As pendências apontadas na PEPT foram analisadas?' },
        { id: 'pept_resolvida', text: 'A PEPT foi resolvida?' },
        { id: 'revisao_laudo_aberta', text: 'A revisão de laudo foi aberta no SIOPI?' },
        { id: 'engenheiro_contatado', text: 'O engenheiro responsável foi contatado?' },
        { id: 'cliente_informado_laudo', text: 'O cliente foi informado sobre a possibilidade ou não de alteração do valor do laudo?' }
    ],
    'siopi': [
        { id: 'processo_siopi_iniciado', text: 'O processo SIOPI foi iniciado?' },
        { id: 'siopi_ate_reserva', text: 'O SIOPI foi realizado até a etapa de reserva?' },
        { id: 'formularios_preenchidos', text: 'Todos os formulários foram preenchidos?' },
        { id: 'doc_unificada_pdf', text: 'Toda a documentação foi unificada em PDF único?', isConditional: true, conditionType: 'empreendimento_caixa' }
    ],
    'formularios': [
        { id: 'clientes_acionados_govbr', text: 'Os clientes foram acionados para assinatura via Gov.br?' },
        { id: 'formularios_assinados', text: 'Os formulários foram assinados?' },
        { id: 'conferencia_assinatura', text: 'Os formulários assinados passou pela nossa conferencia de assinatura e validação ITI?' },
        { id: 'siopi_ceop', text: 'O SIOPI foi encaminhado para CEOP?', isConditional: true, conditionType: 'empreendimento_caixa' },
        { id: 'siopi_cehop', text: 'O SIOPI foi encaminhado para CEHOP?', isConditional: true, conditionType: 'nao_empreendimento_caixa' }
    ],
    'sictd': [
        { id: 'pasta_sictd_criada', text: 'A pasta SICTD foi criada?' },
        { id: 'pasta_sictd_pronta', text: 'A pasta SICTD está pronta?' }
    ],
    'aguardando-conformidade': [
        { id: 'dossie_transmitido', text: 'O dossiê foi transmitido no SICTD?' },
        { id: 'houve_pa_inconforme', text: 'Houve PA inconforme?' },
        { id: 'pendencias_pa_analisadas', text: 'As pendências do PA inconforme foram analisadas?' },
        { id: 'pendencias_pa_resolvidas', text: 'Todas as pendências do PA inconforme foram resolvidas?' }
    ],
    'entrevista': [
        { id: 'agendamento_solicitado', text: 'O agendamento da entrevista foi solicitado à agência?' },
        { id: 'agendamento_minuta_solicitada', text: 'O agendamento ou a minuta foi solicitada à agência?' }
    ],
    'assinatura-minuta': [
        { id: 'minuta_recebida', text: 'A minuta foi recebida da agência?' },
        { id: 'itbi_solicitado', text: 'O ITBI foi solicitado?' },
        { id: 'assinatura_minuta_compradores', text: 'A assinatura da minuta pelos compradores foi realizada?' },
        { id: 'assinatura_contrato_vendedores', text: 'A assinatura do contrato pelos vendedores foi realizada?' },
        { id: 'contrato_validado_gerente', text: 'O contrato assinado foi enviado à agência e validado pelo gerente?' }
    ],
    'itbi': [
        { id: 'boleto_itbi_recebido', text: 'O boleto ITBI foi recebido?' }
    ],
    'cartorio-rsales': [
        { id: 'nos_faremos_cartorio', text: 'Nós que faremos o cartório?' },
        { id: 'declaracao_primeiro_imovel', text: 'Declaração de primeiro imóvel preenchida?', isConditional: true, conditionType: 'cartorio_rsales' },
        { id: 'itbi_prenotacao_enviados', text: 'O ITBI e a taxa de prenotação foram enviados juntamente com as declarações de primeiro imóvel?', isConditional: true, conditionType: 'cartorio_rsales' },
        { id: 'itbi_pago', text: 'O ITBI foi pago?', isConditional: true, conditionType: 'cartorio_rsales' },
        { id: 'taxa_prenotacao_paga', text: 'A taxa de prenotação foi paga?', isConditional: true, conditionType: 'cartorio_rsales' },
        { id: 'declaracoes_assinadas', text: 'As declarações foram assinadas?', isConditional: true, conditionType: 'cartorio_rsales' },
        { id: 'processo_protocolado', text: 'O processo foi protocolado no cartório?', isConditional: true, conditionType: 'cartorio_rsales' },
        { id: 'registro_concluido', text: 'O registro foi concluído em cartório?', isConditional: true, conditionType: 'cartorio_rsales' }
    ],
    'garantia': [
        { id: 'matricula_contrato_arquivados', text: 'A matrícula registrada e o contrato foram incluídos na pasta Garantia?' },
        { id: 'trata_se_empreendimento', text: 'Trata-se de imóvel de empreendimento?' },
        { id: 'garantia_transmitida_caixa_aqui', text: 'A garantia foi transmitida no Caixa Aqui?', isConditional: true, conditionType: 'empreendimento_caixa' },
        { id: 'garantia_transmitida_sictd', text: 'A garantia foi transmitida no SICTD?', isConditional: true, conditionType: 'nao_empreendimento_caixa' },
        { id: 'recebemos_pa_inconforme', text: 'Recebemos PA inconforme?' },
        { id: 'pa_conforme_recebido', text: 'O PA conforme foi recebido?' }
    ],
    'acompanhamento-obra': [
        { id: 'medicao_mensal', text: 'Medição mensal realizada?' },
        { id: 'liberar_parcelas', text: 'Parcelas liberadas?' }
    ],
    'aguardando-imovel': [
        { id: 'opcoes_enviadas', text: 'Cliente enviou opções?' },
        { id: 'visitas_agendadas', text: 'Agendar visitas?' },
        { id: 'validar_doc_basica', text: 'Validar documentação básica do imóvel?' }
    ]
};
