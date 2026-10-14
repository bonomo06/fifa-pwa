import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { decodeDatabase } from './data';
import { EVENT_COUNT, rollEvent, type EventContext } from './events';
import type { PlayerView } from './types';
import { makeViews } from './views';

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
}

let ctx: EventContext;

beforeAll(() => {
  const db = decodeDatabase(JSON.parse(readFileSync('public/data/players.json', 'utf8')));
  const views = makeViews(db.players, { season: 2026 });
  const team = db.teams.findIndex((t) => t.name === 'Real Madrid');
  const squad = views.filter((v) => v.p.teamIdx === team);
  ctx = { squad, market: views.filter((v) => v.p.teamIdx !== team && v.p.gender === 'M'), budget: 80e6, teamLevel: 85 };
});

describe('eventos aleatórios', () => {
  it('sempre devolve um evento com texto, e jogadores citados existem', () => {
    const rng = seeded(42);
    const ids = new Set([...ctx.squad, ...ctx.market].map((v) => v.p.id));
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) {
      const e = rollEvent(ctx, rng);
      expect(e.title).toBeTruthy();
      expect(e.text).toBeTruthy();
      e.playerIds.forEach((id) => expect(ids.has(id)).toBe(true));
      seen.add(e.defId);
    }
    // com 400 sorteios, quase todo o catálogo aparece
    expect(seen.size).toBeGreaterThan(EVENT_COUNT - 4);
  });

  it('eventos de orçamento trazem o delta', () => {
    const rng = seeded(7);
    for (let i = 0; i < 300; i++) {
      const e = rollEvent(ctx, rng, { categories: ['diretoria'] });
      expect(e.category).toBe('diretoria');
      if (e.defId === 'corte-orcamento') expect(e.budgetDelta!).toBeLessThan(0);
      if (e.defId === 'novo-investidor') expect(e.budgetDelta!).toBeGreaterThan(0);
    }
  });

  it('elenco vazio não quebra (cai em eventos sem jogador)', () => {
    const empty: EventContext = { squad: [] as PlayerView[], market: [], budget: 0, teamLevel: 70 };
    const rng = seeded(1);
    for (let i = 0; i < 100; i++) expect(rollEvent(empty, rng).playerIds).toEqual([]);
  });

  it('modo caos sorteia mais eventos ruins que o leve', () => {
    const count = (mode: 'leve' | 'caos') => {
      const rng = seeded(99);
      let bad = 0;
      for (let i = 0; i < 1000; i++) if (rollEvent(ctx, rng, { mode }).severity === 'ruim') bad++;
      return bad;
    };
    expect(count('caos')).toBeGreaterThan(count('leve'));
  });
});
