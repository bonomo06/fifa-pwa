import { useMemo, useState } from 'react';
import { DEFAULT_FILTER, type PlayerFilter, type SortKey } from '../lib/filters';
import { STAT_LABEL } from '../lib/labels';
import { POSITION_LABEL } from '../lib/positions';
import type { Position } from '../lib/types';
import { useDb } from '../store/data';
import { MoneyInput, NumInput, Sheet } from './ui';

const FILTER_POSITIONS: Position[] = ['GK', 'RB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'ST'];

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'ovr', label: 'Overall' },
  { key: 'pot', label: 'Potencial' },
  { key: 'growth', label: 'Margem de crescimento' },
  { key: 'value', label: 'Valor' },
  { key: 'age', label: 'Idade' },
  { key: 'name', label: 'Nome' },
  ...(['pac', 'sho', 'pas', 'dri', 'def', 'phy', 'sprintSpeed', 'acceleration', 'finishing', 'vision', 'shortPassing', 'dribbling', 'defensiveAwareness', 'standingTackle', 'strength', 'stamina', 'headingAccuracy', 'gkReflexes'] as const)
    .map((k) => ({ key: k as SortKey, label: STAT_LABEL[k] + (['pac', 'sho', 'pas', 'dri', 'def', 'phy'].includes(k) ? ' (geral)' : '') })),
];

interface Props {
  value: PlayerFilter;
  onApply: (f: PlayerFilter) => void;
  onClose: () => void;
}

export function FilterSheet({ value, onApply, onClose }: Props) {
  const db = useDb();
  const [f, setF] = useState<PlayerFilter>(value);
  const set = (patch: Partial<PlayerFilter>) => setF((cur) => ({ ...cur, ...patch }));

  const leagues = useMemo(
    () => db.leagues.map((name, idx) => ({ name, idx })).filter((l) => l.name).sort((a, b) => a.name.localeCompare(b.name)),
    [db],
  );
  const teams = useMemo(
    () =>
      db.teams
        .map((t, idx) => ({ ...t, idx }))
        .filter((t) => f.leagueIdx == null || t.leagueIdx === f.leagueIdx)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [db, f.leagueIdx],
  );
  const nations = useMemo(() => db.nations.map((n, idx) => ({ ...n, idx })).sort((a, b) => a.name.localeCompare(b.name)), [db]);
  const playstyles = useMemo(() => db.playstyles.map((p, idx) => ({ ...p, idx })).sort((a, b) => a.name.localeCompare(b.name)), [db]);

  const togglePos = (p: Position) => {
    const cur = f.positions ?? [];
    set({ positions: cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p] });
  };
  const togglePs = (i: number) => {
    const cur = f.playstyles ?? [];
    set({ playstyles: cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i] });
  };
  const optIdx = (s: string) => (s === '' ? undefined : Number(s));

  return (
    <Sheet title="Filtros" onClose={onClose}>
      <div className="stack">
        <div className="field">
          <span>Posições</span>
          <div className="chips">
            {FILTER_POSITIONS.map((p) => (
              <button key={p} className={`chip${f.positions?.includes(p) ? ' on' : ''}`} onClick={() => togglePos(p)}>{POSITION_LABEL[p]}</button>
            ))}
          </div>
          <label className="row small muted">
            <input type="checkbox" checked={!!f.includeAlt} onChange={(e) => set({ includeAlt: e.target.checked })} />
            Incluir posições secundárias
          </label>
        </div>

        <div className="grid-2">
          <div className="field"><span>Idade</span>
            <div className="range-pair">
              <NumInput value={f.ageMin} onChange={(v) => set({ ageMin: v })} placeholder="mín" min={15} max={45} />
              <NumInput value={f.ageMax} onChange={(v) => set({ ageMax: v })} placeholder="máx" min={15} max={45} />
            </div>
          </div>
          <div className="field"><span>Overall</span>
            <div className="range-pair">
              <NumInput value={f.ovrMin} onChange={(v) => set({ ovrMin: v })} placeholder="mín" />
              <NumInput value={f.ovrMax} onChange={(v) => set({ ovrMax: v })} placeholder="máx" />
            </div>
          </div>
          <div className="field"><span>Potencial (estimado ou do olheiro)</span>
            <div className="range-pair">
              <NumInput value={f.potMin} onChange={(v) => set({ potMin: v })} placeholder="mín" />
              <NumInput value={f.potMax} onChange={(v) => set({ potMax: v })} placeholder="máx" />
            </div>
          </div>
          <div className="field"><span>Valor de mercado</span>
            <div className="range-pair">
              <MoneyInput value={f.valueMin} onChange={(v) => set({ valueMin: v })} placeholder="mín" />
              <MoneyInput value={f.valueMax} onChange={(v) => set({ valueMax: v })} placeholder="máx" />
            </div>
          </div>
        </div>

        <div className="grid-2">
          <label className="field"><span>Liga</span>
            <select className="select" value={f.leagueIdx ?? ''} onChange={(e) => set({ leagueIdx: optIdx(e.target.value), teamIdx: undefined })}>
              <option value="">Todas</option>
              {leagues.map((l) => <option key={l.idx} value={l.idx}>{l.name}</option>)}
            </select>
          </label>
          <label className="field"><span>Clube</span>
            <select className="select" value={f.teamIdx ?? ''} onChange={(e) => set({ teamIdx: optIdx(e.target.value) })}>
              <option value="">Todos</option>
              {teams.map((t) => <option key={t.idx} value={t.idx}>{t.name}</option>)}
            </select>
          </label>
          <label className="field"><span>Nacionalidade</span>
            <select className="select" value={f.nationIdx ?? ''} onChange={(e) => set({ nationIdx: optIdx(e.target.value) })}>
              <option value="">Todas</option>
              {nations.map((n) => <option key={n.idx} value={n.idx}>{n.name}</option>)}
            </select>
          </label>
          <label className="field"><span>Pé preferido</span>
            <select className="select" value={f.foot ?? ''} onChange={(e) => set({ foot: (e.target.value || undefined) as PlayerFilter['foot'] })}>
              <option value="">Qualquer</option>
              <option value="R">Direito</option>
              <option value="L">Esquerdo</option>
            </select>
          </label>
          <label className="field"><span>Pé fraco mínimo</span>
            <select className="select" value={f.weakFootMin ?? ''} onChange={(e) => set({ weakFootMin: optIdx(e.target.value) })}>
              <option value="">Qualquer</option>
              {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}★+</option>)}
            </select>
          </label>
          <label className="field"><span>Dribles (skill moves) mínimo</span>
            <select className="select" value={f.skillMovesMin ?? ''} onChange={(e) => set({ skillMovesMin: optIdx(e.target.value) })}>
              <option value="">Qualquer</option>
              {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}★+</option>)}
            </select>
          </label>
          <label className="field"><span>Futebol</span>
            <select className="select" value={f.gender ?? ''} onChange={(e) => set({ gender: (e.target.value || undefined) as PlayerFilter['gender'] })}>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="">Ambos</option>
            </select>
          </label>
          <label className="field"><span>Ordenar por</span>
            <div className="row">
              <select className="select" value={f.sort} onChange={(e) => set({ sort: e.target.value as SortKey })}>
                {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
              <select className="select" style={{ width: 110 }} value={f.sortDir} onChange={(e) => set({ sortDir: e.target.value as 'asc' | 'desc' })}>
                <option value="desc">Maior</option>
                <option value="asc">Menor</option>
              </select>
            </div>
          </label>
        </div>

        <div className="field">
          <span>PlayStyles (precisa ter todos)</span>
          <div className="chips">
            {playstyles.map((p) => (
              <button key={p.idx} className={`chip${f.playstyles?.includes(p.idx) ? ' on' : ''}`} title={p.desc} onClick={() => togglePs(p.idx)}>{p.name}</button>
            ))}
          </div>
        </div>

        <div className="row" style={{ position: 'sticky', bottom: -16, background: 'var(--bg-2)', padding: '10px 0' }}>
          <button className="btn" onClick={() => setF({ ...DEFAULT_FILTER, q: f.q })}>Limpar</button>
          <div className="spacer" />
          <button className="btn primary" onClick={() => { onApply(f); onClose(); }}>Aplicar filtros</button>
        </div>
      </div>
    </Sheet>
  );
}
