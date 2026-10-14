import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { FilterSheet, SORT_OPTIONS } from '../components/FilterSheet';
import { IconFilter, IconX } from '../components/icons';
import { PlayerRow } from '../components/PlayerRow';
import { Empty } from '../components/ui';
import { useAllViews } from '../hooks/useViews';
import { formatMoney } from '../lib/estimates';
import { DEFAULT_FILTER, activeFilterCount, applyFilter, type PlayerFilter, type SortKey } from '../lib/filters';
import { POSITION_LABEL } from '../lib/positions';
import { useApp } from '../store/app';
import { useDb } from '../store/data';

const PAGE = 50;

/** Resumo legível dos filtros ativos, cada um removível. */
function filterChips(f: PlayerFilter, db: ReturnType<typeof useDb>): { label: string; clear: Partial<PlayerFilter> }[] {
  const out: { label: string; clear: Partial<PlayerFilter> }[] = [];
  const range = (name: string, min?: number, max?: number, fmt: (n: number) => string = String) =>
    min != null && max != null ? `${name} ${fmt(min)}–${fmt(max)}` : min != null ? `${name} ≥ ${fmt(min)}` : `${name} ≤ ${fmt(max!)}`;
  if (f.positions?.length) out.push({ label: f.positions.map((p) => POSITION_LABEL[p]).join(', '), clear: { positions: [] } });
  if (f.ageMin != null || f.ageMax != null) out.push({ label: range('Idade', f.ageMin, f.ageMax), clear: { ageMin: undefined, ageMax: undefined } });
  if (f.ovrMin != null || f.ovrMax != null) out.push({ label: range('OVR', f.ovrMin, f.ovrMax), clear: { ovrMin: undefined, ovrMax: undefined } });
  if (f.potMin != null || f.potMax != null) out.push({ label: range('POT', f.potMin, f.potMax), clear: { potMin: undefined, potMax: undefined } });
  if (f.valueMin != null || f.valueMax != null) out.push({ label: range('Valor', f.valueMin, f.valueMax, formatMoney), clear: { valueMin: undefined, valueMax: undefined } });
  if (f.leagueIdx != null) out.push({ label: db.leagues[f.leagueIdx], clear: { leagueIdx: undefined } });
  if (f.teamIdx != null) out.push({ label: db.teams[f.teamIdx]?.name, clear: { teamIdx: undefined } });
  if (f.excludeTeamIdx != null) out.push({ label: `Fora do ${db.teams[f.excludeTeamIdx]?.name}`, clear: { excludeTeamIdx: undefined } });
  if (f.nationIdx != null) out.push({ label: db.nations[f.nationIdx]?.name, clear: { nationIdx: undefined } });
  if (f.foot) out.push({ label: f.foot === 'L' ? 'Canhoto' : 'Destro', clear: { foot: undefined } });
  if (f.weakFootMin) out.push({ label: `Pé fraco ${f.weakFootMin}★+`, clear: { weakFootMin: undefined } });
  if (f.skillMovesMin) out.push({ label: `Dribles ${f.skillMovesMin}★+`, clear: { skillMovesMin: undefined } });
  if (f.playstyles?.length) out.push({ label: f.playstyles.map((i) => db.playstyles[i]?.name).join(', '), clear: { playstyles: [] } });
  if (f.gender === 'F') out.push({ label: 'Feminino', clear: { gender: 'M' } });
  if (!f.gender) out.push({ label: 'Masc. + Fem.', clear: { gender: 'M' } });
  return out;
}

export function SearchPage() {
  const db = useDb();
  const { views } = useAllViews();
  const filter = useApp((s) => s.filter);
  const setFilter = useApp((s) => s.setFilter);
  const [showFilters, setShowFilters] = useState(false);
  const [q, setQ] = useState(filter.q ?? '');
  const [limit, setLimit] = useState(PAGE);

  // o texto digitado só vira filtro "persistido" depois de uma pausa
  useEffect(() => {
    const t = setTimeout(() => {
      if ((filter.q ?? '') !== q) setFilter({ ...filter, q: q || undefined });
    }, 250);
    return () => clearTimeout(t);
  }, [q, filter, setFilter]);

  const deferred = useDeferredValue(filter);
  const results = useMemo(() => applyFilter(views, deferred, db), [views, deferred, db]);
  useEffect(() => setLimit(PAGE), [deferred]);

  const chips = filterChips(filter, db);
  const count = activeFilterCount(filter);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Buscar jogadores</h1>
          <div className="sub">{results.length.toLocaleString('pt-BR')} jogadores · potencial e valor com "~" são estimativas</div>
        </div>
      </div>

      <div className="search-bar">
        <input className="input" type="search" placeholder="Nome do jogador…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className={`btn${count ? ' on' : ''}`} onClick={() => setShowFilters(true)}>
          <IconFilter /> Filtros{count ? ` (${count})` : ''}
        </button>
      </div>

      <div className="row wrap" style={{ marginBottom: 10 }}>
        <select
          className="select"
          style={{ width: 'auto', minHeight: 32, padding: '4px 10px' }}
          value={`${filter.sort}:${filter.sortDir}`}
          onChange={(e) => {
            const [sort, sortDir] = e.target.value.split(':') as [SortKey, 'asc' | 'desc'];
            setFilter({ ...filter, sort, sortDir });
          }}
        >
          {SORT_OPTIONS.flatMap((o) => [
            <option key={o.key + 'd'} value={`${o.key}:desc`}>{o.label} ↓</option>,
            <option key={o.key + 'a'} value={`${o.key}:asc`}>{o.label} ↑</option>,
          ])}
        </select>
        {chips.map((c) => (
          <button key={c.label} className="chip on" onClick={() => setFilter({ ...filter, ...c.clear })}>
            {c.label} <IconX width={12} height={12} style={{ verticalAlign: -2 }} />
          </button>
        ))}
        {chips.length > 0 && (
          <button className="btn sm ghost" onClick={() => { setQ(''); setFilter(DEFAULT_FILTER); }}>Limpar tudo</button>
        )}
      </div>

      {results.length === 0 ? (
        <Empty>Nenhum jogador com esses filtros.</Empty>
      ) : (
        <div className="plist">
          {results.slice(0, limit).map((v) => <PlayerRow key={v.p.id} v={v} />)}
          {results.length > limit && (
            <button className="btn" onClick={() => setLimit((l) => l + PAGE)}>
              Mostrar mais ({(results.length - limit).toLocaleString('pt-BR')} restantes)
            </button>
          )}
        </div>
      )}

      {showFilters && <FilterSheet value={filter} onApply={setFilter} onClose={() => setShowFilters(false)} />}
    </div>
  );
}
