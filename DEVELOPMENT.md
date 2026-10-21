# Continuação do projeto R Sales

Base importada: commit `edf3ee4` do repositório original. O ZIP fornecido e
o repositório tinham o mesmo código; o ZIP também continha configurações locais.

## Preparação

1. Instale Node compatível com `package.json` (>=20).
2. Execute `npm ci`. A configuração `.npmrc` mantém o modo de resolução
   legado necessário para esta árvore; ainda existem conflitos de peers entre
   React 18/React Leaflet 5 e pacotes Wix. Não atualize o lockfile indiscriminadamente.
3. Copie `.env.example` para `.env` e configure banco e Clerk de desenvolvimento.
   Não versione esse arquivo. WhatsApp e Resend são integrações opcionais.
4. Execute `npx prisma generate` para gerar o cliente local. Esse comando não
   aplica migrações nem grava registros no banco.
5. Execute `npm run build` e depois `npm run dev` para desenvolvimento.

Se instalar com `--ignore-scripts`, execute explicitamente a geração do Prisma
antes de compilar. Não execute seeds, importações ou migrações contra produção
como parte da preparação.

## Pendências antes de disponibilizar para usuários

- O perfil Admin automático foi removido. O primeiro administrador precisa ter
  `publicMetadata.role` definido como `Admin` no painel Clerk, por alguém com
  acesso à conta do projeto. Não há bootstrap público de administrador.
- Criação de usuários e CRUD de `usuariossistema` agora exigem sessão Clerk
  verificada e perfil Admin consultado no servidor. Contas bloqueadas ou banidas
  são negadas. O payload com senha não é mais registrado pela rota de criação.
- Middleware protege APIs internas com sessão e perfil verificados. Diagnósticos,
  sincronização em lote e gestão de usuários exigem Admin; cobranças exigem
  Admin ou Financeiro. Revisar futuramente autorização por registro/equipe.
- Validar login e permissões com contas de teste de cada perfil, leitura e
  escrita em banco de desenvolvimento e funcionamento dos contratos.
- Confirmar a necessidade de `security.checkOrigin: false` na configuração Astro.

Não considerar a compilação uma validação de acesso ou das integrações.

## Verificação desta preparação

- Instalação concluída com `npm ci --legacy-peer-deps --ignore-scripts`.
- Cliente Prisma 5.21.1 gerado com sucesso.
- `npm run build` concluído com sucesso em Node 24.19.0.
- Build ainda emite aviso de bundles maiores que 500 kB.
- Navegação no navegador, login e banco externo não foram validados.
- Não foram executados seeds, migrações nem envios de mensagens.

## Verificação da autorização de usuários

- 22 testes automatizados passaram: papéis ausentes/desconhecidos, sessão ausente,
  conta bloqueada/banida, erros do provedor, origem cruzada, administrador válido
  e negação em todas as seis entradas de gestão de usuários.
- Compilação concluída após as alterações.
- Testes usam Clerk simulado; não substituem teste com contas reais.
- As demais APIs agora passam pelo middleware; as exceções explícitas são leitura
  pública de imóveis e os dois webhooks com validação de assinatura própria.
- A rota de assinatura só simula em `astro dev` com opt-in explícito. Assinatura
  real depende de integração e verificação da identidade/consentimento.


## Segunda etapa: APIs, imóveis públicos e eventos

- Consultas públicas de imóveis retornam apenas campos permitidos e imóveis
  AVAILABLE. Nome, telefone, e-mail do proprietário e endereço exato ficam fora
  da resposta pública. Equipe autenticada mantém a resposta completa.
- Webhook Clerk usa verifyWebhook do SDK; WhatsApp usa HMAC SHA-256 do corpo
  original. Sem as variáveis de assinatura, retornam 503 sem processar eventos.
- SIGNATURE_SIMULATION_ENABLED é false por padrão. Em build/produção, a rota
  retorna 501; a simulação em desenvolvimento valida o vínculo signatário/contrato
  e registra no histórico que é uma simulação. Não representa assinatura real.
- 40 testes simulados passaram e npm run build concluiu. Nenhum dado real foi
  alterado e nenhuma mensagem foi enviada.
- Ainda faltam testes visuais, configuração das contas externas, permissões por
  registro, revisão completa do fluxo de contratos, limites de requisições e
  tratamento idempotente de eventos repetidos. Não é liberação para produção.

## Terceira etapa: consulta e confirmações de envio

- Lista e detalhe de imóveis distinguem falha de rede/servidor de ausência de
  resultados e oferecem nova tentativa. Troca de imóvel reinicia carregamento
  e galeria; respostas de consultas antigas são ignoradas.
- Campos usados pelos filtros são normalizados a partir da API. Venda e locação
  simultâneas são reconhecidas, inclusive sem acento; faixa de aluguel usa o
  preço de locação, também exibido nos cartões.
- Sem chave Resend, envio retorna FAILED, sem mensagem fictícia nem ID simulado.
  Resposta sem ID do provedor também falha. A API retorna 503 nessas falhas, e a
  tela só confirma quando o provedor aceita. Aceitação não comprova entrega.
- 46 testes simulados passaram. Revisão visual no navegador ainda pendente.

## Rodada de conclusão local — 21/10/2026

Consulte STATUS_DESENVOLVIMENTO.md para o relatório consolidado. Foram adicionados
validação de contratos, estados honestos de geração/envio, paginação, limite de
upload, acesso público sem Clerk e confiabilidade do histórico local. A suíte
local contém 62 testes aprovados e o build de produção passou. Não houve deploy,
merge, migração de banco real nem envio de mensagens.

Verificação final: `npm run type-check` concluída com código de saída 0.
