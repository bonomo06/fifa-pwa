import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerRow } from '../components/PlayerRow';
import { useAllViews, useSquadViews } from '../hooks/useViews';
import { formatMoney } from '../lib/estimates';
import { DEFAULT_FILTER, applyFilter, type PlayerFilter } from '../lib/filters';
import { summarize } from '../lib/squad';
import type { Position } from '../lib/types';
import { useActiveSave, useApp } from '../store/app';
import { useDb } from '../store/data';

interface Preset {
  title: string;
  desc: string;
  filter: PlayerFilter;
}

const BASE_PRESETS: Preset[] = [
  { title: '🌟 Wonderkids', desc: 'Até 21 anos com potencial 82+', filter: { ...DEFAULT_FILTER, ageMax: 21, potMin: 82, sort: 'pot', sortDir: 'desc' } },
  { title: '💎 Joias baratas', desc: 'Até 23 anos, potencial 78+, valendo até €5 mi', filter: { ...DEFAULT_FILTER, ageMax: 23, potMin: 78, valueMax: 5e6, sort: 'pot', sortDir: 'desc' } },
  { title: '📈 Maior margem de crescimento', desc: 'Até 22 anos, ordenado por (potencial − overall)', filter: { ...DEFAULT_FILTER, ageMax: 22, ovrMin: 60, sort: 'growth', sortDir: 'desc' } },
  { title: '🧓 Veteranos pechincha', desc: '30+ anos, overall 78+, até €10 mi', filter: { ...DEFAULT_FILTER, ageMin: 30, ovrMin: 78, valueMax: 10e6, sort: 'ovr', sortDir: 'desc' } },
  { title: '⚡ Velocistas', desc: 'Atacantes e pontas com mais ritmo', filter: { ...DEFAULT_FILTER, positions: ['ST', 'LW', 'RW', 'LM', 'RM'], ovrMin: 70, sort: 'pac', sortDir: 'desc' } },
  { title: '🧱 Zagueiros jovens', desc: 'Zagueiros até 22 anos com potencial 80+', filter: { ...DEFAULT_FILTER, positions: ['CB'], ageMax: 22, potMin: 80, sort: 'pot', sortDir: 'desc' } },
  { title: '🧤 Goleiros promissores', desc: 'Goleiros até 23 anos com potencial 80+', filter: { ...DEFAULT_FILTER, positions: ['GK'], ageMax: 23, potMin: 80, sort: 'pot', sortDir: 'desc' } },
  { title: '🎯 Pé fraco 5★', desc: 'Ambidestros com overall 72+', filter: { ...DEFAULT_FILTER, weakFootMin: 5, ovrMin: 72, sort: 'ovr', sortDir: 'desc' } },
];

const GROUPS: { title: string; positions: Position[] }[] = [
  { title: 'Goleiros', positions: ['GK'] },
  { title: 'Zagueiros', positions: ['CB'] },
  { title: 'Laterais', positions: ['LB', 'RB'] },
  { title: 'Volantes e meias', positions: ['CDM', 'CM'] },
  { title: 'Meias ofensivos', positions: ['CAM'] },
  { title: 'Pontas', positions: ['LW', 'RW', 'LM', 'RM'] },
  { title: 'Atacantes', positions: ['ST'] },
];

export function HighlightsPage() {
  const db = useDb();
  const { views } = useAllViews();
  const save = useActiveSave();
  const squad = useSquadViews();
  const setFilter = useApp((s) => s.setFilter);
  const navigate = useNavigate();

  const open = (f: PlayerFilter) => {
    setFilter(f);
    navigate('/');
  };

  const clubPresets = useMemo<Preset[]>(() => {
    if (!save || !squad.length) return [];
    const level = summarize(squad).bestXiRating;
    const teamIdx = db.teams.findIndex((t) => t.id === save.teamId);
    const budget = Math.max(save.budget, 0);
    const own = teamIdx >= 0 ? { excludeTeamIdx: teamIdx } : {};
    return [
      { title: '🛒 Reforços no orçamento', desc: `Overall ${level - 2}+ valendo até ${formatMoney(budget)}`, filter: { ...DEFAULT_FILTER, ...own, ovrMin: level - 2, valueMax: budget, sort: 'ovr', sortDir: 'desc' } },
      { title: '🔭 Futuro do clube', desc: `Até 21 anos, potencial ${level + 2}+, até ${formatMoney(budget)}`, filter: { ...DEFAULT_FILTER, ...own, ageMax: 21, potMin: level + 2, valueMax: budget, sort: 'pot', sortDir: 'desc' } },
      { title: '🏷️ Melhor custo-benefício', desc: `Overall ${level - 4}+ por até 25% do orçamento`, filter: { ...DEFAULT_FILTER, ...own, ovrMin: level - 4, valueMax: Math.round(budget * 0.25), sort: 'ovr', sortDir: 'desc' } },
    ];
  }, [save, squad, db]);

  const topYoung = useMemo(
    () =>
      GROUPS.map((g) => ({
        ...g,
        list: applyFilter(views, { ...DEFAULT_FILTER, positions: g.positions, includeAlt: false, ageMax: 21, sort: 'pot', sortDir: 'desc' }, db).slice(0, 3),
      })),
    [views, db],
  );

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Destaques</h1>
          <div className="sub">Atalhos de busca prontos para o modo carreira</div>
        </div>
      </div>

      {clubPresets.length > 0 && (
        <section className="stack">
          <h3>Para o seu clube ({save!.name})</h3>
          <div className="presets">
            {clubPresets.map((p) => (
              <button key={p.title} className="card preset" onClick={() => open(p.filter)}>
                <span className="t">{p.title}</span>
                <span className="muted small">{p.desc}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="stack">
        <h3>Listas</h3>
        <div className="presets">
          {BASE_PRESETS.map((p) => (
            <button key={p.title} className="card preset" onClick={() => open(p.filter)}>
              <span className="t">{p.title}</span>
              <span className="muted small">{p.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="stack">
        <h3>Maiores promessas por posição (até 21 anos)</h3>
        <div className="grid-2">
          {topYoung.map((g) => (
            <div key={g.title} className="card tight stack" style={{ gap: 6 }}>
              <div className="row">
                <b>{g.title}</b>
                <div className="spacer" />
                <button className="btn sm ghost" onClick={() => open({ ...DEFAULT_FILTER, positions: g.positions, includeAlt: false, ageMax: 21, sort: 'pot', sortDir: 'desc' })}>Ver todos</button>
              </div>
              {g.list.map((v) => <PlayerRow key={v.p.id} v={v} />)}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
