import type { Player, Position, PositionGroup, StatKey } from './types';

type Weights = Partial<Record<StatKey, number>>;

// Pesos aproximados da fórmula de overall da EA (somam 100 por posição).
const ST: Weights = { acceleration: 4, sprintSpeed: 5, finishing: 18, positioning: 13, shotPower: 10, longShots: 3, volleys: 2, headingAccuracy: 10, dribbling: 7, ballControl: 10, reactions: 8, strength: 5, shortPassing: 5 };
const WING: Weights = { acceleration: 7, sprintSpeed: 6, agility: 3, crossing: 9, finishing: 10, longShots: 4, shortPassing: 9, dribbling: 16, ballControl: 14, reactions: 7, vision: 6, positioning: 9 };
const WIDE_MID: Weights = { acceleration: 7, sprintSpeed: 6, stamina: 5, crossing: 10, shortPassing: 11, longPassing: 5, dribbling: 15, ballControl: 13, reactions: 7, vision: 7, positioning: 8, finishing: 6 };
const CAM: Weights = { acceleration: 4, agility: 3, shortPassing: 16, longShots: 5, finishing: 7, shotPower: 3, dribbling: 13, ballControl: 15, reactions: 7, vision: 14, positioning: 9, longPassing: 4 };
const CF: Weights = { acceleration: 4, sprintSpeed: 4, finishing: 12, positioning: 12, shotPower: 6, longShots: 4, headingAccuracy: 2, dribbling: 12, ballControl: 14, reactions: 9, shortPassing: 10, vision: 8, agility: 3 };
const CM: Weights = { shortPassing: 17, longPassing: 12, vision: 12, ballControl: 14, dribbling: 7, reactions: 8, stamina: 6, longShots: 4, interceptions: 5, defensiveAwareness: 5, standingTackle: 5, positioning: 5 };
const CDM: Weights = { shortPassing: 14, longPassing: 10, interceptions: 14, defensiveAwareness: 14, standingTackle: 12, slidingTackle: 5, ballControl: 10, reactions: 7, stamina: 6, strength: 4, aggression: 4 };
const FULLBACK: Weights = { acceleration: 5, sprintSpeed: 7, stamina: 8, crossing: 9, shortPassing: 7, ballControl: 7, interceptions: 12, defensiveAwareness: 8, headingAccuracy: 4, standingTackle: 11, slidingTackle: 14, reactions: 8 };
const WINGBACK: Weights = { acceleration: 4, sprintSpeed: 6, stamina: 10, crossing: 12, shortPassing: 10, dribbling: 4, ballControl: 8, interceptions: 12, defensiveAwareness: 7, standingTackle: 8, slidingTackle: 11, reactions: 8 };
const CB: Weights = { headingAccuracy: 10, defensiveAwareness: 14, interceptions: 13, standingTackle: 17, slidingTackle: 14, strength: 10, aggression: 7, shortPassing: 5, ballControl: 4, jumping: 2, reactions: 4 };
const GK: Weights = { gkDiving: 21, gkHandling: 21, gkKicking: 5, gkPositioning: 21, gkReflexes: 21, reactions: 11 };

export const POSITION_WEIGHTS: Record<Position, Weights> = {
  GK, CB, RB: FULLBACK, LB: FULLBACK, RWB: WINGBACK, LWB: WINGBACK,
  CDM, CM, CAM, RM: WIDE_MID, LM: WIDE_MID, RW: WING, LW: WING, CF, ST,
};

// Viés medido contra os overalls oficiais do FC 27 (erro médio < 1 ponto após o ajuste).
const POSITION_BIAS: Partial<Record<Position, number>> = {
  RB: 2, LB: 2, RWB: 2, LWB: 2, CDM: 0.9, RM: 1, LM: 1, GK: 1, CM: 0.4, CAM: 0.2,
};

export const POSITION_LABEL: Record<Position, string> = {
  GK: 'GOL', RB: 'LD', RWB: 'ALD', CB: 'ZAG', LB: 'LE', LWB: 'ALE', CDM: 'VOL', CM: 'MC', CAM: 'MEI',
  RM: 'MD', LM: 'ME', RW: 'PD', LW: 'PE', CF: 'SA', ST: 'ATA',
};

export const POSITION_GROUP: Record<Position, PositionGroup> = {
  GK: 'GK', RB: 'DEF', RWB: 'DEF', CB: 'DEF', LB: 'DEF', LWB: 'DEF',
  CDM: 'MID', CM: 'MID', CAM: 'MID', RM: 'MID', LM: 'MID',
  RW: 'ATT', LW: 'ATT', CF: 'ATT', ST: 'ATT',
};

export const GROUP_LABEL: Record<PositionGroup, string> = {
  GK: 'Goleiros', DEF: 'Defensores', MID: 'Meio-campistas', ATT: 'Atacantes',
};

function weighted(p: Player, pos: Position): number {
  const w = POSITION_WEIGHTS[pos];
  let sum = 0;
  let total = 0;
  for (const [k, v] of Object.entries(w) as [StatKey, number][]) {
    sum += p.stats[k] * v;
    total += v;
  }
  return sum / total + (POSITION_BIAS[pos] ?? 0);
}

export function isFamiliar(p: Player, pos: Position): boolean {
  return p.pos === pos || p.altPos.includes(pos);
}

/** Rating do jogador numa posição, ancorado no overall oficial da posição principal. */
export function positionRating(p: Player, pos: Position, ovr = p.ovr): number {
  if (pos === p.pos) return ovr;
  const offset = ovr - weighted(p, p.pos);
  const unfamiliar = isFamiliar(p, pos) ? 0 : 2;
  return Math.max(1, Math.min(99, Math.round(weighted(p, pos) + offset) - unfamiliar));
}

export function bestPositions(p: Player, ovr = p.ovr, limit = 4): { pos: Position; rating: number }[] {
  return (Object.keys(POSITION_WEIGHTS) as Position[])
    .map((pos) => ({ pos, rating: positionRating(p, pos, ovr) }))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}
