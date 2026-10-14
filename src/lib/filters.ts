import { normalize } from './data';
import type { Database, Position, PlayerView, StatKey } from './types';

export type SortKey = 'ovr' | 'pot' | 'growth' | 'value' | 'age' | 'name' | StatKey;

export interface PlayerFilter {
  q?: string;
  positions?: Position[];
  includeAlt?: boolean;
  ageMin?: number;
  ageMax?: number;
  ovrMin?: number;
  ovrMax?: number;
  potMin?: number;
  potMax?: number;
  valueMin?: number;
  valueMax?: number;
  leagueIdx?: number;
  teamIdx?: number;
  excludeTeamIdx?: number;
  nationIdx?: number;
  foot?: 'L' | 'R';
  weakFootMin?: number;
  skillMovesMin?: number;
  playstyles?: number[];
  gender?: 'M' | 'F';
  sort: SortKey;
  sortDir: 'asc' | 'desc';
}

export const DEFAULT_FILTER: PlayerFilter = { gender: 'M', includeAlt: true, sort: 'ovr', sortDir: 'desc' };

const inRange = (v: number, min?: number, max?: number) => (min == null || v >= min) && (max == null || v <= max);

export function matches(v: PlayerView, f: PlayerFilter, db: Pick<Database, 'teams'>): boolean {
  const p = v.p;
  if (f.gender && p.gender !== f.gender) return false;
  if (!inRange(v.age, f.ageMin, f.ageMax)) return false;
  if (!inRange(v.ovr, f.ovrMin, f.ovrMax)) return false;
  if (!inRange(v.pot, f.potMin, f.potMax)) return false;
  if (!inRange(v.value, f.valueMin, f.valueMax)) return false;
  if (f.positions?.length) {
    const ok = f.positions.includes(p.pos) || (f.includeAlt && p.altPos.some((a) => f.positions!.includes(a)));
    if (!ok) return false;
  }
  if (f.teamIdx != null && p.teamIdx !== f.teamIdx) return false;
  if (f.excludeTeamIdx != null && p.teamIdx === f.excludeTeamIdx) return false;
  if (f.leagueIdx != null && db.teams[p.teamIdx]?.leagueIdx !== f.leagueIdx) return false;
  if (f.nationIdx != null && p.nationIdx !== f.nationIdx) return false;
  if (f.foot && p.foot !== f.foot) return false;
  if (f.weakFootMin && p.weakFoot < f.weakFootMin) return false;
  if (f.skillMovesMin && p.skillMoves < f.skillMovesMin) return false;
  if (f.playstyles?.length && !f.playstyles.every((s) => p.playstyles.includes(s) || p.playstylesPlus.includes(s))) return false;
  if (f.q) {
    const terms = normalize(f.q).split(/\s+/).filter(Boolean);
    if (!terms.every((t) => p.searchName.includes(t))) return false;
  }
  return true;
}

export function sortValue(v: PlayerView, key: SortKey): number | string {
  switch (key) {
    case 'ovr': return v.ovr;
    case 'pot': return v.pot;
    case 'growth': return v.pot - v.ovr;
    case 'value': return v.value;
    case 'age': return v.age;
    case 'name': return v.p.searchName;
    default: return v.p.stats[key];
  }
}

export function sortViews(list: PlayerView[], key: SortKey, dir: 'asc' | 'desc'): PlayerView[] {
  const sign = dir === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    const x = sortValue(a, key);
    const y = sortValue(b, key);
    const c = typeof x === 'string' ? x.localeCompare(y as string) : x - (y as number);
    // desempate: overall maior primeiro
    return c !== 0 ? c * sign : b.ovr - a.ovr;
  });
}

export function applyFilter(views: PlayerView[], f: PlayerFilter, db: Pick<Database, 'teams'>): PlayerView[] {
  return sortViews(views.filter((v) => matches(v, f, db)), f.sort, f.sortDir);
}

/** Quantos filtros (além de gênero/ordenação) estão ativos — para o badge da UI. */
export function activeFilterCount(f: PlayerFilter): number {
  const keys: (keyof PlayerFilter)[] = [
    'positions', 'ageMin', 'ageMax', 'ovrMin', 'ovrMax', 'potMin', 'potMax', 'valueMin', 'valueMax',
    'leagueIdx', 'teamIdx', 'nationIdx', 'foot', 'weakFootMin', 'skillMovesMin', 'playstyles',
  ];
  return keys.filter((k) => {
    const v = f[k];
    return Array.isArray(v) ? v.length > 0 : v != null && v !== '' && v !== 0;
  }).length;
}
