# Configuração de Permissões de Segurança - R Sales Imóveis

## 📋 Resumo Executivo

Documento de configuração de permissões para todas as coleções CMS do sistema R Sales Imóveis. Implementa modelo de segurança baseado em papéis (RBAC) com restrições rigorosas para dados sensíveis.

---

## 🔒 Coleções Internas (Restringidas)

Estas coleções contêm dados sensíveis e devem ser acessíveis apenas por administradores e membros autenticados do site.

### Coleções com Restrição Total:

| Coleção | Read | Write | Delete | Motivo |
|---------|------|-------|--------|--------|
| **atendimentos** | Admin/Membros | Admin/Membros | Admin | Dados de serviço sensíveis |
| **clientes** | Admin/Membros | Admin/Membros | Admin | Informações pessoais/jurídicas |
| **usuariossistema** | Admin/Membros | Admin | Admin | Gestão de usuários |
| **empresas** | Admin/Membros | Admin/Membros | Admin | Dados corporativos |
| **unidades** | Admin/Membros | Admin/Membros | Admin | Configuração operacional |
| **financeirolancamentos** | Admin/Membros | Admin/Membros | Admin | Dados financeiros sensíveis |
| **templatescontratos** | Admin/Membros | Admin/Membros | Admin | Templates legais |
| **contratos** | Admin/Membros | Admin/Membros | Admin | Documentos legais |
| **historicointeracoes** | Admin/Membros | Admin/Membros | Admin | Auditoria de eventos |
| **documentosfinanciamento** | Admin/Membros | Admin/Membros | Admin | Documentos financeiros |
| **pendenciasfinanciamento** | Admin/Membros | Admin/Membros | Admin | Tarefas críticas |
| **tarefasfinanciamento** | Admin/Membros | Admin/Membros | Admin | Tarefas operacionais |
| **atendimentopartes** | Admin/Membros | Admin/Membros | Admin | Relacionamentos de atendimento |
| **atendimentoimoveis** | Admin/Membros | Admin/Membros | Admin | Relacionamentos de propriedade |
| **setoreslead** | Admin/Membros | Admin/Membros | Admin | Configuração de setores |
| **equipedistribuicao** | Admin/Membros | Admin/Membros | Admin | Gestão de equipe |
| **matches** | Admin/Membros | Admin/Membros | Admin | Resultados de matching |

**Regra de Ouro:** ❌ NUNCA permitir "Public" write em nenhuma destas coleções.

---

## 📞 Coleção Leads (leadsdecontato)

Modelo especial com permissões diferenciadas para suportar fluxo de vendas.

### Permissões:

```
Read:   Admin/Membros (equipe interna)
Write:  Backend/Webhooks + Formulários internos
Delete: Admin apenas
```

### Regras de Acesso por Papel:

#### Admin
- ✅ Lê todos os leads
- ✅ Escreve/edita todos os leads
- ✅ Deleta leads
- ✅ Vê relatórios consolidados

#### Corretor (Membro)
- ✅ Lê apenas leads atribuídos a ele (via `responsavelRef`)
- ✅ Edita apenas leads atribuídos a ele
- ❌ Não pode deletar
- ✅ Vê relatórios pessoais

#### Sistema (Backend)
- ✅ Insere leads via webhook (formulário de contato)
- ✅ Atualiza `responsavelRef` automaticamente (distribuição)
- ✅ Atualiza `statusFunil` automaticamente
- ✅ Cria registros em `historicointeracoes`

### Implementação no Backend:

```javascript
// Filtro de acesso para Corretores
if (userRole === 'corretor') {
  query = query.eq('responsavelRef', userId);
}

// Validação de permissão antes de editar
function canEditLead(lead, userId, userRole) {
  if (userRole === 'admin') return true;
  if (userRole === 'corretor') {
    return lead.responsavelRef === userId;
  }
  return false;
}
```

---

## 🏠 Coleção Imóveis (imoveis)

Dados públicos com escrita restrita.

### Permissões:

```
Read:   Público (qualquer visitante)
Write:  Admin/Membros apenas
Delete: Admin apenas
```

**Justificativa:** Imóveis são catálogo público, mas apenas equipe interna pode gerenciar.

---

## 🔐 Coleção Preferências Lead (preferenciaslead)

Dados de preferência do lead.

### Permissões:

```
Read:   Admin/Membros
Write:  Admin/Membros + Sistema (backend)
Delete: Admin apenas
```

---

## 📊 Matriz de Permissões Resumida

```
┌─────────────────────────────────────────────────────────────────┐
│                    MATRIZ DE PERMISSÕES                         │
├──────────────────────────┬──────────┬──────────┬──────────┬──────┤
│ Coleção                  │ Público  │ Corretor │ Admin    │ Bot  │
├──────────────────────────┼──────────┼──────────┼──────────┼──────┤
│ imoveis (Read)           │ ✅       │ ✅       │ ✅       │ ✅   │
│ imoveis (Write)          │ ❌       │ ❌       │ ✅       │ ❌   │
├──────────────────────────┼──────────┼──────────┼──────────┼──────┤
│ leadsdecontato (Read)    │ ❌       │ ✅*      │ ✅       │ ✅   │
│ leadsdecontato (Write)   │ ❌       │ ❌       │ ✅       │ ✅   │
├──────────────────────────┼──────────┼──────────┼──────────┼──────┤
│ clientes (Read)          │ ❌       │ ❌       │ ✅       │ ✅   │
│ clientes (Write)         │ ❌       │ ❌       │ ✅       │ ✅   │
├──────────────────────────┼──────────┼──────────┼──────────┼──────┤
│ atendimentos (Read)      │ ❌       │ ❌       │ ✅       │ ✅   │
│ atendimentos (Write)     │ ❌       │ ❌       │ ✅       │ ✅   │
├──────────────────────────┼──────────┼──────────┼──────────┼──────┤
│ Demais (Read)            │ ❌       │ ❌       │ ✅       │ ✅   │
│ Demais (Write)           │ ❌       │ ❌       │ ✅       │ ✅   │
└──────────────────────────┴──────────┴──────────┴──────────┴──────┘

* Corretor vê apenas leads atribuídos a ele (responsavelRef)
```

---

## 🛡️ Implementação de Segurança

### 1. Validação de Permissão (Frontend)

```typescript
// Hook para verificar permissão
function useCanAccessCollection(collectionId: string) {
  const { member } = useMember();
  
  const internalCollections = [
    'atendimentos', 'clientes', 'usuariossistema', 'empresas',
    'unidades', 'financeirolancamentos', 'templatescontratos',
    'contratos', 'historicointeracoes', 'documentosfinanciamento',
    'pendenciasfinanciamento', 'tarefasfinanciamento',
    'atendimentopartes', 'atendimentoimoveis', 'setoreslead',
    'equipedistribuicao', 'matches'
  ];
  
  if (internalCollections.includes(collectionId)) {
    return member !== null; // Apenas membros autenticados
  }
  
  return true; // Público
}
```

### 2. Validação no Backend (Velo)

```javascript
// Validar antes de qualquer operação
export async function validatePermission(userId, collectionId, operation) {
  const user = await getUser(userId);
  
  if (!user) throw new Error('Unauthorized');
  
  const internalCollections = [
    'atendimentos', 'clientes', 'usuariossistema', 'empresas',
    'unidades', 'financeirolancamentos', 'templatescontratos',
    'contratos', 'historicointeracoes', 'documentosfinanciamento',
    'pendenciasfinanciamento', 'tarefasfinanciamento',
    'atendimentopartes', 'atendimentoimoveis', 'setoreslead',
    'equipedistribuicao', 'matches'
  ];
  
  if (internalCollections.includes(collectionId)) {
    if (operation === 'write' && user.role !== 'admin') {
      throw new Error('Write access denied');
    }
  }
  
  return true;
}
```

### 3. Filtro de Leads por Corretor

```javascript
// Ao buscar leads para um corretor
export async function getLeadsForCorretor(corretorId) {
  return await wixData.query('leadsdecontato')
    .eq('responsavelRef', corretorId)
    .find();
}

// Validar antes de editar
export async function updateLead(leadId, updates, userId, userRole) {
  const lead = await wixData.get('leadsdecontato', leadId);
  
  if (userRole === 'corretor' && lead.responsavelRef !== userId) {
    throw new Error('Cannot edit leads assigned to other users');
  }
  
  return await wixData.update('leadsdecontato', leadId, updates);
}
```

---

## 🚀 Dados Mock Criados para Teste

### Cliente PF
- **ID:** `cliente-pf-001`
- **Nome:** João Silva
- **CPF:** 123.456.789-00
- **Email:** joao@email.com
- **Papéis:** Comprador, Investidor
- **Status:** Ativo

### Cliente PJ
- **ID:** `cliente-pj-001`
- **Nome:** Construtora XYZ
- **CNPJ:** 12.345.678/0001-90
- **Email:** contato@construtora.com
- **Papéis:** Vendedor, Construtora
- **Status:** Ativo

### Imóvel
- **ID:** `imovel-001`
- **Nome:** Apartamento Padrão
- **Tipo:** Apartamento
- **Quartos:** 3
- **Banheiros:** 2
- **Área:** 100m²
- **Preço:** R$ 500.000
- **Status:** Disponível

### Atendimento
- **ID:** `atendimento-001`
- **Tipo:** Financiamento
- **Cliente Principal:** João Silva (cliente-pf-001)
- **Status:** Aberto
- **Fase:** Análise de Crédito

### Atendimento_Partes
- **Parte 1:** João Silva (Comprador) - 100%
- **Parte 2:** Construtora XYZ (Vendedor) - 0% (referência)

### Atendimento_Imoveis
- **Imóvel:** Apartamento Padrão (imovel-001)
- **Papel:** Propriedade Alvo

---

## ✅ Checklist de Implementação

- [x] Coleções internas restritas a Admin/Membros
- [x] Leads com permissão especial de leitura por equipe
- [x] Imóveis com leitura pública, escrita restrita
- [x] Dados mock criados para teste
- [ ] Hooks Velo implementados (próxima etapa)
- [ ] Testes de integridade executados
- [ ] Documentação de API atualizada

---

## 📞 Suporte e Dúvidas

Para questões sobre permissões ou segurança, consulte a documentação de Velo da Wix:
- https://www.wix.com/velo/reference/wix-data
- https://www.wix.com/velo/reference/wix-members

