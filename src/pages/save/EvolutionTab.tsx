import { useMemo, useState } from 'react';
import { LineChart } from '../../components/charts';
import { Empty, NumInput, Ovr, Pos } from '../../components/ui';
import { useSquadViews } from '../../hooks/useViews';
import { seasonLabel } from '../../lib/age';
import { useActiveSave, useApp } from '../../store/app';

export function EvolutionTab() {
  const save = useActiveSave()!;
  const squad = useSquadViews();
  const { closeSeason, setOverride } = useApp();
  const [selected, setSelected] = useState<number[]>([]);
  const [editing, setEditing] = useState(false);

  const labels = [...save.history.map((h) => h.label), `Agora (${seasonLabel(save.season)})`];

  const rows = useMemo(
    () =>
      squad
        .map((v) => {
          const first = save.history.find((h) => h.players[v.p.id]);
          const start = first?.players[v.p.id]?.ovr ?? v.p.ovr;
          return { v, start, delta: v.ovr - start };
        })
        .sort((a, b) => b.delta - a.delta || b.v.ovr - a.v.ovr),
    [squad, save.history],
  );

  // padrão do gráfico: os 3 que mais evoluíram
  const chartIds = selected.length ? selected : rows.slice(0, 3).map((r) => r.v.p.id);
  const series = chartIds
    .map((id) => squad.find((v) => v.p.id === id))
    .filter((v) => !!v)
    .map((v) => ({
      name: v.p.shortName,
      points: [...save.history.map((h) => h.players[v.p.id]?.ovr ?? null), v.ovr],
    }));

  const toggle = (id: number) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...(cur.length ? cur : chartIds), id].slice(-3)));

  const onClose = () => {
    if (confirm(`Fechar a temporada ${seasonLabel(save.season)}? Os overalls atuais do elenco viram um ponto no histórico e todos ficam 1 ano mais velhos.`)) {
      closeSeason(squad);
    }
  };

  if (!squad.length) return <Empty>Elenco vazio.</Empty>;

  return (
    <div className="stack">
      <div className="card stack">
        <div className="row wrap">
          <div>
            <h2 style={{ margin: 0 }}>Temporada {seasonLabel(save.season)}</h2>
            <div className="muted small">Atualize os overalls com o que aparece no jogo e feche a temporada no fim dela.</div>
          </div>
          <div className="spacer" />
          <button className={`btn sm${editing ? ' on' : ''}`} onClick={() => setEditing((e) => !e)}>{editing ? 'Concluir' : 'Atualizar overalls'}</button>
          <button className="btn sm primary" onClick={onClose}>Fechar temporada</button>
        </div>
      </div>

      {series.length > 0 && labels.length > 1 && (
        <div className="card">
          <h2>Evolução do overall</h2>
          <LineChart labels={labels} series={series} />
          <p className="muted small" style={{ marginBottom: 0 }}>Toque nos jogadores abaixo para escolher até 3 no gráfico.</p>
        </div>
      )}

      <div className="card table-wrap">
        <table className="cmp">
          <thead>
            <tr><th>Jogador</th><th>Idade</th><th>Início</th><th>Atual</th><th>±</th><th>Pot.</th></tr>
          </thead>
          <tbody>
            {rows.map(({ v, start, delta }) => (
              <tr key={v.p.id} onClick={() => !editing && toggle(v.p.id)} style={{ cursor: editing ? 'default' : 'pointer', background: chartIds.includes(v.p.id) ? 'var(--card-2)' : undefined }}>
                <td style={{ color: 'var(--text)' }}>
                  <div className="row"><Pos pos={v.p.pos} /> {v.p.shortName}</div>
                </td>
                <td>{v.age}</td>
                <td>{start}</td>
                <td style={{ width: editing ? 90 : undefined }}>
                  {editing ? (
                    <NumInput value={save.overrides[v.p.id]?.ovr} placeholder={String(v.ovr)} onChange={(n) => setOverride(v.p.id, { ovr: n })} />
                  ) : (
                    <Ovr value={v.ovr} />
                  )}
                </td>
                <td style={{ color: delta > 0 ? 'var(--accent)' : delta < 0 ? 'var(--danger)' : undefined, fontWeight: 700 }}>
                  {delta > 0 ? `+${delta}` : delta}
                </td>
                <td className={v.potEstimated ? 'est' : ''}>{v.potLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
