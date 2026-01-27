/**
 * Hook: Leads → Distribuição (Round-Robin)
 * 
 * Automação: Ao inserir Lead
 * - Identificar Setor_Lead automaticamente (com regras básicas)
 * - Selecionar corretor elegível (roleta/ordem/balanceado)
 * - Preencher responsavelRef no Lead
 * - Registrar em Histórico
 */

import wixData from 'wix-data';
import { v4 as uuid } from 'uuid';

/**
 * Trigger: afterInsert em leadsdecontato
 * Distribui lead automaticamente para corretor elegível
 */
export async function leadsdecontato_afterInsert(item) {
  try {
    console.log('🎯 Lead criado:', item._id);

    // 1. Identificar Setor_Lead automaticamente
    const setor = await identificarSetor(item);
    console.log('📍 Setor identificado:', setor.sectorName);

    // 2. Selecionar corretor elegível (round-robin)
    const corretor = await selecionarCorretorRoundRobin(setor._id);
    
    if (!corretor) {
      console.warn('⚠️ Nenhum corretor disponível para o setor:', setor.sectorName);
      
      // Registrar em histórico
      await registrarHistorico(item._id, 'Distribuição Falhou', 
        'Nenhum corretor disponível para o setor');
      
      return {
        success: false,
        motivo: 'Nenhum corretor disponível'
      };
    }

    console.log('👤 Corretor selecionado:', corretor._id);

    // 3. Atualizar Lead com responsavelRef
    const leadAtualizado = await wixData.update('leadsdecontato', item._id, {
      responsavelRef: corretor._id,
      statusFunil: 'Em Atendimento',
      unidadeRef: corretor.unidadeRef || null
    });

    console.log('✅ Lead atribuído ao corretor');

    // 4. Registrar em Histórico
    await registrarHistorico(item._id, 'Lead Distribuído',
      `Lead distribuído para ${corretor.name} (${setor.sectorName})`);

    // 5. Criar tarefa para o corretor
    await criarTarefaDistribuicao(item, corretor, setor);

    return {
      success: true,
      corretorId: corretor._id,
      setorId: setor._id,
      leadId: item._id
    };

  } catch (error) {
    console.error('❌ Erro ao distribuir lead:', error);
    
    // Registrar erro em histórico
    try {
      await registrarHistorico(item._id, 'Erro na Distribuição',
        `Erro ao distribuir lead: ${error.message}`);
    } catch (histError) {
      console.error('Erro ao registrar erro em histórico:', histError);
    }

    throw error;
  }
}

/**
 * Identificar Setor_Lead automaticamente baseado em regras
 */
async function identificarSetor(lead) {
  try {
    let setorId = null;

    // Regras básicas de identificação
    if (lead.tipoImovelDesejado === 'Apartamento' || lead.interessePrincipal === 'Moradia') {
      setorId = 'setor-residencial';
    } else if (lead.tipoImovelDesejado === 'Comercial' || lead.interessePrincipal === 'Comercial') {
      setorId = 'setor-comercial';
    } else if (lead.perfilCompra === 'Investidor') {
      setorId = 'setor-investimento';
    } else if (lead.tipoImovelDesejado === 'Terreno') {
      setorId = 'setor-terrenos';
    } else {
      // Setor padrão
      setorId = 'setor-geral';
    }

    // Buscar setor no banco de dados
    let setor = await wixData.get('setoreslead', setorId);

    // Se não existir, criar setor padrão
    if (!setor) {
      setor = await wixData.get('setoreslead', 'setor-geral');
    }

    // Se ainda não existir, retornar um setor genérico
    if (!setor) {
      setor = {
        _id: 'setor-geral',
        sectorName: 'Geral',
        isActive: true
      };
    }

    return setor;
  } catch (error) {
    console.error('Erro ao identificar setor:', error);
    
    // Retornar setor padrão em caso de erro
    return {
      _id: 'setor-geral',
      sectorName: 'Geral',
      isActive: true
    };
  }
}

/**
 * Selecionar corretor elegível usando round-robin
 */
async function selecionarCorretorRoundRobin(setorId) {
  try {
    // 1. Buscar todos os corretores ativos do setor
    const equipes = await wixData.query('equipedistribuicao')
      .eq('isActive', true)
      .contains('leadSectorRefs', setorId)
      .find();

    if (equipes.items.length === 0) {
      console.warn('Nenhum corretor ativo para o setor:', setorId);
      return null;
    }

    // 2. Ordenar por queueOrder (round-robin)
    const corretoresOrdenados = equipes.items.sort((a, b) => 
      (a.queueOrder || 0) - (b.queueOrder || 0)
    );

    // 3. Selecionar o primeiro (próximo na fila)
    const equipeEscolhida = corretoresOrdenados[0];

    // 4. Buscar dados do usuário/corretor
    const usuario = await wixData.get('usuariossistema', equipeEscolhida.userRef);

    if (!usuario) {
      console.warn('Usuário não encontrado:', equipeEscolhida.userRef);
      return null;
    }

    // 5. Atualizar queueOrder (rotacionar para próximo)
    const proximoIndex = (corretoresOrdenados.indexOf(equipeEscolhida) + 1) % corretoresOrdenados.length;
    const proximoQueueOrder = proximoIndex + 1;

    await wixData.update('equipedistribuicao', equipeEscolhida._id, {
      queueOrder: proximoQueueOrder
    });

    return {
      _id: usuario._id,
      name: usuario.name,
      email: usuario.emailLogin,
      unidadeRef: usuario.unidadeRef,
      equipaId: equipeEscolhida._id
    };

  } catch (error) {
    console.error('Erro ao selecionar corretor:', error);
    return null;
  }
}

/**
 * Registrar evento em Histórico
 */
async function registrarHistorico(leadId, tipoEvento, descricao) {
  try {
    const historico = {
      _id: uuid(),
      atendimentoRef: leadId, // Usando leadId como referência
      tipoEvento: tipoEvento,
      autorTipo: 'Sistema',
      autorRef: 'sistema-distribuicao',
      interactionDate: new Date().toISOString(),
      interactionType: 'Distribuição de Lead',
      interactionDescription: descricao,
      interactionOutcome: 'Sucesso',
      interactionMedium: 'Sistema'
    };

    await wixData.insert('historicointeracoes', historico);
    console.log('📝 Histórico registrado:', historico._id);

    return historico;
  } catch (error) {
    console.error('Erro ao registrar histórico:', error);
    throw error;
  }
}

/**
 * Criar tarefa para o corretor após distribuição
 */
async function criarTarefaDistribuicao(lead, corretor, setor) {
  try {
    const tarefa = {
      _id: uuid(),
      atendimentoRef: lead._id,
      titulo: `Novo Lead: ${lead.fullName}`,
      description: `Novo lead atribuído - ${lead.tipoImovelDesejado || 'Tipo não especificado'} - ${lead.cidadeDesejada || 'Localização não especificada'}`,
      responsavelInternoRef: corretor._id,
      status: 'Aberta',
      creationDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
      canalNotificacao: 'Email'
    };

    await wixData.insert('tarefasfinanciamento', tarefa);
    console.log('📋 Tarefa criada para corretor:', tarefa._id);

    return tarefa;
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    // Não lançar erro - tarefa é secundária
  }
}

/**
 * Função auxiliar: Obter leads de um corretor
 */
export async function getLeadsDoCorretor(corretorId) {
  try {
    const result = await wixData.query('leadsdecontato')
      .eq('responsavelRef', corretorId)
      .find();

    return result.items;
  } catch (error) {
    console.error('Erro ao buscar leads do corretor:', error);
    return [];
  }
}

/**
 * Função auxiliar: Reatribuir lead para outro corretor
 */
export async function reatribuirLead(leadId, novoCorretorId) {
  try {
    const lead = await wixData.get('leadsdecontato', leadId);
    
    if (!lead) {
      throw new Error('Lead não encontrado');
    }

    const anterior = lead.responsavelRef;

    const atualizado = await wixData.update('leadsdecontato', leadId, {
      responsavelRef: novoCorretorId
    });

    // Registrar em histórico
    await registrarHistorico(leadId, 'Lead Reatribuído',
      `Lead reatribuído de ${anterior} para ${novoCorretorId}`);

    return atualizado;
  } catch (error) {
    console.error('Erro ao reatribuir lead:', error);
    throw error;
  }
}
