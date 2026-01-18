/**
 * Hook: Pendências → Tarefas
 * 
 * AUTOMAÇÃO DESATIVADA: Pendências e Tarefas são entidades independentes
 * - Tarefas devem ser criadas manualmente pelo usuário
 * - Pendências não geram Tarefas automaticamente
 * - Se bloqueiaFase = true, impedir avanço de fase do Atendimento
 * - Gerar registro em Histórico
 */

import wixData from 'wix-data';
import { v4 as uuid } from 'uuid';

/**
 * Trigger: afterInsert em pendenciasfinanciamento
 * APENAS registra a pendência no histórico - NÃO cria tarefa automaticamente
 */
export async function pendenciasfinanciamento_afterInsert(item) {
  try {
    console.log('🔔 Pendência criada:', item._id);

    // 1. Se bloqueiaFase = true, impedir avanço de fase
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

    // 2. Registrar em Histórico (SEM criar tarefa automática)
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
      historicoId: historico._id,
      bloqueado: item.bloqueiaFase,
      tarefaAutomatica: false // Flag indicando que NÃO foi criada tarefa automática
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
        interactionDescription: `Erro ao processar pendência: ${error.message}`,
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
