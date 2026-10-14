import { isFamiliar, positionRating } from './positions';
import type { PlayerView, Position } from './types';

export interface Slot {
  pos: Position;
  x: number; // 0 = esquerda, 100 = direita
  y: number; // 0 = ataque, 100 = gol próprio
}

const GK: Slot = { pos: 'GK', x: 50, y: 92 };
const back4: Slot[] = [
  { pos: 'LB', x: 14, y: 72 }, { pos: 'CB', x: 37, y: 77 }, { pos: 'CB', x: 63, y: 77 }, { pos: 'RB', x: 86, y: 72 },
];
const back3: Slot[] = [{ pos: 'CB', x: 27, y: 76 }, { pos: 'CB', x: 50, y: 78 }, { pos: 'CB', x: 73, y: 76 }];
const twoStrikers: Slot[] = [{ pos: 'ST', x: 37, y: 16 }, { pos: 'ST', x: 63, y: 16 }];

export const FORMATIONS: Record<string, Slot[]> = {
  '4-3-3': [GK, ...back4,
    { pos: 'CM', x: 27, y: 50 }, { pos: 'CDM', x: 50, y: 58 }, { pos: 'CM', x: 73, y: 50 },
    { pos: 'LW', x: 16, y: 22 }, { pos: 'ST', x: 50, y: 14 }, { pos: 'RW', x: 84, y: 22 }],
  '4-2-3-1': [GK, ...back4,
    { pos: 'CDM', x: 36, y: 58 }, { pos: 'CDM', x: 64, y: 58 },
    { pos: 'LM', x: 16, y: 34 }, { pos: 'CAM', x: 50, y: 36 }, { pos: 'RM', x: 84, y: 34 },
    { pos: 'ST', x: 50, y: 14 }],
  '4-4-2': [GK, ...back4,
    { pos: 'LM', x: 14, y: 44 }, { pos: 'CM', x: 37, y: 50 }, { pos: 'CM', x: 63, y: 50 }, { pos: 'RM', x: 86, y: 44 },
    ...twoStrikers],
  '4-1-2-1-2': [GK, ...back4,
    { pos: 'CDM', x: 50, y: 60 }, { pos: 'CM', x: 28, y: 46 }, { pos: 'CM', x: 72, y: 46 },
    { pos: 'CAM', x: 50, y: 32 }, ...twoStrikers],
  '3-5-2': [GK, ...back3,
    { pos: 'LM', x: 12, y: 44 }, { pos: 'CDM', x: 37, y: 56 }, { pos: 'CDM', x: 63, y: 56 }, { pos: 'RM', x: 88, y: 44 },
    { pos: 'CAM', x: 50, y: 34 }, ...twoStrikers],
  '3-4-3': [GK, ...back3,
    { pos: 'LM', x: 12, y: 46 }, { pos: 'CM', x: 37, y: 52 }, { pos: 'CM', x: 63, y: 52 }, { pos: 'RM', x: 88, y: 46 },
    { pos: 'LW', x: 20, y: 20 }, { pos: 'ST', x: 50, y: 14 }, { pos: 'RW', x: 80, y: 20 }],
  '5-3-2': [GK,
    { pos: 'LWB', x: 10, y: 62 }, { pos: 'CB', x: 30, y: 76 }, { pos: 'CB', x: 50, y: 78 }, { pos: 'CB', x: 70, y: 76 }, { pos: 'RWB', x: 90, y: 62 },
    { pos: 'CM', x: 28, y: 46 }, { pos: 'CM', x: 50, y: 50 }, { pos: 'CM', x: 72, y: 46 },
    ...twoStrikers],
};

export function slotRating(v: PlayerView, pos: Position): number {
  return positionRating(v.p, pos, v.ovr);
}

/**
 * Melhor XI: começa guloso (sempre o maior par jogador/vaga livre) e depois melhora com
 * trocas entre vagas e com o banco até não haver ganho — o guloso sozinho erra casos como
 * "craque da posição A rende igual na B e rouba a vaga de quem só joga na B".
 */
export function autoFill(views: PlayerView[], slots: Slot[]): (number | null)[] {
  const byId = new Map(views.map((v) => [v.p.id, v]));
  // leve preferência por quem já joga na posição
  const score = (id: number | null, slot: number) => {
    const v = id != null ? byId.get(id) : undefined;
    return v ? slotRating(v, slots[slot].pos) + (isFamiliar(v.p, slots[slot].pos) ? 0.5 : 0) : 0;
  };

  const pairs: { slot: number; id: number; r: number }[] = [];
  slots.forEach((_, slot) => views.forEach((v) => pairs.push({ slot, id: v.p.id, r: score(v.p.id, slot) })));
  pairs.sort((a, b) => b.r - a.r);
  const result: (number | null)[] = slots.map(() => null);
  const used = new Set<number>();
  for (const { slot, id } of pairs) {
    if (result[slot] != null || used.has(id)) continue;
    result[slot] = id;
    used.add(id);
  }

  for (let improved = true, rounds = 0; improved && rounds < 20; rounds++) {
    improved = false;
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const a = result[i];
        const b = result[j];
        if (score(b, i) + score(a, j) > score(a, i) + score(b, j) + 1e-9) {
          result[i] = b;
          result[j] = a;
          improved = true;
        }
      }
      for (const v of views) {
        if (used.has(v.p.id)) continue;
        if (score(v.p.id, i) > score(result[i], i) + 1e-9) {
          if (result[i] != null) used.delete(result[i]!);
          result[i] = v.p.id;
          used.add(v.p.id);
          improved = true;
        }
      }
    }
  }
  return result;
}

export function lineupRating(ids: (number | null)[], slots: Slot[], byId: Map<number, PlayerView>): number {
  const ratings = ids.map((id, i) => {
    const v = id != null ? byId.get(id) : undefined;
    return v ? slotRating(v, slots[i].pos) : 0;
  });
  return ratings.length ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;
}
