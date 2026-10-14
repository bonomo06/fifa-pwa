import { describe, expect, it } from 'vitest';
import { ageAt, seasonDate, seasonLabel } from './age';
import { estimatePotential, estimateValue, formatMoney, parseMoney } from './estimates';

describe('idade', () => {
  it('calcula idade na data de referência', () => {
    expect(ageAt('1998-12-20', '2026-07-01')).toBe(27);
    expect(ageAt('2007-07-01', '2026-07-01')).toBe(19);
    expect(ageAt('2007-07-02', '2026-07-01')).toBe(18);
  });
  it('temporada vira data e rótulo', () => {
    expect(seasonDate(2026)).toBe('2026-07-01');
    expect(seasonLabel(2026)).toBe('26/27');
  });
});

describe('potencial estimado', () => {
  it('nunca é menor que o overall', () => {
    expect(estimatePotential(80, 31)).toBe(80);
    expect(estimatePotential(91, 18)).toBeGreaterThanOrEqual(91);
  });
  it('jovem com overall baixo cresce mais', () => {
    expect(estimatePotential(65, 17)).toBeGreaterThan(estimatePotential(65, 22));
    expect(estimatePotential(65, 17) - 65).toBeGreaterThan(estimatePotential(85, 17) - 85);
  });
  it('limita em 95', () => {
    expect(estimatePotential(90, 16)).toBeLessThanOrEqual(95);
  });
});

describe('valor estimado', () => {
  it('cresce com o overall', () => {
    expect(estimateValue(80, 80, 26, 'CM')).toBeGreaterThan(estimateValue(75, 75, 26, 'CM'));
  });
  it('cai com a idade', () => {
    expect(estimateValue(82, 82, 33, 'CM')).toBeLessThan(estimateValue(82, 82, 27, 'CM'));
  });
  it('jovem com potencial alto vale mais que um da mesma idade sem potencial', () => {
    expect(estimateValue(72, 88, 19, 'ST')).toBeGreaterThan(estimateValue(72, 74, 19, 'ST'));
  });
  it('atacante vale mais que goleiro de mesmo nível', () => {
    expect(estimateValue(84, 84, 27, 'ST')).toBeGreaterThan(estimateValue(84, 84, 27, 'GK'));
  });
  it('faixas plausíveis', () => {
    const top = estimateValue(91, 92, 27, 'ST');
    expect(top).toBeGreaterThan(90e6);
    expect(top).toBeLessThan(250e6);
    const low = estimateValue(60, 62, 28, 'CB');
    expect(low).toBeGreaterThan(200e3);
    expect(low).toBeLessThan(2e6);
  });
});

describe('dinheiro', () => {
  it('formata', () => {
    expect(formatMoney(1_250_000)).toBe('€1,3 mi');
    expect(formatMoney(850_000)).toBe('€850 mil');
    expect(formatMoney(120_000_000)).toBe('€120 mi');
    expect(formatMoney(0)).toBe('€0');
    expect(formatMoney(-75_500_000)).toBe('−€75,5 mi');
    expect(formatMoney(1_190_700_000)).toBe('€1.190,7 mi');
  });
  it('interpreta texto digitado', () => {
    expect(parseMoney('1.5m')).toBe(1_500_000);
    expect(parseMoney('1,5 mi')).toBe(1_500_000);
    expect(parseMoney('850k')).toBe(850_000);
    expect(parseMoney('850 mil')).toBe(850_000);
    expect(parseMoney('2000000')).toBe(2_000_000);
    expect(parseMoney('2.000.000')).toBe(2_000_000);
    expect(parseMoney('1.190,7 mi')).toBe(1_190_700_000);
    expect(parseMoney('abc')).toBeNull();
  });
});
