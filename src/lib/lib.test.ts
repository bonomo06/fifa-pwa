import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { decodeDatabase } from './data';
import { DEFAULT_FILTER, applyFilter } from './filters';
import { FORMATIONS, autoFill } from './lineup';
import { positionRating } from './positions';
import { findSimilar } from './similar';
import { analyzeNeeds, summarize } from './squad';
import type { Database, PlayerView } from './types';
import { makeView, makeViews } from './views';

let db: Database;
let views: PlayerView[];
const find = (q: string) => views.find((v) => v.p.searchName.includes(q))!;

beforeAll(() => {
  db = decodeDatabase(JSON.parse(readFileSync('public/data/players.json', 'utf8')));
  views = makeViews(db.players, { season: 2026 });
});

describe('base', () => {
  it('decodifica jogadores com acento e estatísticas', () => {
    const m = find('mbappe');
    expect(m.p.lastName).toBe('Mbappé');
    expect(m.p.pos).toBe('ST');
    expect(m.p.stats.finishing).toBeGreaterThan(80);
    expect(db.teams[m.p.teamIdx].name).toBeTruthy();
  });
});

describe('rating por posição', () => {
  it('posição principal = overall oficial', () => {
    for (const v of views.slice(0, 200)) expect(positionRating(v.p, v.p.pos)).toBe(v.p.ovr);
  });
  it('zagueiro rende mais na zaga que no ataque; jogador de linha é péssimo no gol', () => {
    const cb = views.find((v) => v.p.pos === 'CB')!;
    expect(positionRating(cb.p, 'CB')).toBeGreaterThan(positionRating(cb.p, 'ST'));
    expect(positionRating(cb.p, 'GK')).toBeLessThan(45);
  });
});

describe('filtros', () => {
  it('busca sem acento e por posição alternativa', () => {
    const r = applyFilter(views, { ...DEFAULT_FILTER, q: 'mbappe' }, db);
    expect(r[0].p.lastName).toBe('Mbappé');
    const lw = applyFilter(views, { ...DEFAULT_FILTER, q: 'mbappe', positions: ['LW'], includeAlt: true }, db);
    expect(lw).toHaveLength(1);
    const lwOnly = applyFilter(views, { ...DEFAULT_FILTER, q: 'mbappe', positions: ['LW'], includeAlt: false }, db);
    expect(lwOnly).toHaveLength(0);
  });
  it('faixa de valor e idade, ordenado por valor', () => {
    const r = applyFilter(views, { ...DEFAULT_FILTER, ageMax: 21, valueMax: 10e6, sort: 'pot', sortDir: 'desc' }, db);
    expect(r.length).toBeGreaterThan(10);
    expect(r.every((v) => v.age <= 21 && v.value <= 10e6 && v.p.gender === 'M')).toBe(true);
    expect(r[0].pot).toBeGreaterThanOrEqual(r[r.length - 1].pot);
  });
});

describe('correções do save', () => {
  it('potencial do olheiro e valor real substituem estimativas', () => {
    const p = find('mbappe').p;
    const v = makeView(p, { season: 2027, overrides: { [p.id]: { potMin: 90, potMax: 93, value: 150e6, ovr: 92 } } });
    expect(v.potLabel).toBe('90-93');
    expect(v.potEstimated).toBe(false);
    expect(v.value).toBe(150e6);
    expect(v.ovr).toBe(92);
    expect(v.age).toBe(find('mbappe').age + 1);
  });
});

describe('substitutos', () => {
  it('só mais jovens, mesma posição, sem o próprio', () => {
    const target = views.filter((v) => v.p.pos === 'CB' && v.age >= 32 && v.ovr >= 80)[0];
    const r = findSimilar(target, views, { maxAge: 24, limit: 10 });
    expect(r.length).toBeGreaterThan(0);
    for (const { v } of r) {
      expect(v.p.id).not.toBe(target.p.id);
      expect(v.age).toBeLessThanOrEqual(24);
      expect([v.p.pos, ...v.p.altPos]).toContain('CB');
    }
  });
});

describe('elenco e escalação', () => {
  it('melhor XI do Real Madrid tem 11 jogadores distintos e um goleiro no gol', () => {
    const team = db.teams.findIndex((t) => t.name === 'Real Madrid');
    const squad = views.filter((v) => v.p.teamIdx === team);
    const ids = autoFill(squad, FORMATIONS['4-3-3']);
    expect(new Set(ids).size).toBe(11);
    expect(squad.find((v) => v.p.id === ids[0])!.p.pos).toBe('GK');
    // centroavante de origem no centro do ataque (o guloso puro colocava Mbappé na ponta)
    const stSlot = FORMATIONS['4-3-3'].findIndex((s) => s.pos === 'ST');
    expect(squad.find((v) => v.p.id === ids[stSlot])!.p.lastName).toBe('Mbappé');
    expect(summarize(squad).bestXiRating).toBeGreaterThan(80);
  });
  it('sem goleiros, aponta carência no gol', () => {
    const team = db.teams.findIndex((t) => t.name === 'Real Madrid');
    const squad = views.filter((v) => v.p.teamIdx === team && v.p.pos !== 'GK');
    expect(analyzeNeeds(squad).find((n) => n.key === 'gk')!.short).toBe(true);
  });
});
