import type { Position } from './types';

// A EA não publica potencial nem valor de mercado. Estas estimativas imitam o comportamento
// do modo carreira (crescimento por idade; valor exponencial no overall, descontado pela idade)
// e servem de ponto de partida: o usuário corrige com o que o olheiro/jogo mostra.

const GROWTH_BY_AGE: Record<number, number> = {
  15: 21, 16: 20, 17: 18, 18: 15, 19: 13, 20: 11, 21: 8, 22: 6, 23: 4, 24: 3, 25: 2, 26: 1,
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function estimatePotential(ovr: number, age: number): number {
  const growth = age < 15 ? 22 : (GROWTH_BY_AGE[age] ?? 0);
  // Quanto mais alto o overall, menos espaço para crescer.
  const room = clamp((94 - ovr) / 26, 0.25, 1.15);
  return clamp(Math.round(ovr + growth * room), ovr, Math.max(ovr, 95));
}

// Valor de referência (jogador de 25-27 anos, meio-campista) por overall.
const VALUE_CURVE: [number, number][] = [
  [40, 15e3], [45, 40e3], [50, 100e3], [55, 250e3], [60, 600e3], [65, 1.4e6], [70, 3.2e6],
  [75, 8.5e6], [80, 24e6], [83, 42e6], [85, 60e6], [88, 95e6], [90, 125e6], [92, 160e6], [95, 220e6],
];

function baseValue(rating: number): number {
  if (rating <= VALUE_CURVE[0][0]) return VALUE_CURVE[0][1];
  for (let i = 1; i < VALUE_CURVE.length; i++) {
    const [r1, v1] = VALUE_CURVE[i];
    if (rating <= r1) {
      const [r0, v0] = VALUE_CURVE[i - 1];
      const t = (rating - r0) / (r1 - r0);
      return Math.exp(Math.log(v0) + t * (Math.log(v1) - Math.log(v0)));
    }
  }
  return VALUE_CURVE[VALUE_CURVE.length - 1][1];
}

function ageMultiplier(age: number): number {
  if (age <= 27) return 1;
  const table: Record<number, number> = { 28: 0.9, 29: 0.8, 30: 0.65, 31: 0.5, 32: 0.4, 33: 0.3, 34: 0.22 };
  return table[age] ?? 0.15;
}

const POSITION_MULTIPLIER: Record<Position, number> = {
  GK: 0.6, CB: 0.85, RB: 0.85, LB: 0.85, RWB: 0.85, LWB: 0.85,
  CDM: 0.9, CM: 0.95, RM: 1, LM: 1, CAM: 1.05, RW: 1.05, LW: 1.05, CF: 1.05, ST: 1.1,
};

function roundNice(v: number): number {
  const step = v < 1e6 ? 25e3 : v < 10e6 ? 100e3 : 500e3;
  return Math.max(step, Math.round(v / step) * step);
}

export function estimateValue(ovr: number, pot: number, age: number, pos: Position): number {
  // Jovens são precificados entre o overall atual e o potencial.
  const youth = age <= 23 ? clamp((24 - age) / 6, 0, 1) * 0.45 : 0;
  const effective = ovr + Math.max(0, pot - ovr) * youth;
  return roundNice(baseValue(effective) * ageMultiplier(age) * (POSITION_MULTIPLIER[pos] ?? 1));
}

export function formatMoney(v: number): string {
  if (!v) return '€0';
  if (v < 0) return `−${formatMoney(-v)}`;
  const fmt = (n: number) => (Math.round(n * 10) / 10).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  if (Math.abs(v) >= 1e6) return `€${fmt(v / 1e6)} mi`;
  if (Math.abs(v) >= 1e3) return `€${Math.round(v / 1e3)} mil`;
  return `€${Math.round(v)}`;
}

/** Aceita "1.5m", "1,5 mi", "850k", "850 mil", "2000000", "2.000.000", "1.190,7 mi". */
export function parseMoney(text: string): number | null {
  const m = text.trim().toLowerCase().replace(/[€\s]/g, '').match(/^(\d[\d.,]*)(mi|m|mil|k)?$/);
  if (!m) return null;
  let num = m[1];
  if (num.includes('.') && num.includes(',')) num = num.replace(/\./g, '').replace(',', '.');
  else if (num.includes(',')) num = num.replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(num)) num = num.replace(/\./g, '');
  const n = Number(num);
  if (!Number.isFinite(n)) return null;
  const mult = m[2] === 'm' || m[2] === 'mi' ? 1e6 : m[2] === 'k' || m[2] === 'mil' ? 1e3 : 1;
  return Math.round(n * mult);
}
