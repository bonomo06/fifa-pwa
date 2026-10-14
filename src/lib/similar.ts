import { POSITION_WEIGHTS, isFamiliar } from './positions';
import type { PlayerView, StatKey } from './types';

export interface SimilarOptions {
  maxAge?: number;
  maxValue?: number;
  excludeIds?: Set<number>;
  limit?: number;
}

export interface SimilarResult {
  v: PlayerView;
  similarity: number; // 0-100
}

/**
 * Jogadores com perfil de atributos parecido (ponderado pelo que importa na posição do alvo),
 * que jogam na mesma posição e podem chegar ao nível dele (potencial perto do overall do alvo).
 */
export function findSimilar(target: PlayerView, views: PlayerView[], opts: SimilarOptions = {}): SimilarResult[] {
  const pos = target.p.pos;
  const weights = Object.entries(POSITION_WEIGHTS[pos]) as [StatKey, number][];
  const totalW = weights.reduce((s, [, w]) => s + w, 0);
  const shape = (v: PlayerView) => {
    const mean = weights.reduce((s, [k, w]) => s + v.p.stats[k] * w, 0) / totalW;
    return weights.map(([k]) => v.p.stats[k] - mean);
  };
  const t = shape(target);

  const results: SimilarResult[] = [];
  for (const v of views) {
    if (v.p.id === target.p.id || v.p.gender !== target.p.gender) continue;
    if (opts.excludeIds?.has(v.p.id)) continue;
    if (!isFamiliar(v.p, pos)) continue;
    if (opts.maxAge != null && v.age > opts.maxAge) continue;
    if (opts.maxValue != null && v.value > opts.maxValue) continue;
    if (v.pot < target.ovr - 4) continue;

    const c = shape(v);
    let d = 0;
    weights.forEach(([, w], i) => (d += w * (t[i] - c[i]) ** 2));
    const shapeDist = Math.sqrt(d / totalW);
    const levelGap = Math.abs(v.pot - target.ovr);
    const score = shapeDist + 0.6 * levelGap;
    results.push({ v, similarity: Math.max(0, Math.round(100 - score * 4)) });
  }
  return results.sort((a, b) => b.similarity - a.similarity || b.v.pot - a.v.pot).slice(0, opts.limit ?? 30);
}
