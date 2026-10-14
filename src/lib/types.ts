// Mesma ordem de STAT_KEYS em scripts/build-data.mjs
export const STAT_KEYS = [
  'pac', 'sho', 'pas', 'dri', 'def', 'phy',
  'acceleration', 'sprintSpeed',
  'positioning', 'finishing', 'shotPower', 'longShots', 'volleys', 'penalties',
  'vision', 'crossing', 'freeKickAccuracy', 'shortPassing', 'longPassing', 'curve',
  'agility', 'balance', 'reactions', 'ballControl', 'dribbling', 'composure',
  'interceptions', 'headingAccuracy', 'defensiveAwareness', 'standingTackle', 'slidingTackle',
  'jumping', 'stamina', 'strength', 'aggression',
  'gkDiving', 'gkHandling', 'gkKicking', 'gkPositioning', 'gkReflexes',
] as const;

export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

export const POSITIONS = [
  'GK', 'RB', 'RWB', 'CB', 'LB', 'LWB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'CF', 'ST',
] as const;
export type Position = (typeof POSITIONS)[number];

export type PositionGroup = 'GK' | 'DEF' | 'MID' | 'ATT';

export interface Player {
  id: number;
  name: string;
  shortName: string;
  firstName: string;
  lastName: string;
  birthdate: string; // YYYY-MM-DD
  ovr: number;
  pos: Position;
  altPos: Position[];
  foot: 'L' | 'R';
  weakFoot: number;
  skillMoves: number;
  teamIdx: number;
  nationIdx: number;
  gender: 'M' | 'F';
  stats: Stats;
  playstyles: number[];
  playstylesPlus: number[];
  searchName: string; // nome normalizado (minúsculo, sem acento) para busca
}

export interface Team {
  id: number;
  name: string;
  crest: string;
  leagueIdx: number;
}

export interface Nation {
  id: number;
  name: string;
  flag: string;
}

export interface PlayStyle {
  name: string;
  desc: string;
  icon: string;
}

export interface Database {
  fetchedAt: string;
  players: Player[];
  teams: Team[];
  nations: Nation[];
  leagues: string[];
  playstyles: PlayStyle[];
  byId: Map<number, Player>;
}

/** Dados do jogador que o usuário pode corrigir dentro de um save (o que ele vê no jogo). */
export interface PlayerOverride {
  ovr?: number;
  potMin?: number;
  potMax?: number;
  value?: number;
}

/** Jogador com os números efetivos (já com idade da temporada, estimativas e correções do save). */
export interface PlayerView {
  p: Player;
  age: number;
  ovr: number;
  pot: number; // ponto médio da faixa ou estimativa
  potLabel: string; // "84-88", "86" ou "~86"
  potEstimated: boolean;
  value: number;
  valueEstimated: boolean;
}
