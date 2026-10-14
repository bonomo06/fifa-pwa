# FC 27 Carreira

PWA (funciona offline e pode ser instalado no celular) para ajudar no modo carreira do EA SPORTS FC 27.

- **Buscar**: ~19,8 mil jogadores do FC 27 com filtros de posição, idade, overall, potencial, **valor**, liga, clube, nacionalidade, pé, pé fraco, dribles e PlayStyles.
- **Destaques**: wonderkids, joias baratas, veteranos pechincha, promessas por posição e atalhos "para o seu clube" (dentro do orçamento).
- **Meu save**: elenco inicial do clube, carências por setor, jogadores envelhecendo, vários saves.
- **Alvos e transferências**: lista de observação (status, preço pedido, potencial do olheiro, notas), compras/vendas que atualizam orçamento e elenco.
- **Comparar**: até 3 jogadores com radar e tabela completa.
- **Escalação**: 7 formações, melhor XI automático e rating por posição.
- **Evolução**: atualizar overalls, fechar temporada e gráfico de evolução.
- **Substitutos**: jogadores de perfil parecido, mais jovens, opcionalmente dentro do orçamento.
- **Eventos aleatórios**: lesões, cortes de orçamento, propostas, pedidos de saída… sorteados com jogadores do seu elenco.

> A EA não publica **potencial** nem **valor de mercado**: o app estima os dois (marcados com `~`)
> e você pode corrigir dentro do save com o que aparece no seu jogo.

Os dados do save ficam no `localStorage` do navegador (não há login nem servidor).

## Rodar

```bash
npm install
npm run dev      # desenvolvimento
npm test         # testes da lógica (Vitest)
npm run build    # build de produção em dist/
```

## Atualizar a base de jogadores

A base vem da página pública de ratings da EA (`ea.com/games/ea-sports-fc/ratings`).

```bash
npm run data     # baixa as páginas para data-raw/ e gera public/data/players.json
```

Depois faça commit do `public/data/players.json` atualizado. Os usuários recebem a nova base na próxima abertura do app.

## Deploy na Vercel

O `vercel.json` já configura tudo (preset Vite, `npm run build`, saída `dist`, cache do service worker).
O app usa rotas com `#`, então não precisa de rewrites.

1. Suba o projeto para um repositório no GitHub (o `public/data/players.json` precisa estar commitado).
2. Na Vercel: **Add New → Project → Import** o repositório.
3. Confira: Framework Preset **Vite**, Build Command `npm run build`, Output Directory `dist`. Não há variáveis de ambiente.
4. **Deploy**. No celular, abra a URL e use "Adicionar à tela inicial" / "Instalar app".
