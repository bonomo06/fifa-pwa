import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RadarChart, SERIES_COLORS } from '../components/charts';
import { IconPlus, IconX } from '../components/icons';
import { PlayerPicker } from '../components/PlayerPicker';
import { Avatar, Empty, Money, Ovr, Pos } from '../components/ui';
import { useAllViews } from '../hooks/useViews';
import { FACE_SHORT, FACE_STATS, GK_FACE, GK_GROUP, GK_SHORT, STAT_GROUPS, STAT_LABEL } from '../lib/labels';
import type { PlayerView, StatKey } from '../lib/types';
import { useApp } from '../store/app';

interface RowDef {
  label: string;
  get: (v: PlayerView) => number;
  render?: (v: PlayerView) => React.ReactNode;
  lowerIsBetter?: boolean;
  noBest?: boolean;
}

export function ComparePage() {
  const { views, byId } = useAllViews();
  const compare = useApp((s) => s.compare);
  const toggleCompare = useApp((s) => s.toggleCompare);
  const clearCompare = useApp((s) => s.clearCompare);
  const [picking, setPicking] = useState(false);
  const list = compare.map((id) => byId.get(id)).filter((v): v is PlayerView => !!v);

  const allGk = list.length > 0 && list.every((v) => v.p.pos === 'GK');
  const axes = allGk ? GK_FACE : FACE_STATS;
  const short = allGk ? GK_SHORT : FACE_SHORT;

  const rows: { title: string; rows: RowDef[] }[] = [
    {
      title: 'Geral',
      rows: [
        { label: 'Overall', get: (v) => v.ovr },
        { label: 'Potencial', get: (v) => v.pot, render: (v) => <span className={v.potEstimated ? 'est' : ''}>{v.potLabel}</span> },
        { label: 'Valor', get: (v) => v.value, render: (v) => <Money value={v.value} estimated={v.valueEstimated} />, noBest: true },
        { label: 'Idade', get: (v) => v.age, lowerIsBetter: true },
        { label: 'Pé fraco', get: (v) => v.p.weakFoot },
        { label: 'Dribles', get: (v) => v.p.skillMoves },
      ],
    },
    ...(allGk ? [{ title: 'Goleiro', rows: GK_GROUP.map((k) => statRow(k)) }] : []),
    ...STAT_GROUPS.map((g) => ({ title: `${g.title}`, rows: [statRow(g.key, true), ...g.stats.map((k) => statRow(k))] })),
  ];

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Comparar</h1>
          <div className="sub">Até 3 jogadores · toque no ícone de comparar em qualquer lista</div>
        </div>
        <div className="row">
          {list.length > 0 && <button className="btn sm ghost" onClick={clearCompare}>Limpar</button>}
          <button className="btn sm primary" disabled={list.length >= 3} onClick={() => setPicking(true)}><IconPlus /> Adicionar</button>
        </div>
      </div>

      {list.length === 0 ? (
        <Empty>
          Nenhum jogador para comparar ainda.
          <br />
          <button className="btn primary" onClick={() => setPicking(true)}><IconPlus /> Escolher jogador</button>
        </Empty>
      ) : (
        <>
          <div className="row wrap" style={{ alignItems: 'stretch' }}>
            {list.map((v, i) => (
              <div key={v.p.id} className="card tight" style={{ flex: '1 1 180px', borderTop: `3px solid ${SERIES_COLORS[i]}` }}>
                <div className="row">
                  <Avatar p={v.p} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Link to={`/jogador/${v.p.id}`} className="name" style={{ fontWeight: 700 }}>{v.p.name}</Link>
                    <div className="row small muted"><Pos pos={v.p.pos} /> {v.age} anos</div>
                  </div>
                  <Ovr value={v.ovr} />
                  <button className="btn icon sm ghost" onClick={() => toggleCompare(v.p.id)} aria-label="Remover"><IconX /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <RadarChart
              axes={axes.map((k) => short[k])}
              series={list.map((v) => ({ name: v.p.shortName, values: axes.map((k) => v.p.stats[k]) }))}
            />
          </div>

          <div className="card table-wrap">
            <table className="cmp">
              <thead>
                <tr>
                  <th />
                  {list.map((v, i) => (
                    <th key={v.p.id} style={{ color: 'var(--text)' }}>
                      <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: SERIES_COLORS[i], marginRight: 6 }} />
                      {v.p.shortName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((group) => (
                  <Group key={group.title} title={group.title} rows={group.rows} list={list} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {picking && (
        <PlayerPicker
          title="Adicionar à comparação"
          pool={views.filter((v) => !compare.includes(v.p.id))}
          onPick={(v) => { toggleCompare(v.p.id); setPicking(false); }}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  );
}

function statRow(k: StatKey, bold = false): RowDef {
  return { label: bold ? `${STAT_LABEL[k]} (geral)` : STAT_LABEL[k], get: (v) => v.p.stats[k] };
}

function Group({ title, rows, list }: { title: string; rows: RowDef[]; list: PlayerView[] }) {
  return (
    <>
      <tr><td colSpan={list.length + 1} style={{ color: 'var(--text)', fontWeight: 700, paddingTop: 14 }}>{title}</td></tr>
      {rows.map((r) => {
        const vals = list.map(r.get);
        const best = r.lowerIsBetter ? Math.min(...vals) : Math.max(...vals);
        return (
          <tr key={r.label}>
            <td>{r.label}</td>
            {list.map((v, i) => (
              <td key={v.p.id} className={!r.noBest && list.length > 1 && vals[i] === best ? 'best' : ''}>{r.render ? r.render(v) : vals[i]}</td>
            ))}
          </tr>
        );
      })}
    </>
  );
}
