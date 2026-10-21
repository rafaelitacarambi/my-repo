# R Sales — situação do desenvolvimento

Atualizado em 21/10/2026. Branch: `codex/preparacao-desenvolvimento`.
As alterações estão na proposta de revisão nº 1, sem merge e sem publicação.

## Concluído e verificado localmente

- Instalação reproduzível e compilação do projeto original.
- Retirada de Admin automático e autorização no servidor para APIs internas.
- Proteção de dados dos proprietários na consulta pública.
- Validação de assinaturas dos eventos de Clerk e WhatsApp.
- Páginas públicas podem renderizar sem configuração de Clerk; a área interna
  exibe aviso de preparação e não recebe acesso alternativo.
- Falhas ao carregar imóveis são diferenciadas de resultados vazios, com nova
  tentativa; filtros de venda/locação e preços foram ajustados.
- Paginação da API respeita limite e deslocamento, retornando total e próxima
  página. Características públicas usadas pelos filtros foram preservadas.
- Contratos são registrados como gerados, sem histórico fictício de envio.
  Entradas inválidas são rejeitadas e atualização comum não pode marcar assinatura.
- E-mail sem configuração não simula sucesso. Reenvio de assinatura, link de
  assinatura e envio WhatsApp ainda não integrados retornam erro explícito.
- Protótipo de assinatura exige opt-in em desenvolvimento; não opera em produção.
- Importação de modelos aplica limite de 5 MB no servidor. Texto extraído de PDF
  tem caracteres HTML escapados.
- Histórico local de mensagens evita duplicatas por ID, usa substituição atômica
  do arquivo e informa falha de leitura/escrita, sem apagar histórico corrompido.
- Idioma da página corrigido para pt-BR e título/descrição básicos adicionados.

## Verificação

- 62 testes automatizados passaram, usando dados fictícios e serviços simulados.
- Compilação de produção concluída.
- Verificação de tipos executada; resultado final registrado em DEVELOPMENT.md.
- Teste de renderização confirma navegação pública sem credenciais Clerk.
- Nenhum teste enviou mensagens ou alterou um banco real.

## O que não foi possível comprovar neste ambiente

| Item | Dependência ou limitação |
| --- | --- |
| Aparência e uso em celular/computador | Não houve navegador de QA compatível disponível neste ambiente; testes de renderização não substituem inspeção visual. |
| Cadastro, edição e persistência reais | Falta validar conexão e estrutura do PostgreSQL/Supabase com dados de teste. |
| Login e permissões com pessoas reais | Falta localizar/configurar a conta Clerk e um administrador de teste. Usuário autorizou adiar essa etapa. |
| Envio/recebimento real de WhatsApp | Exige conta Meta, credenciais, configuração do webhook e implementação/validação do envio. |
| Entrega real de e-mail | Exige conta Resend, remetente/domínio validado e testes de entrega. |
| Assinatura válida de contratos | O projeto contém um protótipo. Falta provedor, validação de identidade/consentimento, links e retorno assinado. |
| Fluxos legados | Parte das coleções continua usando serviços Wix; não foi comprovada sua conexão nem concluída migração para PostgreSQL. |
| Site acessível por link novo | Não foi feito deploy. A proposta no GitHub é código em revisão, não um site publicado. |

## Trabalho ainda necessário antes de uso real

Isto não é uma auditoria completa nem uma liberação para produção. Ainda há
trabalho de implementação, além das dependências de contas:

- Validar ponta a ponta geração de PDF, documentos do cliente, CRM e modelos de
  contratos, incluindo possíveis gravações parciais entre serviços.
- Definir permissões por registro e por equipe, limites de requisições e política
  de auditoria. Os controles atuais são principalmente por perfil/rota.
- Revisar sanitização do HTML de modelos DOCX/templates e conteúdo editável antes
  de disponibilizar edição a usuários não confiáveis.
- Completar persistência durável de mensagens: o arquivo JSON local não serve
  como banco compartilhado entre múltiplos servidores. A deduplicação atual é
  local, não distribuída.
- Tratar retentativas e idempotência de todos os eventos externos.
- Validar migrações contra uma cópia do banco e preparar backup/restauração.
- Revisar dependências herdadas e bundles grandes; a instalação ainda usa modo
  legado para conflitos de peers. Não foram feitas atualizações indiscriminadas.
- Validar filtros/segmentos cuja informação não exista no modelo atual e conferir
  todas as telas com dados representativos.

Não é necessário fornecer senhas pelo chat. Quando essas integrações forem
retomadas, configurar acessos pelos respectivos painéis e mecanismos seguros.
