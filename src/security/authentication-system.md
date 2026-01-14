# Sistema de Autenticação Invite-Only

## Visão Geral

O sistema implementa autenticação invite-only integrada com Wix Members, validando acesso através da coleção `usuariossistema`. Login social (Google/Facebook) está desabilitado por padrão no Wix Dashboard.

## Arquitetura

### 1. Hook de Validação (`use-auth-validation.ts`)

**Localização:** `/src/hooks/use-auth-validation.ts`

**Responsabilidade:** Valida se o usuário autenticado tem permissão para acessar o sistema.

**Fluxo de Validação:**
1. Verifica se o usuário está autenticado via Wix Members
2. Busca o email do membro autenticado
3. Consulta a coleção `usuariossistema` para verificar se existe registro
4. Valida se o usuário está ativo (`ativo: true`)
5. Retorna perfil do usuário e status de autorização

**Retorno:**
```typescript
{
  isValidating: boolean;    // Carregando validação
  isAuthorized: boolean;    // Usuário autorizado
  userProfile: UsuriosdoSistema | null;  // Dados do perfil
  error: string | null;     // Mensagem de erro
}
```

### 2. Componente de Proteção de Rotas (`protected-admin-route.tsx`)

**Localização:** `/src/components/ui/protected-admin-route.tsx`

**Responsabilidade:** Protege rotas administrativas com validação de perfil.

**Recursos:**
- Valida autenticação via `MemberProtectedRoute`
- Valida autorização via `useAuthValidation`
- Filtra acesso por perfil de usuário
- Exibe mensagens de erro apropriadas

**Uso:**
```tsx
<ProtectedAdminRoute allowedProfiles={['Admin']}>
  <AdminUsuariosPage />
</ProtectedAdminRoute>
```

### 3. Área Restrita (`AreaRestritaPage.tsx`)

**Localização:** `/src/components/pages/AreaRestritaPage.tsx`

**Funcionalidades:**
- Validação de acesso ao sistema
- Redirecionamento automático por perfil
- Botão de logout
- Dashboard personalizado por perfil

**Redirecionamentos por Perfil:**
- **Admin:** `/admin/usuarios`
- **Corretor:** `/admin/imoveis`
- **Operacional:** `/admin/atendimentos`
- **Financeiro:** `/admin/financeiro`

## Perfis de Usuário

### Admin
- **Acesso:** Total ao sistema
- **Permissões:** Gestão de usuários, todas as funcionalidades
- **Dashboard:** Gestão de Usuários

### Corretor
- **Acesso:** Imóveis, leads, clientes
- **Permissões:** CRUD de imóveis, gestão de leads
- **Dashboard:** Cadastro de Imóveis

### Operacional
- **Acesso:** Atendimentos, agendamentos, processos
- **Permissões:** Gestão operacional
- **Dashboard:** Gestão de Atendimentos

### Financeiro
- **Acesso:** Gestão financeira, lançamentos
- **Permissões:** Controle financeiro
- **Dashboard:** Gestão Financeira

## Rotas Protegidas

### Rotas com Validação Básica (Qualquer usuário autenticado e autorizado)
- `/area-restrita` - Área Restrita Principal
- `/perfil` - Perfil do Usuário
- `/admin/imoveis` - Cadastro de Imóveis
- `/admin/leads` - Gestão de Leads
- `/admin/processos` - Gestão de Processos
- `/admin/chaves` - Gestão de Chaves
- `/admin/clientes` - Gestão de Clientes
- `/admin/atendimentos` - Gestão de Atendimentos
- `/admin/agendamentos` - Gestão de Agendamentos
- `/admin/historico` - Histórico de Interações
- `/admin/financiamento-kanban` - Kanban de Financiamento
- `/admin/financiamento/:atendimentoId` - Detalhes do Financiamento

### Rotas com Validação de Perfil
- `/admin/financeiro` - Apenas Admin e Financeiro
- `/admin/usuarios` - Apenas Admin

## Gestão de Usuários

### Página de Gestão (`AdminUsuariosPage.tsx`)

**Funcionalidades:**
- Listagem de usuários do sistema
- Busca por nome, email ou perfil
- Cadastro de novos usuários
- Edição de usuários existentes
- Exclusão de usuários
- Integração com Wix Members
- Estatísticas de usuários (Total, Ativos, Pendentes, Inativos)

### Modal de Cadastro (`UserRegistrationModal.tsx`)

**Campos:**
- Nome Completo (obrigatório)
- Email de Login (obrigatório)
- Perfil de Acesso (obrigatório): Admin, Corretor, Operacional, Financeiro
- Unidade (opcional)
- Status (obrigatório): Ativo, Pendente, Inativo
- Ativo (switch): Habilita/desabilita acesso

**Integração Wix Members:**
- Vinculação manual com membro Wix existente
- Campo `memberRef` armazena referência ao membro
- Sincronização de email e nome

## Header com Logout

**Localização:** `/src/components/Header.tsx`

**Funcionalidades:**
- Detecta se usuário está autenticado
- Exibe botão "Área Restrita" para não autenticados
- Exibe botão "Área Restrita" + botão de Logout para autenticados
- Botão de logout com ícone (desktop) e texto (mobile)

## Fluxo de Autenticação

### 1. Acesso Inicial
```
Usuário acessa /area-restrita
  ↓
MemberProtectedRoute verifica autenticação Wix
  ↓
Se não autenticado → Redireciona para login Wix
  ↓
Se autenticado → Continua para validação
```

### 2. Validação de Autorização
```
useAuthValidation busca email do membro
  ↓
Consulta coleção usuariossistema
  ↓
Verifica se usuário existe e está ativo
  ↓
Se não autorizado → Exibe mensagem de erro
  ↓
Se autorizado → Permite acesso
```

### 3. Redirecionamento por Perfil
```
AreaRestritaPage detecta perfil do usuário
  ↓
Redireciona para dashboard específico
  ↓
Admin → /admin/usuarios
Corretor → /admin/imoveis
Operacional → /admin/atendimentos
Financeiro → /admin/financeiro
```

## Desabilitação de Login Social

**Configuração no Wix Dashboard:**
1. Acesse o Wix Dashboard
2. Navegue para Settings → Members Area
3. Desabilite "Social Login" (Google, Facebook)
4. Mantenha apenas "Email Login"

**Resultado:**
- Usuários só podem fazer login com email/senha
- Novos usuários só podem ser criados via convite (cadastro manual pelo Admin)
- Não há auto-registro público

## Mensagens de Erro

### Usuário não cadastrado
```
"Usuário não cadastrado no sistema. Entre em contato com o administrador."
```

### Usuário inativo
```
"Usuário inativo. Entre em contato com o administrador."
```

### Sem permissão de perfil
```
"Você não tem permissão para acessar esta página. Perfil necessário: Admin"
```

## Segurança

### Camadas de Proteção
1. **Autenticação Wix:** Verifica se usuário está logado
2. **Validação de Cadastro:** Verifica se usuário existe em `usuariossistema`
3. **Validação de Status:** Verifica se usuário está ativo
4. **Validação de Perfil:** Verifica permissões específicas por rota

### Boas Práticas Implementadas
- Validação em múltiplas camadas
- Mensagens de erro claras e informativas
- Loading states durante validação
- Proteção de rotas no nível do Router
- Logout acessível em todas as páginas
- Redirecionamento automático por perfil

## Manutenção

### Adicionar Novo Perfil
1. Atualizar `UserRegistrationModal.tsx` com novo perfil
2. Atualizar `AdminUsuariosPage.tsx` com cores do badge
3. Atualizar `AreaRestritaPage.tsx` com redirecionamento
4. Atualizar esta documentação

### Adicionar Nova Rota Protegida
1. Adicionar rota no `Router.tsx`
2. Envolver com `<ProtectedAdminRoute>`
3. Especificar `allowedProfiles` se necessário
4. Atualizar esta documentação

### Modificar Permissões
1. Editar `allowedProfiles` na rota específica em `Router.tsx`
2. Testar acesso com diferentes perfis
3. Atualizar esta documentação
