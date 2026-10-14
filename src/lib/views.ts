import { BASE_SEASON, ageAt, seasonDate } from './age';
import { estimatePotential, estimateValue } from './estimates';
import type { Player, PlayerOverride, PlayerView } from './types';

export interface ViewContext {
  season: number;
  overrides?: Record<number, PlayerOverride>;
}

export function makeView(p: Player, ctx: ViewContext): PlayerView {
  const o = ctx.overrides?.[p.id];
  const age = ageAt(p.birthdate, seasonDate(ctx.season));
  const ovr = o?.ovr ?? p.ovr;

  let pot: number;
  let potLabel: string;
  let potEstimated = false;
  if (o?.potMin != null || o?.potMax != null) {
    const min = o.potMin ?? o.potMax!;
    const max = o.potMax ?? o.potMin!;
    pot = Math.round((min + max) / 2);
    potLabel = min === max ? String(min) : `${min}-${max}`;
  } else {
    // Estimativa sempre a partir da foto inicial (temporada base), para não "crescer" a cada ano.
    const baseAge = ageAt(p.birthdate, seasonDate(BASE_SEASON));
    pot = Math.max(ovr, estimatePotential(p.ovr, baseAge));
    potLabel = `~${pot}`;
    potEstimated = true;
  }

  const valueEstimated = o?.value == null;
  const value = o?.value ?? estimateValue(ovr, pot, age, p.pos);

  return { p, age, ovr, pot, potLabel, potEstimated, value, valueEstimated };
}

export function makeViews(players: Player[], ctx: ViewContext): PlayerView[] {
  return players.map((p) => makeView(p, ctx));
}
