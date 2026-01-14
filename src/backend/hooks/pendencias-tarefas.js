/**
 * Hook: Pendências → Tarefas
 * 
 * Automação: Ao criar uma Pendência, criar Tarefa automaticamente
 * - Se bloqueiaFase = true, impedir avanço de fase do Atendimento
 * - Gerar registro em Histórico
 */

import wixData from 'wix-data';
import { v4 as uuid } from 'uuid';

/**
 * Trigger: afterInsert em pendenciasfinanciamento
 * Cria tarefa automaticamente quando uma pendência é criada
 */
export async function pendenciasfinanciamento_afterInsert(item) {
  try {
    console.log('🔔 Pendência criada:', item._id);

    // 1. Criar Tarefa automaticamente
    const tarefa = {
      _id: uuid(),
      pendenciaRef: item._id,
      atendimentoRef: item.atendimentoRef,
      titulo: `Tarefa: ${item.title}`,
      description: item.description,
      responsavelExternoRef: item.responsavelExternoRef,
      responsavelInternoRef: item.responsavelInternoRef,
      responsibleType: item.responsiblePartyType,
      dueDate: item.dueDate,
      status: 'Aberta',
      creationDate: new Date().toISOString(),
      canalNotificacao: 'Email'
    };

    await wixData.insert('tarefasfinanciamento', tarefa);
    console.log('✅ Tarefa criada:', tarefa._id);

    // 2. Se bloqueiaFase = true, impedir avanço de fase
    if (item.bloqueiaFase) {
      const atendimento = await wixData.get('atendimentos', item.atendimentoRef);
      
      if (atendimento) {
        // Marcar atendimento como bloqueado
        await wixData.update('atendimentos', item.atendimentoRef, {
          alertaAtraso: true,
          notes: `${atendimento.notes || ''}\n⚠️ BLOQUEADO: Pendência crítica - ${item.title}`
        });
        console.log('🚫 Atendimento bloqueado para avanço de fase');
      }
    }

    // 3. Registrar em Histórico
    const historico = {
      _id: uuid(),
      atendimentoRef: item.atendimentoRef,
      tipoEvento: 'Pendência Criada',
      autorTipo: 'Sistema',
      autorRef: 'sistema-automacao',
      interactionDate: new Date().toISOString(),
      interactionType: 'Criação de Pendência',
      interactionDescription: `Pendência criada: ${item.title}${item.bloqueiaFase ? ' (BLOQUEIA FASE)' : ''}`,
      interactionOutcome: 'Sucesso',
      interactionMedium: 'Sistema'
    };

    await wixData.insert('historicointeracoes', historico);
    console.log('📝 Histórico registrado:', historico._id);

    return {
      success: true,
      tarefaId: tarefa._id,
      historicoId: historico._id,
      bloqueado: item.bloqueiaFase
    };

  } catch (error) {
    console.error('❌ Erro ao processar pendência:', error);
    
    // Registrar erro em histórico
    try {
      await wixData.insert('historicointeracoes', {
        _id: uuid(),
        atendimentoRef: item.atendimentoRef,
        tipoEvento: 'Erro na Automação',
        autorTipo: 'Sistema',
        autorRef: 'sistema-automacao',
        interactionDate: new Date().toISOString(),
        interactionType: 'Erro',
        interactionDescription: `Erro ao criar tarefa para pendência: ${error.message}`,
        interactionOutcome: 'Erro',
        interactionMedium: 'Sistema'
      });
    } catch (histError) {
      console.error('Erro ao registrar erro em histórico:', histError);
    }

    throw error;
  }
}

/**
 * Função auxiliar: Verificar se atendimento pode avançar de fase
 */
export async function podeAvancarFase(atendimentoId) {
  try {
    const pendencias = await wixData.query('pendenciasfinanciamento')
      .eq('atendimentoRef', atendimentoId)
      .eq('bloqueiaFase', true)
      .eq('status', 'Aberta')
      .find();

    return pendencias.items.length === 0;
  } catch (error) {
    console.error('Erro ao verificar pendências bloqueantes:', error);
    return false;
  }
}

/**
 * Função auxiliar: Obter todas as tarefas de uma pendência
 */
export async function getTarefasDaPendencia(pendenciaId) {
  try {
    const result = await wixData.query('tarefasfinanciamento')
      .eq('pendenciaRef', pendenciaId)
      .find();

    return result.items;
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    return [];
  }
}

/**
 * Função auxiliar: Atualizar status de pendência
 */
export async function atualizarStatusPendencia(pendenciaId, novoStatus) {
  try {
    const pendencia = await wixData.get('pendenciasfinanciamento', pendenciaId);
    
    if (!pendencia) {
      throw new Error('Pendência não encontrada');
    }

    const atualizado = await wixData.update('pendenciasfinanciamento', pendenciaId, {
      status: novoStatus,
      resolvedDate: novoStatus === 'Resolvida' ? new Date().toISOString() : null
    });

    // Registrar em histórico
    await wixData.insert('historicointeracoes', {
      _id: uuid(),
      atendimentoRef: pendencia.atendimentoRef,
      tipoEvento: 'Status da Pendência Alterado',
      autorTipo: 'Sistema',
      autorRef: 'sistema-automacao',
      interactionDate: new Date().toISOString(),
      interactionType: 'Atualização',
      interactionDescription: `Pendência ${pendencia.title} - Status alterado para: ${novoStatus}`,
      interactionOutcome: 'Sucesso',
      interactionMedium: 'Sistema'
    });

    return atualizado;
  } catch (error) {
    console.error('Erro ao atualizar status de pendência:', error);
    throw error;
  }
}
