import { useMemo, useState } from 'react';
import { Img, MoneyInput } from '../../components/ui';
import { BASE_SEASON } from '../../lib/age';
import { normalize } from '../../lib/data';
import { makeViews } from '../../lib/views';
import { snapshotOf, useApp } from '../../store/app';
import { useDb } from '../../store/data';

export function NewSave({ onDone }: { onDone?: () => void }) {
  const db = useDb();
  const createSave = useApp((s) => s.createSave);
  const [q, setQ] = useState('');
  const [teamIdx, setTeamIdx] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState<number | undefined>();

  const teams = useMemo(() => {
    const stats = db.teams.map(() => ({ n: 0, sum: 0 }));
    for (const p of db.players) {
      const s = stats[p.teamIdx];
      s.n++;
      s.sum += p.ovr;
    }
    return db.teams
      .map((t, idx) => ({ ...t, idx, n: stats[idx].n, avg: stats[idx].n ? Math.round(stats[idx].sum / stats[idx].n) : 0, key: normalize(`${t.name} ${db.leagues[t.leagueIdx]}`) }))
      .filter((t) => t.n >= 11 && t.id >= 0)
      .sort((a, b) => b.avg - a.avg);
  }, [db]);

  const shown = useMemo(() => {
    const terms = normalize(q).split(/\s+/).filter(Boolean);
    return teams.filter((t) => terms.every((x) => t.key.includes(x))).slice(0, 40);
  }, [teams, q]);

  const team = teamIdx != null ? db.teams[teamIdx] : null;

  const create = () => {
    if (teamIdx == null || !team) return;
    const players = db.players.filter((p) => p.teamIdx === teamIdx);
    createSave({
      name: name.trim() || team.name,
      teamId: team.id,
      budget: budget ?? 0,
      squad: players.map((p) => p.id),
      startSnapshot: snapshotOf(makeViews(players, { season: BASE_SEASON })),
    });
    onDone?.();
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Novo save</h1>
          <div className="sub">Escolha o clube da sua carreira. O elenco inicial vem da base do FC 27.</div>
        </div>
      </div>

      {!team ? (
        <>
          <input className="input" type="search" autoFocus placeholder="Buscar clube ou liga…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="plist">
            {shown.map((t) => (
              <button key={t.idx} className="prow" style={{ gridTemplateColumns: '32px 1fr auto', cursor: 'pointer', textAlign: 'left' }} onClick={() => { setTeamIdx(t.idx); setName(t.name); }}>
                <Img className="crest lg" src={t.crest} />
                <div style={{ minWidth: 0 }}>
                  <div className="name">{t.name}</div>
                  <div className="meta">{db.leagues[t.leagueIdx]} · {t.n} jogadores</div>
                </div>
                <div className="num"><div className="k">Média</div><div className="v">{t.avg}</div></div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="card stack">
          <div className="row">
            <Img className="crest lg" src={team.crest} />
            <b>{team.name}</b>
            <div className="spacer" />
            <button className="btn sm ghost" onClick={() => setTeamIdx(null)}>Trocar clube</button>
          </div>
          <label className="field"><span>Nome do save</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field"><span>Orçamento de transferências (o que aparece no jogo)</span>
            <MoneyInput value={budget} onChange={setBudget} placeholder="ex: 45 mi" />
          </label>
          <p className="muted small" style={{ margin: 0 }}>Temporada inicial: 26/27. Dá para editar o orçamento depois.</p>
          <button className="btn primary" onClick={create}>Começar carreira</button>
        </div>
      )}
    </div>
  );
}
