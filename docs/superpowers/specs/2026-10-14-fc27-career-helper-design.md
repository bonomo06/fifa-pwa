# FC 27 Carreira — PWA de apoio ao modo carreira

Data: 2026-10-14 · Status: aprovado pelo usuário em chat ("pode dar andamento em todos os pontos 1 ao 8", com valor na busca); usuário autorizou seguir sem gates intermediários.

## Objetivo
App PWA, offline-first, para usar no celular enquanto joga o modo carreira do EA FC 27: achar jogadores (scouting) e gerenciar o próprio save (elenco, orçamento, transferências, evolução).

## Fonte de dados
- Página pública de ratings da EA (`ea.com/games/ea-sports-fc/ratings`, Next.js). Rota `/_next/data/<buildId>/games/ea-sports-fc/ratings.json?page=N` devolve 100 jogadores/página (~19,8 mil no FC 27).
- `scripts/fetch-ea.mjs` baixa as páginas para `data-raw/` (cache, retomável). `scripts/build-data.mjs` gera `public/data/players.json` compacto.
- A EA **não** publica potencial, valor de mercado, salário nem contrato. O app **estima** potencial e valor (rotulados "est.") e o usuário pode sobrescrever por save com o que vê no jogo (olheiro/valor real).
- Altura/peso vêm vazios no FC 27.

## Funcionalidades
1. **Busca** com filtros: nome, posição (principal ou alternativa), idade, overall, potencial (est./override), valor (est./override), liga, clube, nacionalidade, pé, pé fraco, skill moves, PlayStyles, gênero. Ordenação por overall/potencial/valor/idade/nome/atributo.
2. **Destaques**: presets — wonderkids, jovens baratos, pechinchas veteranas, top por posição.
3. **Meu save**: escolher clube → elenco inicial do clube; múltiplos saves; temporada atual; orçamento. Elenco por setor, médias, carências por posição, alerta de idade.
4. **Observação & transferências**: lista de alvos com status, notas, potencial do olheiro, preço pedido; registrar compras/vendas (atualiza orçamento e elenco).
5. **Comparador**: até 3 jogadores, radar (6 atributos principais) + tabela completa.
6. **Escalação**: formações comuns, auto-preencher melhor XI com rating por posição, troca manual.
7. **Evolução**: "fechar temporada" tira snapshot (overall/potencial/valor) do elenco; edição de overall; gráfico de linha por jogador.
8. **Substitutos**: jogadores parecidos (vetor de atributos ponderado pela posição), mais jovens, opcionalmente dentro do orçamento.
9. **Eventos aleatórios** (pedido adicional): catálogo ponderado (lesão, diretoria, vestiário, mercado, torcida, tática) sorteado com jogadores reais do elenco; intensidade leve/normal/caos; histórico por save com "cumprido" e aplicação opcional do efeito no orçamento.

## Arquitetura
- Vite + React + TypeScript, `react-router` (HashRouter, funciona em qualquer host estático), `zustand` com persistência em `localStorage` para saves/comparação.
- `vite-plugin-pwa`: precache do app e do `players.json`; cache em runtime (CacheFirst) das fotos da EA.
- Lógica pura e testada (Vitest) em `src/lib/`: modelo/decodificação de dados, idade, estimativas (potencial/valor), rating por posição, filtros, similaridade, escalação automática.
- UI em português, mobile-first, navegação inferior.

## Deploy
Vercel (preset Vite, `vercel.json` com cache do service worker). HashRouter dispensa rewrites. `public/data/players.json` é commitado.

## Fora de escopo
Login/sync na nuvem, dados de contrato/salário, dados em tempo real do jogo.
