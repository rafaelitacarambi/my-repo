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

- `src/hooks/use-auth-validation.ts` concede Admin quando não encontra um perfil.
  Substituir esse comportamento por negação de acesso e validar os perfis reais.
- A rota `src/pages/api/admin/users/create.ts` não verifica a autorização do
  solicitante e registra o payload, que inclui senha. Revisar autorização no
  servidor e remover dados sensíveis dos logs.
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
