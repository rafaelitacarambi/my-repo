# Backend Hooks - Sistema de Financiamento

## Automações Ativas

### 1. Leads - Distribuição Automática
**Arquivo:** `hooks/leads-distribuicao.js`
**Trigger:** `afterInsert` em `leadsdecontato`
**Função:** Distribuir leads automaticamente para a equipe de vendas

### 2. Leads - Matches de Imóveis
**Arquivo:** `hooks/leads-imoveis-matches.js`
**Trigger:** `afterInsert` em `leadsdecontato`
**Função:** Criar matches automáticos entre leads e imóveis compatíveis

### 3. Pendências - Registro no Histórico
**Arquivo:** `hooks/pendencias-tarefas.js`
**Trigger:** `afterInsert` em `pendenciasfinanciamento`
**Função:** 
- Registrar criação de pendência no histórico
- Bloquear avanço de fase se `bloqueiaFase = true`
- **IMPORTANTE:** NÃO cria tarefas automaticamente

## Automações Desativadas

### ❌ Criação Automática de Tarefas
**Status:** DESATIVADA desde 2026-01-18
**Motivo:** Pendências e Tarefas são entidades independentes
**Comportamento Atual:**
- Pendências devem ser criadas manualmente
- Tarefas devem ser criadas manualmente
- Não há vinculação automática entre Pendências e Tarefas

## Regras de Negócio

### Pendências
- Podem bloquear avanço de fase (`bloqueiaFase = true`)
- São registradas no histórico automaticamente
- **NÃO** geram tarefas automaticamente

### Tarefas
- Devem ser criadas manualmente pelo usuário
- Devem estar vinculadas a um Atendimento (`atendimentoRef` obrigatório)
- Possuem status: "A Fazer", "Em andamento", "Concluída"
- Tarefas concluídas aparecem no histórico

## Testes de Integridade

**Arquivo:** `tests/test-integridade.js`
**Função:** Validar integridade dos dados e relacionamentos

## Notas Importantes

1. **Permissões:** As collections de Tarefas devem ter permissões adequadas para escrita por membros autorizados
2. **Histórico:** Todas as operações importantes são registradas em `historicointeracoes`
3. **Validações:** Campos obrigatórios são validados no frontend antes do envio
