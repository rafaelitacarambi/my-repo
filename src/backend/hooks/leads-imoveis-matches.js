/**
 * Hook: Leads/Imóveis → Matches
 * 
 * Automação: Ao inserir/atualizar Lead OU Imóvel
 * - Rodar função de match
 * - Gerar Matches com score e motivo
 * - Se score >= 70, criar Tarefa "ação comercial" para o corretor
 * - Registrar em Histórico
 */

import wixData from 'wix-data';
import { v4 as uuid } from 'uuid';

/**
 * Trigger: afterInsert em leadsdecontato
 * Executar matching quando novo lead é criado
 */
export async function leadsdecontato_afterInsert(item) {
  try {
    console.log('🎯 Lead criado, iniciando matching:', item._id);
    await executarMatching(item._id, 'lead');
  } catch (error) {
    console.error('❌ Erro ao executar matching para lead:', error);
  }
}

/**
 * Trigger: afterUpdate em leadsdecontato
 * Executar matching quando lead é atualizado (preferências mudaram)
 */
export async function leadsdecontato_afterUpdate(item) {
  try {
    console.log('🔄 Lead atualizado, re-executando matching:', item._id);
    
    // Limpar matches antigos
    await limparMatchesAntigos(item._id);
    
    // Executar novo matching
    await executarMatching(item._id, 'lead');
  } catch (error) {
    console.error('❌ Erro ao re-executar matching para lead:', error);
  }
}

/**
 * Trigger: afterInsert em imoveis
 * Executar matching quando novo imóvel é adicionado
 */
export async function imoveis_afterInsert(item) {
  try {
    console.log('🏠 Imóvel criado, iniciando matching:', item._id);
    await executarMatching(item._id, 'imovel');
  } catch (error) {
    console.error('❌ Erro ao executar matching para imóvel:', error);
  }
}

/**
 * Trigger: afterUpdate em imoveis
 * Executar matching quando imóvel é atualizado
 */
export async function imoveis_afterUpdate(item) {
  try {
    console.log('🔄 Imóvel atualizado, re-executando matching:', item._id);
    
    // Limpar matches antigos
    await limparMatchesAntigos(item._id);
    
    // Executar novo matching
    await executarMatching(item._id, 'imovel');
  } catch (error) {
    console.error('❌ Erro ao re-executar matching para imóvel:', error);
  }
}

/**
 * Executar algoritmo de matching
 */
async function executarMatching(itemId, tipo) {
  try {
    if (tipo === 'lead') {
      // Buscar lead
      const lead = await wixData.get('leadsdecontato', itemId);
      if (!lead) return;

      // Buscar todos os imóveis disponíveis
      const imoveis = await wixData.query('imoveis')
        .eq('status', 'Disponível')
        .find();

      // Calcular matches para cada imóvel
      for (const imovel of imoveis.items) {
        const score = calcularScore(lead, imovel);
        
        if (score > 0) {
          await criarOuAtualizarMatch(lead._id, imovel._id, score, lead.responsavelRef);
        }
      }

      console.log(`✅ Matching concluído para lead: ${imoveis.items.length} imóveis analisados`);

    } else if (tipo === 'imovel') {
      // Buscar imóvel
      const imovel = await wixData.get('imoveis', itemId);
      if (!imovel) return;

      // Buscar todos os leads ativos
      const leads = await wixData.query('leadsdecontato')
        .ne('statusFunil', 'Fechado')
        .ne('statusFunil', 'Perdido')
        .find();

      // Calcular matches para cada lead
      for (const lead of leads.items) {
        const score = calcularScore(lead, imovel);
        
        if (score > 0) {
          await criarOuAtualizarMatch(lead._id, imovel._id, score, lead.responsavelRef);
        }
      }

      console.log(`✅ Matching concluído para imóvel: ${leads.items.length} leads analisados`);
    }

  } catch (error) {
    console.error('Erro ao executar matching:', error);
    throw error;
  }
}

/**
 * Calcular score de compatibilidade entre lead e imóvel
 * Score de 0 a 100
 */
function calcularScore(lead, imovel) {
  let score = 0;

  // 1. Tipo de imóvel (20 pontos)
  if (lead.tipoImovelDesejado && imovel.propertyType) {
    if (lead.tipoImovelDesejado.toLowerCase() === imovel.propertyType.toLowerCase()) {
      score += 20;
    }
  }

  // 2. Localização - Cidade (15 pontos)
  if (lead.cidadeDesejada && imovel.cidade) {
    if (lead.cidadeDesejada.toLowerCase() === imovel.cidade.toLowerCase()) {
      score += 15;
    }
  }

  // 3. Localização - Bairro (10 pontos)
  if (lead.bairroDesejado && imovel.bairro) {
    if (lead.bairroDesejado.toLowerCase() === imovel.bairro.toLowerCase()) {
      score += 10;
    }
  }

  // 4. Faixa de preço (25 pontos)
  if (lead.faixaValorMin && lead.faixaValorMax && imovel.price) {
    if (imovel.price >= lead.faixaValorMin && imovel.price <= lead.faixaValorMax) {
      score += 25;
    } else if (imovel.price >= lead.faixaValorMin * 0.9 && imovel.price <= lead.faixaValorMax * 1.1) {
      // Margem de 10% - 10 pontos
      score += 10;
    }
  }

  // 5. Quartos (10 pontos)
  if (lead.tipoImovelDesejado && imovel.bedrooms) {
    // Se procura apartamento, considerar quartos
    if (lead.tipoImovelDesejado.toLowerCase().includes('apartamento')) {
      if (imovel.bedrooms >= 2 && imovel.bedrooms <= 4) {
        score += 10;
      }
    }
  }

  // 6. Perfil de compra (5 pontos)
  if (lead.perfilCompra === 'Investidor' && imovel.investimentoOportunidade) {
    score += 5;
  }

  // 7. Financiamento (5 pontos)
  if (lead.perfilCompra !== 'À Vista' && imovel.permiteFinanciamento) {
    score += 5;
  }

  // 8. FGTS (5 pontos)
  if (imovel.aceitaFgts) {
    score += 5;
  }

  // Penalidades
  // Se imóvel não permite financiamento e lead precisa
  if (lead.perfilCompra !== 'À Vista' && !imovel.permiteFinanciamento) {
    score -= 10;
  }

  // Garantir score entre 0 e 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Criar ou atualizar match
 */
async function criarOuAtualizarMatch(leadId, imovelId, score, corretorId) {
  try {
    // Verificar se match já existe
    const existentes = await wixData.query('matches')
      .eq('leadRef', leadId)
      .eq('propertyRef', imovelId)
      .find();

    const motivo = gerarMotivo(score);

    if (existentes.items.length > 0) {
      // Atualizar match existente
      const match = existentes.items[0];
      await wixData.update('matches', match._id, {
        score: score,
        reason: motivo,
        status: score >= 70 ? 'Novo' : 'Baixa Compatibilidade'
      });

      console.log(`🔄 Match atualizado: ${leadId} <-> ${imovelId} (Score: ${score})`);
    } else {
      // Criar novo match
      const novoMatch = {
        _id: uuid(),
        leadRef: leadId,
        propertyRef: imovelId,
        score: score,
        reason: motivo,
        status: score >= 70 ? 'Novo' : 'Baixa Compatibilidade',
        responsibleAgentRef: corretorId,
        matchDate: new Date().toISOString(),
        notifiedWhatsApp: false,
        notifiedEmail: false
      };

      await wixData.insert('matches', novoMatch);
      console.log(`✨ Match criado: ${leadId} <-> ${imovelId} (Score: ${score})`);

      // Se score >= 70, criar tarefa para o corretor
      if (score >= 70 && corretorId) {
        await criarTarefaAcaoComercial(leadId, imovelId, score, corretorId);
      }
    }

  } catch (error) {
    console.error('Erro ao criar/atualizar match:', error);
    throw error;
  }
}

/**
 * Gerar motivo do match baseado no score
 */
function gerarMotivo(score) {
  if (score >= 90) {
    return 'Compatibilidade excelente - Tipo, localização e preço ideais';
  } else if (score >= 80) {
    return 'Compatibilidade muito boa - Atende maioria dos critérios';
  } else if (score >= 70) {
    return 'Compatibilidade boa - Atende critérios principais';
  } else if (score >= 50) {
    return 'Compatibilidade moderada - Alguns critérios atendidos';
  } else {
    return 'Compatibilidade baixa - Poucos critérios atendidos';
  }
}

/**
 * Criar tarefa de ação comercial para o corretor
 */
async function criarTarefaAcaoComercial(leadId, imovelId, score, corretorId) {
  try {
    const tarefa = {
      _id: uuid(),
      atendimentoRef: leadId,
      titulo: `🎯 Ação Comercial: Match ${Math.round(score)}%`,
      description: `Novo match de alta compatibilidade encontrado. Lead compatível com imóvel. Score: ${score}%`,
      responsavelInternoRef: corretorId,
      status: 'Aberta',
      creationDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 horas
      canalNotificacao: 'Email'
    };

    await wixData.insert('tarefasfinanciamento', tarefa);
    console.log(`📋 Tarefa de ação comercial criada: ${tarefa._id}`);

    // Registrar em histórico
    await wixData.insert('historicointeracoes', {
      _id: uuid(),
      atendimentoRef: leadId,
      tipoEvento: 'Match de Alta Compatibilidade',
      autorTipo: 'Sistema',
      autorRef: 'sistema-matching',
      interactionDate: new Date().toISOString(),
      interactionType: 'Match Criado',
      interactionDescription: `Match com score ${score}% - Tarefa de ação comercial criada`,
      interactionOutcome: 'Sucesso',
      interactionMedium: 'Sistema'
    });

    return tarefa;
  } catch (error) {
    console.error('Erro ao criar tarefa de ação comercial:', error);
    // Não lançar erro - tarefa é secundária
  }
}

/**
 * Limpar matches antigos de um lead ou imóvel
 */
async function limparMatchesAntigos(itemId) {
  try {
    // Buscar matches antigos
    const matches = await wixData.query('matches')
      .or([
        wixData.filter().eq('leadRef', itemId),
        wixData.filter().eq('propertyRef', itemId)
      ])
      .find();

    // Deletar matches antigos
    for (const match of matches.items) {
      await wixData.remove('matches', match._id);
    }

    console.log(`🗑️ ${matches.items.length} matches antigos removidos`);
  } catch (error) {
    console.error('Erro ao limpar matches antigos:', error);
    // Não lançar erro - limpeza é secundária
  }
}

/**
 * Função auxiliar: Obter matches de um lead
 */
export async function getMatchesDoLead(leadId) {
  try {
    const result = await wixData.query('matches')
      .eq('leadRef', leadId)
      .descending('score')
      .find();

    return result.items;
  } catch (error) {
    console.error('Erro ao buscar matches do lead:', error);
    return [];
  }
}

/**
 * Função auxiliar: Obter matches de um imóvel
 */
export async function getMatchesDoImovel(imovelId) {
  try {
    const result = await wixData.query('matches')
      .eq('propertyRef', imovelId)
      .descending('score')
      .find();

    return result.items;
  } catch (error) {
    console.error('Erro ao buscar matches do imóvel:', error);
    return [];
  }
}

/**
 * Função auxiliar: Atualizar status de match
 */
export async function atualizarStatusMatch(matchId, novoStatus) {
  try {
    const atualizado = await wixData.update('matches', matchId, {
      status: novoStatus
    });

    console.log(`✅ Match atualizado para status: ${novoStatus}`);
    return atualizado;
  } catch (error) {
    console.error('Erro ao atualizar status de match:', error);
    throw error;
  }
}
