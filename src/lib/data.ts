import { STAT_KEYS, type Database, type Player, type Position, type Stats } from './types';

type RawPlayer = [
  id: number,
  firstName: string,
  lastName: string,
  commonName: string,
  birthdate: string,
  ovr: number,
  pos: string,
  alt: string,
  foot: 'L' | 'R',
  weakFoot: number,
  skillMoves: number,
  teamIdx: number,
  nationIdx: number,
  gender: 'M' | 'F',
  stats: number[],
  playstyles: number[],
  playstylesPlus: number[],
];

export interface RawDatabase {
  version: number;
  fetchedAt: string;
  statKeys: string[];
  leagues: string[];
  teams: [number, string, string, number][];
  nations: [number, string, string][];
  playstyles: [string, string, string][];
  players: RawPlayer[];
}

export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function avatarUrl(id: number): string {
  return `https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p${id}.png?padding=0.7`;
}

export function decodeDatabase(raw: RawDatabase): Database {
  const keyIndex = raw.statKeys.map((k) => STAT_KEYS.indexOf(k as never));
  const players: Player[] = raw.players.map((r) => {
    const [id, firstName, lastName, commonName, birthdate, ovr, pos, alt, foot, weakFoot, skillMoves, teamIdx, nationIdx, gender, rawStats, playstyles, playstylesPlus] = r;
    const stats = {} as Stats;
    for (const k of STAT_KEYS) stats[k] = 0;
    rawStats.forEach((v, i) => {
      const k = STAT_KEYS[keyIndex[i]];
      if (k) stats[k] = v;
    });
    const name = commonName || [firstName, lastName].filter(Boolean).join(' ');
    return {
      id,
      name,
      shortName: commonName || lastName || firstName,
      firstName,
      lastName,
      birthdate,
      ovr,
      pos: pos as Position,
      altPos: alt ? (alt.split(',') as Position[]) : [],
      foot,
      weakFoot,
      skillMoves,
      teamIdx,
      nationIdx,
      gender,
      stats,
      playstyles,
      playstylesPlus,
      searchName: normalize(`${name} ${firstName} ${lastName}`),
    };
  });
  return {
    fetchedAt: raw.fetchedAt,
    players,
    teams: raw.teams.map(([id, name, crest, leagueIdx]) => ({ id, name, crest, leagueIdx })),
    nations: raw.nations.map(([id, name, flag]) => ({ id, name, flag })),
    leagues: raw.leagues,
    playstyles: raw.playstyles.map(([name, desc, icon]) => ({ name, desc, icon })),
    byId: new Map(players.map((p) => [p.id, p])),
  };
}

export async function loadDatabase(): Promise<Database> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/players.json`);
  if (!res.ok) throw new Error(`Falha ao carregar a base de jogadores (HTTP ${res.status})`);
  return decodeDatabase(await res.json());
}
