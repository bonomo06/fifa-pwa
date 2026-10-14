import { FORMATIONS, autoFill, lineupRating } from './lineup';
import { positionRating } from './positions';
import type { Position, PlayerView } from './types';

export interface SquadSummary {
  size: number;
  avgAge: number;
  avgOvr: number;
  bestXiRating: number;
  totalValue: number;
}

export function summarize(views: PlayerView[]): SquadSummary {
  const n = views.length || 1;
  const byId = new Map(views.map((v) => [v.p.id, v]));
  const slots = FORMATIONS['4-3-3'];
  return {
    size: views.length,
    avgAge: Math.round((views.reduce((s, v) => s + v.age, 0) / n) * 10) / 10,
    avgOvr: Math.round((views.reduce((s, v) => s + v.ovr, 0) / n) * 10) / 10,
    bestXiRating: views.length ? lineupRating(autoFill(views, slots), slots, byId) : 0,
    totalValue: views.reduce((s, v) => s + v.value, 0),
  };
}

interface Need {
  key: string;
  label: string;
  positions: Position[];
  want: number;
}

const NEEDS: Need[] = [
  { key: 'gk', label: 'Goleiro', positions: ['GK'], want: 2 },
  { key: 'cb', label: 'Zagueiro', positions: ['CB'], want: 4 },
  { key: 'lb', label: 'Lateral esquerdo', positions: ['LB', 'LWB'], want: 2 },
  { key: 'rb', label: 'Lateral direito', positions: ['RB', 'RWB'], want: 2 },
  { key: 'dm', label: 'Volante / meio-campo', positions: ['CDM', 'CM'], want: 4 },
  { key: 'am', label: 'Meia ofensivo', positions: ['CAM'], want: 2 },
  { key: 'lw', label: 'Ponta / meia esquerda', positions: ['LW', 'LM'], want: 2 },
  { key: 'rw', label: 'Ponta / meia direita', positions: ['RW', 'RM'], want: 2 },
  { key: 'st', label: 'Atacante', positions: ['ST', 'CF'], want: 3 },
];

export interface NeedReport {
  key: string;
  label: string;
  positions: Position[];
  have: number;
  want: number;
  best: number;
  short: boolean; // faltam opções no nível do time
  weak: boolean; // titular abaixo do nível do time
}

/**
 * Carências por setor: conta quem joga ali com rating ≥ (nível do time − 6),
 * e marca setores cujo melhor jogador está bem abaixo do nível do XI.
 */
export function analyzeNeeds(views: PlayerView[]): NeedReport[] {
  const level = summarize(views).bestXiRating;
  return NEEDS.map((n) => {
    const ratings = views
      .map((v) => Math.max(...n.positions.map((pos) => positionRating(v.p, pos, v.ovr))))
      .sort((a, b) => b - a);
    const have = ratings.filter((r) => r >= level - 6).length;
    const best = ratings[0] ?? 0;
    return { ...n, have, best, short: have < n.want, weak: best < level - 3 };
  });
}

/** Jogadores que vão perder rendimento/valor em breve. */
export function agingPlayers(views: PlayerView[], minAge = 31): PlayerView[] {
  return views.filter((v) => v.age >= minAge).sort((a, b) => b.age - a.age);
}
