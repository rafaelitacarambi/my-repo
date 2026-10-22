# Primeira hospedagem R Sales (ambiente de testes)

O projeto completo é Astro SSR com Node standalone. A demonstração no Sites é uma exportação separada e não substitui este servidor.

## Render

1. Entre no Render e autorize o acesso ao repositório `rafaelitacarambi/my-repo`.
2. Crie um Web Service (não Static Site), com a branch `codex/preparacao-desenvolvimento`.
3. Runtime: Node; região Ohio; plano Free para a validação inicial.
4. Build: `npm ci --include=dev && npm run build:host`.
5. Start: `npm start`.
6. Configure `HOST=0.0.0.0`, `NODE_VERSION=24.19.0` e as três variáveis abaixo no painel de ambiente do serviço. Não envie os valores para o GitHub ou para mensagens.
7. Mantenha publicação automática desligada. Publique manualmente após conferir as variáveis.

Também existe `render.yaml` para importar estas definições como Blueprint, selecionando a mesma branch.

## Conexões obrigatórias

- `DATABASE_URL`: conexão do banco Supabase existente. Copie a conexão apropriada no painel Connect. Se a conexão direta não for alcançável, use o session pooler. Não crie banco vazio para substituir o original.
- `PUBLIC_CLERK_PUBLISHABLE_KEY`: chave da instância Development que contém os usuários já cadastrados; necessária durante o build do frontend.
- `CLERK_SECRET_KEY`: chave secreta da mesma instância, preenchida somente no ambiente de hospedagem.

O usuário conferido no painel é `rafaelitacarambi@gmail.com`, com `publicMetadata.role` igual a `Admin`. Não conceder Admin automaticamente a outros usuários Google.

O build gera apenas o Prisma Client. Não executa `db push`, `migrate deploy`, reset ou seeds. Antes de qualquer futura migração, conferir o esquema real e providenciar backup.

## Validação após a primeira publicação

- Conferir o domínio retornado pelo Render e a configuração de login Google no Clerk.
- Entrar com a conta Admin; abrir `/api/admin/readiness` no mesmo domínio. `database: connected` confirma apenas a conexão, não a compatibilidade do esquema. Sem login retorna 401; sem perfil Admin, 403. Depois confirmar carregamento das listas internas.
- Testar conta sem perfil: deve ser negada nas APIs internas.
- Validar conexão e esquema antes de criar ou alterar registros reais.
- Só habilitar webhooks após configurar as respectivas assinaturas: `CLERK_WEBHOOK_SIGNING_SECRET` e `WHATSAPP_APP_SECRET`, além dos demais tokens indicados em `.env.example`.

## Limites desta etapa

A configuração de hospedagem não conclui os módulos que ainda estavam em desenvolvimento. WhatsApp, e-mail e assinatura digital exigem configuração e validação próprias. O armazenamento atual de mensagens usa arquivo local: não é adequado para persistência em hospedagem com disco efêmero. Não ativar recepção de mensagens reais antes de migrar esse armazenamento.

O plano Free é apenas para testes e pode suspender o processo quando ocioso. Nenhum plano pago é contratado por este arquivo. Para operação diária, revisar persistência e recursos antes de escolher o plano.

Referência oficial: https://render.com/docs/deploy-astro
