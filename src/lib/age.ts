/** Temporada inicial do FC 27 (2026/27). As idades da base são calculadas em 1º de julho dela. */
export const BASE_SEASON = 2026;

export function seasonDate(season: number): string {
  return `${season}-07-01`;
}

export function seasonLabel(season: number): string {
  return `${String(season).slice(2)}/${String(season + 1).slice(2)}`;
}

export function ageAt(birthdate: string, refDate: string): number {
  if (!birthdate) return 0;
  const [by, bm, bd] = birthdate.split('-').map(Number);
  const [ry, rm, rd] = refDate.split('-').map(Number);
  let age = ry - by;
  if (rm < bm || (rm === bm && rd < bd)) age--;
  return age;
}
