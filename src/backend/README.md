# Backend - R Sales Imóveis

## 📁 Estrutura de Pastas

```
/src/backend/
├── hooks/                          # Automações Velo
│   ├── pendencias-tarefas.js       # Hook: Pendências → Tarefas
│   ├── leads-distribuicao.js       # Hook: Leads → Distribuição (Round-Robin)
│   └── leads-imoveis-matches.js    # Hook: Leads/Imóveis → Matches
├── tests/                          # Testes de integridade
│   └── test-integridade.js         # Suite de testes
└── README.md                       # Este arquivo
```

---

## 🔧 Hooks Implementados

### 1. **Pendências → Tarefas** (`pendencias-tarefas.js`)

**Trigger:** `afterInsert` em `pendenciasfinanciamento`

**Funcionalidade:**
- ✅ Cria Tarefa automaticamente quando Pendência é criada
- ✅ Se `bloqueiaFase = true`, marca Atendimento como bloqueado
- ✅ Registra evento em Histórico
- ✅ Impede avanço de fase do Atendimento

**Funções Exportadas:**
```javascript
// Automático (trigger)
pendenciasfinanciamento_afterInsert(item)

// Auxiliares
podeAvancarFase(atendimentoId)
getTarefasDaPendencia(pendenciaId)
atualizarStatusPendencia(pendenciaId, novoStatus)
```

**Exemplo de Uso:**
```javascript
// Verificar se atendimento pode avançar
const pode = await podeAvancarFase('atendimento-001');

// Obter tarefas de uma pendência
const tarefas = await getTarefasDaPendencia('pendencia-001');

// Atualizar status
await atualizarStatusPendencia('pendencia-001', 'Resolvida');
```

---

### 2. **Leads → Distribuição** (`leads-distribuicao.js`)

**Trigger:** `afterInsert` em `leadsdecontato`

**Funcionalidade:**
- ✅ Identifica Setor_Lead automaticamente (regras básicas)
- ✅ Seleciona corretor elegível usando round-robin
- ✅ Preenche `responsavelRef` no Lead
- ✅ Cria Tarefa para o corretor
- ✅ Registra em Histórico

**Regras de Identificação de Setor:**
- Apartamento/Moradia → Setor Residencial
- Comercial → Setor Comercial
- Investidor → Setor Investimento
- Terreno → Setor Terrenos
- Padrão → Setor Geral

**Funções Exportadas:**
```javascript
// Automático (trigger)
leadsdecontato_afterInsert(item)

// Auxiliares
getLeadsDoCorretor(corretorId)
reatribuirLead(leadId, novoCorretorId)
```

**Exemplo de Uso:**
```javascript
// Obter leads de um corretor
const leads = await getLeadsDoCorretor('usuario-001');

// Reatribuir lead
await reatribuirLead('lead-001', 'usuario-002');
```

---

### 3. **Leads/Imóveis → Matches** (`leads-imoveis-matches.js`)

**Triggers:**
- `afterInsert` em `leadsdecontato`
- `afterUpdate` em `leadsdecontato`
- `afterInsert` em `imoveis`
- `afterUpdate` em `imoveis`

**Funcionalidade:**
- ✅ Executa algoritmo de matching
- ✅ Gera Matches com score (0-100) e motivo
- ✅ Se score >= 70, cria Tarefa "ação comercial"
- ✅ Registra em Histórico
- ✅ Atualiza matches quando lead/imóvel muda

**Algoritmo de Score:**
```
Tipo de Imóvel:        20 pontos
Localização (Cidade):  15 pontos
Localização (Bairro):  10 pontos
Faixa de Preço:        25 pontos
Quartos:               10 pontos
Perfil de Compra:       5 pontos
Financiamento:          5 pontos
FGTS:                   5 pontos
─────────────────────────────────
Total Máximo:         100 pontos
```

**Funções Exportadas:**
```javascript
// Automático (triggers)
leadsdecontato_afterInsert(item)
leadsdecontato_afterUpdate(item)
imoveis_afterInsert(item)
imoveis_afterUpdate(item)

// Auxiliares
getMatchesDoLead(leadId)
getMatchesDoImovel(imovelId)
atualizarStatusMatch(matchId, novoStatus)
```

**Exemplo de Uso:**
```javascript
// Obter matches de um lead
const matches = await getMatchesDoLead('lead-001');

// Obter matches de um imóvel
const matches = await getMatchesDoImovel('imovel-001');

// Atualizar status de match
await atualizarStatusMatch('match-001', 'Em Contato');
```

---

## 🧪 Testes de Integridade

**Arquivo:** `tests/test-integridade.js`

### Testes Inclusos:

#### Teste 1: Dados Mock
- ✅ Verifica Cliente PF
- ✅ Verifica Cliente PJ
- ✅ Verifica Imóvel
- ✅ Verifica Atendimento

#### Teste 2: Relacionamentos
- ✅ Valida Atendimento_Partes
- ✅ Valida Atendimento_Imoveis
- ✅ Verifica integridade referencial

#### Teste 3: Permissões
- ✅ Verifica acesso às coleções sensíveis
- ✅ Valida restrições de segurança

#### Teste 4: Hooks
- ✅ Verifica registros de Histórico
- ✅ Verifica Matches criados
- ✅ Verifica Tarefas criadas

### Executar Testes:

```javascript
import { executarTodosTestes } from '/src/backend/tests/test-integridade.js';

// Executar todos os testes
const resultados = await executarTodosTestes();

// Ou testes individuais
import { testDadosMock, testRelacionamentos, testPermissoes, testHooks } from '/src/backend/tests/test-integridade.js';

const teste1 = await testDadosMock();
const teste2 = await testRelacionamentos();
const teste3 = await testPermissoes();
const teste4 = await testHooks();
```

---

## 📊 Dados Mock Criados

### Cliente PF
```javascript
{
  _id: 'cliente-pf-001',
  clientName: 'João Silva',
  cpfCnpj: '123.456.789-00',
  emailPrincipal: 'joao@email.com',
  papéis: 'Comprador, Investidor',
  status: 'Ativo'
}
```

### Cliente PJ
```javascript
{
  _id: 'cliente-pj-001',
  nomeRazaoSocial: 'Construtora XYZ',
  cpfCnpj: '12.345.678/0001-90',
  emailPrincipal: 'contato@construtora.com',
  papéis: 'Vendedor, Construtora',
  status: 'Ativo'
}
```

### Imóvel
```javascript
{
  _id: 'imovel-001',
  propertyName: 'Apartamento Padrão',
  propertyType: 'Apartamento',
  bedrooms: 3,
  bathrooms: 2,
  area: 100,
  price: 500000,
  status: 'Disponível'
}
```

### Atendimento
```javascript
{
  _id: 'atendimento-001',
  serviceType: 'Financiamento',
  clientePrincipalRef: 'cliente-pf-001',
  status: 'Aberto'
}
```

### Atendimento_Partes
```javascript
[
  {
    atendimentoRef: 'atendimento-001',
    clientRef: 'cliente-pf-001',
    roleInService: 'Comprador',
    participationPercentage: 100
  },
  {
    atendimentoRef: 'atendimento-001',
    clientRef: 'cliente-pj-001',
    roleInService: 'Vendedor',
    participationPercentage: 0
  }
]
```

### Atendimento_Imoveis
```javascript
{
  atendimentoRef: 'atendimento-001',
  imovelRef: 'imovel-001',
  role: 'Propriedade Alvo'
}
```

---

## 🔐 Permissões de Segurança

### Coleções Internas (Restringidas)
Apenas Admin/Membros do site podem ler e escrever:
- atendimentos
- clientes
- usuariossistema
- empresas
- unidades
- financeirolancamentos
- templatescontratos
- contratos
- historicointeracoes
- documentosfinanciamento
- pendenciasfinanciamento
- tarefasfinanciamento
- atendimentopartes
- atendimentoimoveis
- setoreslead
- equipedistribuicao
- matches

### Coleção Leads (Especial)
- **Read:** Admin/Membros (equipe interna)
- **Write:** Backend/Webhooks + Formulários internos
- **Filtro:** Corretor vê apenas leads atribuídos a ele

### Coleção Imóveis
- **Read:** Público
- **Write:** Admin/Membros apenas

---

## 🚀 Fluxo de Automação Completo

```
1. Lead é criado via formulário de contato
   ↓
2. Hook: leadsdecontato_afterInsert
   - Identifica setor
   - Seleciona corretor (round-robin)
   - Preenche responsavelRef
   - Cria tarefa para corretor
   - Registra em histórico
   ↓
3. Hook: leadsdecontato_afterInsert (matching)
   - Busca todos os imóveis disponíveis
   - Calcula score para cada imóvel
   - Cria matches com score >= 0
   - Se score >= 70, cria tarefa "ação comercial"
   - Registra em histórico
   ↓
4. Corretor recebe tarefa e contata lead
   ↓
5. Se lead aceita, cria Atendimento
   ↓
6. Atendimento pode ter Pendências
   ↓
7. Hook: pendenciasfinanciamento_afterInsert
   - Cria tarefa automaticamente
   - Se bloqueiaFase=true, bloqueia avanço
   - Registra em histórico
```

---

## 📝 Logs e Monitoramento

Todos os hooks registram logs detalhados:

```javascript
console.log('🎯 Lead criado:', item._id);
console.log('📍 Setor identificado:', setor.sectorName);
console.log('👤 Corretor selecionado:', corretor._id);
console.log('✅ Lead atribuído ao corretor');
console.log('📝 Histórico registrado:', historico._id);
```

Verifique os logs em:
- Wix Dashboard → Velo → Logs
- Ou via API de logs do Velo

---

## 🔗 Referências

- [Wix Velo Documentation](https://www.wix.com/velo)
- [Wix Data API](https://www.wix.com/velo/reference/wix-data)
- [Wix Hooks](https://www.wix.com/velo/reference/wix-data/hooks)

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs em Wix Dashboard
2. Execute os testes de integridade
3. Consulte a documentação de Velo
4. Contate o time de desenvolvimento

