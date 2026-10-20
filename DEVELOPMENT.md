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
- Revisar a autorização das rotas de API, inclusive coleções genéricas e rotas
  de diagnóstico. Proteção de tela React não protege acesso direto à API.
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
- O controle adicionado cobre gestão de usuários, não todas as APIs.
- Webhooks Clerk/WhatsApp ainda precisam de validação de assinatura; a rota de
  assinatura de contratos também requer revisão de identidade do signatário.
