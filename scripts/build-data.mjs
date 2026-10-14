// Converte data-raw/pages/*.json (EA) em public/data/players.json, num formato compacto
// (tabelas de lookup + jogadores como arrays). O formato é decodificado por src/lib/data.ts.
// Uso: node scripts/build-data.mjs
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PAGES_DIR = path.join(ROOT, 'data-raw', 'pages');
const OUT = path.join(ROOT, 'public', 'data', 'players.json');

// Mesma ordem de STAT_KEYS em src/lib/types.ts
const STAT_KEYS = [
  'pac', 'sho', 'pas', 'dri', 'def', 'phy',
  'acceleration', 'sprintSpeed',
  'positioning', 'finishing', 'shotPower', 'longShots', 'volleys', 'penalties',
  'vision', 'crossing', 'freeKickAccuracy', 'shortPassing', 'longPassing', 'curve',
  'agility', 'balance', 'reactions', 'ballControl', 'dribbling', 'composure',
  'interceptions', 'headingAccuracy', 'defensiveAwareness', 'standingTackle', 'slidingTackle',
  'jumping', 'stamina', 'strength', 'aggression',
  'gkDiving', 'gkHandling', 'gkKicking', 'gkPositioning', 'gkReflexes',
];

function isoDate(eaDate) {
  // "12/20/1998 0:00" | "6/15/1992 12:00:00 AM"
  const m = String(eaDate ?? '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return '';
  return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

function lookup() {
  const index = new Map();
  const rows = [];
  return {
    rows,
    get(key, makeRow) {
      if (!index.has(key)) {
        index.set(key, rows.length);
        rows.push(makeRow());
      }
      return index.get(key);
    },
  };
}

async function main() {
  const files = (await readdir(PAGES_DIR)).filter((f) => f.endsWith('.json'));
  const raw = [];
  for (const f of files) raw.push(...JSON.parse(await readFile(path.join(PAGES_DIR, f), 'utf8')));

  const seen = new Set();
  const items = raw
    .filter((p) => (seen.has(p.id) ? false : seen.add(p.id)))
    .sort((a, b) => a.rank - b.rank);

  const leagues = lookup();
  const teams = lookup();
  const nations = lookup();
  const playstyles = lookup();

  const players = items.map((p) => {
    const leagueIdx = leagues.get(p.leagueName ?? '', () => p.leagueName ?? '');
    const teamIdx = teams.get(p.team?.id ?? -1, () => [p.team?.id ?? -1, p.team?.label ?? 'Sem clube', p.team?.imageUrl ?? '', leagueIdx]);
    const nationIdx = nations.get(p.nationality?.id ?? -1, () => [p.nationality?.id ?? -1, p.nationality?.label ?? '?', p.nationality?.imageUrl ?? '']);
    const ps = [];
    const psPlus = [];
    for (const a of p.playerAbilities ?? []) {
      const label = a.label.replace(/\+$/, '').trim();
      const idx = playstyles.get(label, () => [label, a.description ?? '', a.imageUrl ?? '']);
      (a.type?.id === 'playStylePlus' ? psPlus : ps).push(idx);
    }
    const stats = STAT_KEYS.map((k) => {
      const s = p.stats?.[k];
      return typeof s === 'object' && s !== null ? (s.value ?? 0) : (s ?? 0);
    });
    const alt = (p.alternatePositions ?? []).map((a) => a.shortLabel).join(',');
    return [
      p.id,
      p.firstName ?? '',
      p.lastName ?? '',
      p.commonName ?? '',
      isoDate(p.birthdate),
      p.overallRating,
      p.position?.shortLabel ?? '',
      alt,
      p.preferredFoot === 2 ? 'L' : 'R',
      p.weakFootAbility ?? 0,
      p.skillMoves ?? 0,
      teamIdx,
      nationIdx,
      p.gender?.id === 1 ? 'F' : 'M',
      stats,
      ps,
      psPlus,
    ];
  });

  let meta = {};
  try {
    meta = JSON.parse(await readFile(path.join(ROOT, 'data-raw', 'meta.json'), 'utf8'));
  } catch {
    /* meta é opcional */
  }

  const out = {
    version: 1,
    source: 'EA SPORTS FC 27 Ratings (ea.com)',
    fetchedAt: meta.fetchedAt ?? new Date().toISOString(),
    statKeys: STAT_KEYS,
    leagues: leagues.rows,
    teams: teams.rows,
    nations: nations.rows,
    playstyles: playstyles.rows,
    players,
  };
  await mkdir(path.dirname(OUT), { recursive: true });
  const json = JSON.stringify(out);
  await writeFile(OUT, json);
  console.log(`${players.length} jogadores, ${teams.rows.length} clubes, ${leagues.rows.length} ligas → ${(json.length / 1e6).toFixed(1)} MB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
