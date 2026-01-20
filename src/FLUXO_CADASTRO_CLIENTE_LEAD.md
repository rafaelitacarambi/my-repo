# Novo Fluxo de Cadastro: Cliente + Lead

## 📋 Resumo das Mudanças

Este documento descreve as alterações implementadas no fluxo de cadastro de clientes na Área Restrita, conforme solicitado.

---

## 🔴 Comportamentos Removidos

### 1. Criação Automática de Atendimentos
- **REMOVIDO**: A criação automática de atendimentos ao selecionar papéis/funções
- **MOTIVO**: Papéis devem ser apenas informativos, não devem disparar criação de processos

### 2. Obrigatoriedade de Papéis
- **REMOVIDO**: A validação que exigia pelo menos um papel selecionado
- **MOTIVO**: Papéis são agora opcionais e apenas para classificação no CRM

### 3. Associação Direta Papéis → Kanbans
- **REMOVIDO**: Qualquer lógica que vinculava papéis a kanbans ou processos
- **MOTIVO**: O fluxo agora é Cliente → Lead → Distribuição, não Cliente → Atendimento

---

## ✅ Novo Fluxo Implementado

### Passo 1: Cadastro do Cliente
**Arquivo**: `/src/components/ClientRegistrationModal.tsx`

1. Usuário preenche dados do cliente:
   - Nome (obrigatório)
   - Email ou Telefone (pelo menos um obrigatório)
   - Endereço (opcional)
   - Notas (opcional)

2. Sistema verifica duplicatas (email/telefone)

3. Avança para seleção de papéis

### Passo 2: Seleção de Papéis (OPCIONAL)
**Arquivo**: `/src/components/ClientRegistrationModal.tsx`

1. Usuário pode selecionar papéis/funções:
   - Comprador
   - Vendedor
   - Locatário
   - Locador
   - Investidor
   - Parceiro
   - Construtora / Incorporadora
   - Prestador

2. **IMPORTANTE**: Seleção é opcional - pode criar cliente sem nenhum papel

3. Papéis são salvos no campo `Clientes.papeis` como string separada por vírgulas

4. Papéis servem apenas para classificação no CRM, não disparam nenhum processo

### Passo 3: Opção de Criar Lead
**Arquivo**: `/src/components/ClientRegistrationModal.tsx`

1. Sistema pergunta: "Criar Lead para este cliente?"
   - ( ) Sim
   - ( ) Não

2. Se **NÃO**: Cliente é criado e fluxo termina

3. Se **SIM**: Após criar cliente, abre modal de Lead

### Passo 4: Formulário de Lead
**Arquivo**: `/src/components/LeadRegistrationModal.tsx`

Campos do formulário:

#### Obrigatórios:
- **Interesse Principal**:
  - Compra
  - Locação
  - Investimento
  - Leilão Caixa
  - Imóvel na Planta

#### Opcionais:
- **Tipo de Imóvel Desejado**:
  - Casa
  - Apartamento
  - Terreno
  - Área
  - Comercial

- **Localização**:
  - Cidade desejada
  - Bairro desejado

- **Valores**:
  - Faixa de valor mínima (R$)
  - Faixa de valor máxima (R$)
  - Entrada disponível (R$)
  - Renda bruta aproximada (R$)

- **Perfil de Compra**:
  - MCMV
  - Usado
  - Alto padrão
  - Investidor
  - Leilão Caixa
  - Planta

- **Urgência**:
  - Baixa
  - Média
  - Alta

### Passo 5: Criação do Lead
**Arquivo**: `/src/components/LeadRegistrationModal.tsx`

Ao salvar o lead:

1. **Criação no CMS**:
   - Collection: `leadsdecontato`
   - Cliente_Ref: preenchido automaticamente
   - Status: "Novo"
   - Status Funil: "Novo"
   - Origem: "Área Restrita"
   - Data de submissão: data atual
   - Última interação: data atual

2. **Dados do cliente copiados**:
   - Nome completo
   - Email
   - Telefone

---

## 🤖 Automações Obrigatórias (Backend)

### Hook: leads-distribuicao.js
**Arquivo**: `/src/backend/hooks/leads-distribuicao.js`

Após criar o Lead, o hook backend automaticamente:

#### 1. Identificação de Setor
- Analisa os dados do lead (tipo de imóvel, interesse, perfil)
- Identifica o setor apropriado (Residencial, Comercial, Investimento, etc.)

#### 2. Distribuição de Corretor (Round-Robin)
- Busca corretores ativos do setor identificado
- Seleciona o próximo corretor na fila (round-robin)
- Atualiza o campo `responsavelRef` no lead
- Atualiza `statusFunil` para "Em Atendimento"

#### 3. Criação de Tarefa
- Cria tarefa automática para o corretor:
  - Título: "Novo Lead: [Nome do Cliente]"
  - Descrição: Tipo de imóvel e localização
  - Status: "Aberta"
  - Prazo: 24 horas
  - Canal de notificação: Email

#### 4. Registro em Histórico
- Registra evento "Lead Distribuído" em `historicointeracoes`
- Inclui: corretor atribuído, setor, data/hora

---

## 📊 Estrutura de Dados

### Collection: clientes
```typescript
{
  _id: string;
  clientName: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  notes?: string;
  status: 'Ativo';
  papeis?: string; // "Comprador, Vendedor" (opcional)
}
```

### Collection: leadsdecontato
```typescript
{
  _id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  interessePrincipal: string; // obrigatório
  tipoImovelDesejado?: string;
  cidadeDesejada?: string;
  bairroDesejado?: string;
  faixaValorMin?: number;
  faixaValorMax?: number;
  potencialEntrada?: number;
  rendaBruta?: number;
  perfilCompra?: string;
  urgencia?: string;
  leadStatus: 'Novo';
  statusFunil: 'Novo';
  leadSource: 'Área Restrita';
  submissionDate: Date;
  ultimaInteracao: Date;
  responsavelRef?: string; // preenchido pelo hook
  unidadeRef?: string; // preenchido pelo hook
}
```

---

## 🔄 Fluxo Completo (Diagrama)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USUÁRIO CLICA "CRIAR NOVO" → "CLIENTE"                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. PREENCHE DADOS DO CLIENTE                                    │
│    - Nome (obrigatório)                                         │
│    - Email/Telefone (obrigatório)                               │
│    - Endereço, Notas (opcional)                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. SISTEMA VERIFICA DUPLICATAS                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. SELEÇÃO DE PAPÉIS (OPCIONAL)                                 │
│    - Pode selecionar 0 ou mais papéis                           │
│    - Papéis são apenas informativos                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. PERGUNTA: "CRIAR LEAD?"                                      │
│    ( ) Sim  ( ) Não                                             │
└─────────────────────────────────────────────────────────────────┘
         ↓                                    ↓
    ┌────────┐                          ┌─────────┐
    │  SIM   │                          │   NÃO   │
    └────────┘                          └─────────┘
         ↓                                    ↓
┌─────────────────────┐              ┌──────────────┐
│ 6. ABRE FORMULÁRIO  │              │ FIM DO FLUXO │
│    DE LEAD          │              └──────────────┘
└─────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. PREENCHE DADOS DO LEAD                                       │
│    - Interesse principal (obrigatório)                          │
│    - Tipo de imóvel, localização, valores (opcional)            │
│    - Perfil de compra, urgência (opcional)                      │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. CRIA LEAD NO CMS                                             │
│    - Status: "Novo"                                             │
│    - Origem: "Área Restrita"                                    │
│    - Cliente_Ref: preenchido                                    │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. HOOK BACKEND (leads-distribuicao.js)                         │
│    ✓ Identifica setor automaticamente                           │
│    ✓ Atribui corretor (round-robin)                             │
│    ✓ Cria tarefa para corretor                                  │
│    ✓ Registra em histórico                                      │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 10. SUCESSO!                                                    │
│     - Lead criado e distribuído                                 │
│     - Corretor notificado                                       │
│     - Tarefa criada                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Pontos Importantes

### ✅ O que foi implementado:
1. ✅ Papéis são opcionais (não bloqueiam o fluxo)
2. ✅ Papéis são apenas informativos (salvos em `Clientes.papeis`)
3. ✅ Modal opcional para criar Lead após cliente
4. ✅ Formulário completo de Lead com todos os campos solicitados
5. ✅ Lead criado com Status="Novo" e Origem="Área Restrita"
6. ✅ Hook backend já implementado para distribuição automática
7. ✅ Criação automática de tarefa para corretor
8. ✅ Registro em histórico

### ⚠️ O que NÃO foi alterado:
- ❌ Não foi removida a criação de atendimentos em outros fluxos (apenas no fluxo de cliente)
- ❌ O hook backend já existe e funciona - não foi necessário criar
- ❌ As collections já existem - não foi necessário criar

### 🔧 Arquivos Modificados:
1. `/src/components/ClientRegistrationModal.tsx` - Fluxo de cadastro de cliente
2. `/src/components/LeadRegistrationModal.tsx` - Formulário de lead
3. `/src/FLUXO_CADASTRO_CLIENTE_LEAD.md` - Esta documentação

---

## 🧪 Como Testar

### Teste 1: Criar Cliente sem Papéis e sem Lead
1. Acesse Área Restrita
2. Clique em "Criar Novo" → "Cliente"
3. Preencha apenas nome e telefone
4. Clique em "Próximo"
5. NÃO selecione nenhum papel
6. Selecione "Não" para criar lead
7. Clique em "Criar Cliente"
8. ✅ Cliente deve ser criado sem papéis e sem lead

### Teste 2: Criar Cliente com Papéis e sem Lead
1. Acesse Área Restrita
2. Clique em "Criar Novo" → "Cliente"
3. Preencha dados do cliente
4. Clique em "Próximo"
5. Selecione 2-3 papéis
6. Selecione "Não" para criar lead
7. Clique em "Criar Cliente"
8. ✅ Cliente deve ser criado com papéis salvos em `papeis`

### Teste 3: Criar Cliente + Lead (Fluxo Completo)
1. Acesse Área Restrita
2. Clique em "Criar Novo" → "Cliente"
3. Preencha dados do cliente
4. Clique em "Próximo"
5. Selecione papéis (opcional)
6. Selecione "Sim" para criar lead
7. Clique em "Criar Cliente"
8. Modal de Lead deve abrir automaticamente
9. Preencha dados do lead (interesse principal obrigatório)
10. Clique em "Criar Lead"
11. ✅ Lead deve ser criado e distribuído automaticamente
12. ✅ Verifique em Admin → Leads que o lead tem corretor atribuído
13. ✅ Verifique em Admin → Tarefas que foi criada tarefa para o corretor

### Teste 4: Verificar Distribuição Automática
1. Após criar lead (Teste 3)
2. Acesse Admin → Leads
3. Encontre o lead criado
4. ✅ Campo "Responsável" deve estar preenchido
5. ✅ Status Funil deve ser "Em Atendimento"
6. Acesse Admin → Tarefas
7. ✅ Deve existir tarefa "Novo Lead: [Nome]" para o corretor

---

## 📝 Notas Técnicas

### Validações
- Nome do cliente: obrigatório
- Email OU Telefone: pelo menos um obrigatório
- Interesse Principal (lead): obrigatório
- Todos os outros campos: opcionais

### Campos Automáticos
- `_id`: gerado com `crypto.randomUUID()`
- `status` (cliente): "Ativo"
- `leadStatus` (lead): "Novo"
- `statusFunil` (lead): "Novo" (atualizado para "Em Atendimento" pelo hook)
- `leadSource` (lead): "Área Restrita"
- `submissionDate` (lead): data atual
- `ultimaInteracao` (lead): data atual
- `responsavelRef` (lead): preenchido pelo hook backend
- `unidadeRef` (lead): preenchido pelo hook backend

### Dependências
- Hook backend: `/src/backend/hooks/leads-distribuicao.js` (já existe)
- Collections: `clientes`, `leadsdecontato`, `usuariossistema`, `equipedistribuicao`, `setoreslead`, `tarefasfinanciamento`, `historicointeracoes` (já existem)

---

## ✨ Melhorias Futuras (Sugestões)

1. **Notificações em Tempo Real**: Notificar corretor via WhatsApp quando lead é atribuído
2. **Dashboard de Distribuição**: Visualizar estatísticas de distribuição de leads
3. **Regras de Distribuição Avançadas**: Permitir configurar regras customizadas por setor
4. **Histórico de Leads do Cliente**: Mostrar todos os leads criados para um cliente
5. **Edição de Papéis**: Permitir editar papéis do cliente após criação

---

## 🆘 Suporte

Em caso de dúvidas ou problemas:
1. Verifique os logs do console do navegador
2. Verifique os logs do backend (Wix Console)
3. Consulte a documentação das collections em `/src/entities/index.ts`
4. Revise o código dos hooks em `/src/backend/hooks/`

---

**Última atualização**: 2026-01-20
**Versão**: 1.0
