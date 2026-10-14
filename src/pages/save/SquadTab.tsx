import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconPlus } from '../../components/icons';
import { PlayerPicker } from '../../components/PlayerPicker';
import { PlayerRow } from '../../components/PlayerRow';
import { Empty, Ovr } from '../../components/ui';
import { useAllViews, useSquadViews } from '../../hooks/useViews';
import { formatMoney } from '../../lib/estimates';
import { DEFAULT_FILTER } from '../../lib/filters';
import { GROUP_LABEL, POSITION_GROUP, POSITION_LABEL } from '../../lib/positions';
import { agingPlayers, analyzeNeeds, summarize } from '../../lib/squad';
import type { PositionGroup } from '../../lib/types';
import { useApp } from '../../store/app';

const GROUP_ORDER: PositionGroup[] = ['GK', 'DEF', 'MID', 'ATT'];

export function SquadTab() {
  const squad = useSquadViews();
  const { views } = useAllViews();
  const addToSquad = useApp((s) => s.addToSquad);
  const setFilter = useApp((s) => s.setFilter);
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  const summary = useMemo(() => summarize(squad), [squad]);
  const needs = useMemo(() => analyzeNeeds(squad), [squad]);
  const aging = useMemo(() => agingPlayers(squad), [squad]);
  const groups = useMemo(
    () => GROUP_ORDER.map((g) => ({ g, list: squad.filter((v) => POSITION_GROUP[v.p.pos] === g).sort((a, b) => b.ovr - a.ovr) })),
    [squad],
  );
  const flagged = needs.filter((n) => n.short || n.weak);

  const searchFor = (positions: typeof needs[number]['positions']) => {
    setFilter({ ...DEFAULT_FILTER, positions, ovrMin: summary.bestXiRating - 4, sort: 'ovr', sortDir: 'desc' });
    navigate('/');
  };

  return (
    <div className="stack">
      <div className="stat-tiles">
        <div className="tile"><div className="k">Jogadores</div><div className="v">{summary.size}</div></div>
        <div className="tile"><div className="k">Melhor XI</div><div className="v">{summary.bestXiRating}</div></div>
        <div className="tile"><div className="k">Média OVR</div><div className="v">{summary.avgOvr}</div></div>
        <div className="tile"><div className="k">Idade média</div><div className="v">{summary.avgAge}</div></div>
        <div className="tile"><div className="k">Valor do elenco</div><div className="v">{formatMoney(summary.totalValue)}</div></div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Carências do elenco</h2>
          {flagged.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>Elenco equilibrado: todas as posições têm opções no nível do time.</p>
          ) : (
            flagged.map((n) => (
              <div key={n.key} className="need">
                <div>
                  <b>{n.label}</b>
                  <div className="small muted">
                    {n.have} de {n.want} opções no nível · melhor: {n.best}
                  </div>
                </div>
                <div className="row">
                  {n.short && <span className="tag warn">poucas opções</span>}
                  {n.weak && <span className="tag danger">titular fraco</span>}
                </div>
                <button className="btn sm" onClick={() => searchFor(n.positions)}>Buscar</button>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h2>Envelhecendo (31+)</h2>
          {aging.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>Nenhum jogador com 31 anos ou mais.</p>
          ) : (
            aging.map((v) => (
              <div key={v.p.id} className="need">
                <div>
                  <b>{v.p.name}</b>
                  <div className="small muted">{POSITION_LABEL[v.p.pos]} · {v.age} anos</div>
                </div>
                <Ovr value={v.ovr} />
                <Link className="btn sm" to={`/jogador/${v.p.id}`}>Substituto</Link>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="row">
        <h2>Elenco</h2>
        <div className="spacer" />
        <button className="btn sm" onClick={() => setAdding(true)}><IconPlus /> Adicionar jogador</button>
      </div>
      {squad.length === 0 && <Empty>Elenco vazio.</Empty>}
      {groups.map(({ g, list }) =>
        list.length ? (
          <section key={g} className="stack" style={{ gap: 6 }}>
            <h3>{GROUP_LABEL[g]} ({list.length})</h3>
            <div className="plist">{list.map((v) => <PlayerRow key={v.p.id} v={v} />)}</div>
          </section>
        ) : null,
      )}

      {adding && (
        <PlayerPicker
          title="Adicionar ao elenco"
          pool={views.filter((v) => !squad.some((s) => s.p.id === v.p.id))}
          onPick={(v) => { addToSquad(v.p.id); setAdding(false); }}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
}
