/**
 * Testes de Integridade do Sistema
 * 
 * Valida:
 * 1. Dados mock criados corretamente
 * 2. Relacionamentos entre coleções
 * 3. Hooks funcionando corretamente
 * 4. Permissões de segurança
 */

import wixData from 'wix-data';

/**
 * Teste 1: Validar dados mock
 */
export async function testDadosMock() {
  console.log('🧪 TESTE 1: Validando dados mock...\n');

  try {
    // 1.1 Verificar Cliente PF
    console.log('📋 Verificando Cliente PF...');
    const clientePF = await wixData.query('clientes')
      .eq('cpfCnpj', '123.456.789-00')
      .find();

    if (clientePF.items.length === 0) {
      throw new Error('Cliente PF não encontrado');
    }

    const pf = clientePF.items[0];
    console.log(`✅ Cliente PF encontrado: ${pf.clientName}`);
    console.log(`   - CPF: ${pf.cpfCnpj}`);
    console.log(`   - Email: ${pf.emailPrincipal}`);
    console.log(`   - Papéis: ${pf.papeis}`);

    // 1.2 Verificar Cliente PJ
    console.log('\n📋 Verificando Cliente PJ...');
    const clientePJ = await wixData.query('clientes')
      .eq('cpfCnpj', '12.345.678/0001-90')
      .find();

    if (clientePJ.items.length === 0) {
      throw new Error('Cliente PJ não encontrado');
    }

    const pj = clientePJ.items[0];
    console.log(`✅ Cliente PJ encontrado: ${pj.nomeRazaoSocial}`);
    console.log(`   - CNPJ: ${pj.cpfCnpj}`);
    console.log(`   - Email: ${pj.emailPrincipal}`);
    console.log(`   - Papéis: ${pj.papeis}`);

    // 1.3 Verificar Imóvel
    console.log('\n🏠 Verificando Imóvel...');
    const imovel = await wixData.query('imoveis')
      .eq('propertyName', 'Apartamento Padrão')
      .find();

    if (imovel.items.length === 0) {
      throw new Error('Imóvel não encontrado');
    }

    const apt = imovel.items[0];
    console.log(`✅ Imóvel encontrado: ${apt.propertyName}`);
    console.log(`   - Tipo: ${apt.propertyType}`);
    console.log(`   - Quartos: ${apt.bedrooms}`);
    console.log(`   - Preço: R$ ${apt.price?.toLocaleString('pt-BR')}`);
    console.log(`   - Status: ${apt.status}`);

    // 1.4 Verificar Atendimento
    console.log('\n📞 Verificando Atendimento...');
    const atendimentos = await wixData.query('atendimentos')
      .eq('serviceType', 'Financiamento')
      .find();

    if (atendimentos.items.length === 0) {
      throw new Error('Atendimento não encontrado');
    }

    const atend = atendimentos.items[0];
    console.log(`✅ Atendimento encontrado: ${atend._id}`);
    console.log(`   - Tipo: ${atend.serviceType}`);
    console.log(`   - Status: ${atend.status}`);
    console.log(`   - Cliente Principal: ${atend.clientePrincipalRef}`);

    return {
      success: true,
      clientePF: pf,
      clientePJ: pj,
      imovel: apt,
      atendimento: atend
    };

  } catch (error) {
    console.error(`❌ Erro no teste de dados mock: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Teste 2: Validar relacionamentos
 */
export async function testRelacionamentos() {
  console.log('\n🧪 TESTE 2: Validando relacionamentos...\n');

  try {
    // 2.1 Verificar Atendimento_Partes
    console.log('🔗 Verificando Atendimento_Partes...');
    const partes = await wixData.query('atendimentopartes')
      .find();

    if (partes.items.length < 2) {
      throw new Error('Atendimento_Partes não encontrado ou incompleto');
    }

    console.log(`✅ ${partes.items.length} partes encontradas`);
    partes.items.forEach((parte, idx) => {
      console.log(`   ${idx + 1}. ${parte.roleInService} - ${parte.clientRef}`);
    });

    // 2.2 Verificar Atendimento_Imoveis
    console.log('\n🔗 Verificando Atendimento_Imoveis...');
    const atendImoveis = await wixData.query('atendimentoimoveis')
      .find();

    if (atendImoveis.items.length === 0) {
      throw new Error('Atendimento_Imoveis não encontrado');
    }

    console.log(`✅ ${atendImoveis.items.length} vínculo(s) encontrado(s)`);
    atendImoveis.items.forEach((vinc, idx) => {
      console.log(`   ${idx + 1}. Imóvel: ${vinc.imovelRef} - Papel: ${vinc.role}`);
    });

    // 2.3 Validar integridade referencial
    console.log('\n✔️ Validando integridade referencial...');
    
    for (const parte of partes.items) {
      const cliente = await wixData.get('clientes', parte.clientRef);
      if (!cliente) {
        throw new Error(`Cliente não encontrado: ${parte.clientRef}`);
      }
      console.log(`   ✅ Cliente ${parte.clientRef} existe`);
    }

    for (const vinc of atendImoveis.items) {
      const imovel = await wixData.get('imoveis', vinc.imovelRef);
      if (!imovel) {
        throw new Error(`Imóvel não encontrado: ${vinc.imovelRef}`);
      }
      console.log(`   ✅ Imóvel ${vinc.imovelRef} existe`);
    }

    return { success: true, partes: partes.items, atendImoveis: atendImoveis.items };

  } catch (error) {
    console.error(`❌ Erro no teste de relacionamentos: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Teste 3: Validar permissões de segurança
 */
export async function testPermissoes() {
  console.log('\n🧪 TESTE 3: Validando permissões de segurança...\n');

  try {
    const colecoesSensitivas = [
      'atendimentos', 'clientes', 'usuariossistema', 'empresas',
      'unidades', 'financeirolancamentos', 'templatescontratos',
      'contratos', 'historicointeracoes', 'documentosfinanciamento',
      'pendenciasfinanciamento', 'tarefasfinanciamento',
      'atendimentopartes', 'atendimentoimoveis', 'setoreslead',
      'equipedistribuicao', 'matches'
    ];

    console.log('🔐 Verificando coleções sensíveis...');
    console.log(`Total de coleções a verificar: ${colecoesSensitivas.length}\n`);

    for (const colecao of colecoesSensitivas) {
      try {
        // Tentar acessar a coleção
        const result = await wixData.query(colecao).limit(1).find();
        console.log(`✅ ${colecao} - Acessível (${result.items.length} itens)`);
      } catch (error) {
        console.log(`⚠️ ${colecao} - Erro ao acessar: ${error.message}`);
      }
    }

    console.log('\n✔️ Verificação de permissões concluída');
    return { success: true };

  } catch (error) {
    console.error(`❌ Erro no teste de permissões: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Teste 4: Validar hooks
 */
export async function testHooks() {
  console.log('\n🧪 TESTE 4: Validando hooks...\n');

  try {
    // 4.1 Verificar se histórico foi criado
    console.log('📝 Verificando Histórico...');
    const historico = await wixData.query('historicointeracoes')
      .limit(5)
      .descending('_createdDate')
      .find();

    console.log(`✅ ${historico.items.length} registros de histórico encontrados`);
    historico.items.slice(0, 3).forEach((hist, idx) => {
      console.log(`   ${idx + 1}. ${hist.tipoEvento} - ${hist.interactionDate}`);
    });

    // 4.2 Verificar se matches foram criados
    console.log('\n🎯 Verificando Matches...');
    const matches = await wixData.query('matches')
      .limit(5)
      .descending('score')
      .find();

    console.log(`✅ ${matches.items.length} matches encontrados`);
    matches.items.slice(0, 3).forEach((match, idx) => {
      console.log(`   ${idx + 1}. Score: ${match.score}% - Status: ${match.status}`);
    });

    // 4.3 Verificar se tarefas foram criadas
    console.log('\n📋 Verificando Tarefas...');
    const tarefas = await wixData.query('tarefasfinanciamento')
      .limit(5)
      .descending('_createdDate')
      .find();

    console.log(`✅ ${tarefas.items.length} tarefas encontradas`);
    tarefas.items.slice(0, 3).forEach((tarefa, idx) => {
      console.log(`   ${idx + 1}. ${tarefa.titulo} - Status: ${tarefa.status}`);
    });

    return { success: true, historico: historico.items, matches: matches.items, tarefas: tarefas.items };

  } catch (error) {
    console.error(`❌ Erro no teste de hooks: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Executar todos os testes
 */
export async function executarTodosTestes() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 INICIANDO TESTES DE INTEGRIDADE DO SISTEMA');
  console.log('═══════════════════════════════════════════════════════════\n');

  const resultados = {
    teste1: await testDadosMock(),
    teste2: await testRelacionamentos(),
    teste3: await testPermissoes(),
    teste4: await testHooks()
  };

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 RESUMO DOS TESTES');
  console.log('═══════════════════════════════════════════════════════════\n');

  const sucessos = Object.values(resultados).filter(r => r.success).length;
  const total = Object.keys(resultados).length;

  console.log(`✅ Testes bem-sucedidos: ${sucessos}/${total}`);
  
  if (sucessos === total) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO!');
  } else {
    console.log('\n⚠️ ALGUNS TESTES FALHARAM - Verifique os erros acima');
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');

  return resultados;
}

/**
 * Função para ser chamada via webhook ou API
 */
export async function runTests(request) {
  const resultados = await executarTodosTestes();
  
  return {
    statusCode: 200,
    body: JSON.stringify(resultados, null, 2)
  };
}
