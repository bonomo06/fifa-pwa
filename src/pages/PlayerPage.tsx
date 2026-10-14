import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IconBack, IconCompare, IconStar, IconSwap } from '../components/icons';
import { PlayerRow } from '../components/PlayerRow';
import { TransferSheet } from '../components/TransferSheet';
import { Avatar, Empty, Img, Money, MoneyInput, NumInput, Ovr, Pos } from '../components/ui';
import { useAllViews } from '../hooks/useViews';
import { formatMoney } from '../lib/estimates';
import { GK_GROUP, STAT_GROUPS, STAT_LABEL, statColor } from '../lib/labels';
import { POSITION_LABEL, bestPositions } from '../lib/positions';
import { findSimilar } from '../lib/similar';
import type { StatKey } from '../lib/types';
import { useActiveSave, useApp } from '../store/app';
import { useDb } from '../store/data';

const AGE_OPTIONS = [19, 21, 23, 25, 27, 29, 31, 40];

function StatBar({ k, v }: { k: StatKey; v: number }) {
  return (
    <div className="bar-row">
      <span>{STAT_LABEL[k]}</span>
      <b>{v}</b>
      <div className="bar"><i style={{ width: `${v}%`, background: statColor(v) }} /></div>
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return <span title={`${n} estrelas`}>{'★'.repeat(n)}<span className="muted">{'★'.repeat(Math.max(0, 5 - n))}</span></span>;
}

export function PlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const db = useDb();
  const { views, byId } = useAllViews();
  const save = useActiveSave();
  const { compare, toggleCompare, toggleWatch, setOverride, addToSquad, removeFromSquad } = useApp();
  const [showTransfer, setShowTransfer] = useState(false);
  const v = byId.get(Number(id));

  const [maxAge, setMaxAge] = useState<number | undefined>(undefined);
  // padrão: alguns anos mais novo que o jogador (mínimo 21), arredondado para uma opção do seletor
  const defaultMaxAge = v ? (AGE_OPTIONS.find((a) => a >= Math.max(21, v.age - 3)) ?? 40) : 40;
  const [inBudget, setInBudget] = useState(false);
  const similar = useMemo(() => {
    if (!v) return [];
    const exclude = new Set(save?.squad ?? []);
    return findSimilar(v, views, {
      maxAge: maxAge ?? defaultMaxAge,
      maxValue: inBudget && save ? Math.max(0, save.budget) : undefined,
      excludeIds: exclude,
      limit: 15,
    });
  }, [v, views, maxAge, defaultMaxAge, inBudget, save]);

  if (!v) return <Empty>Jogador não encontrado.</Empty>;
  const p = v.p;
  const team = db.teams[p.teamIdx];
  const nation = db.nations[p.nationIdx];
  const watched = save?.watch.some((w) => w.playerId === p.id);
  const inSquad = save?.squad.includes(p.id);
  const o = save?.overrides[p.id];
  const positions = bestPositions(p, v.ovr, 5);
  const isGk = p.pos === 'GK';

  return (
    <div className="stack">
      <div className="row">
        <button className="btn icon ghost" onClick={() => navigate(-1)} aria-label="Voltar"><IconBack /></button>
        <div className="spacer" />
        {save && (
          <button className={`btn sm${watched ? ' on' : ''}`} onClick={() => toggleWatch(p.id)}>
            <IconStar fill={watched ? 'currentColor' : 'none'} /> {watched ? 'Nos alvos' : 'Alvo'}
          </button>
        )}
        <button className={`btn sm${compare.includes(p.id) ? ' on' : ''}`} onClick={() => toggleCompare(p.id)}><IconCompare /> Comparar</button>
      </div>

      <div className="card">
        <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
          <Avatar p={p} large />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1>{p.name}</h1>
            {p.name !== `${p.firstName} ${p.lastName}` && <div className="muted small">{p.firstName} {p.lastName}</div>}
            <div className="row wrap mt" style={{ gap: 6 }}>
              <Pos pos={p.pos} />
              {p.altPos.map((a) => <Pos key={a} pos={a} />)}
            </div>
            <div className="row wrap muted small mt">
              <Img className="crest lg" src={team?.crest ?? ''} />
              <span>{team?.name}</span>
              <span>·</span>
              <span>{db.leagues[team?.leagueIdx ?? -1]}</span>
            </div>
            <div className="row wrap muted small" style={{ marginTop: 4 }}>
              <Img className="flag" src={nation?.flag ?? ''} />
              <span>{nation?.name}</span>
              <span>·</span>
              <span>{v.age} anos ({p.birthdate.split('-').reverse().join('/')})</span>
            </div>
          </div>
          <Ovr value={v.ovr} large />
        </div>

        <div className="stat-tiles mt">
          <div className="tile"><div className="k">Potencial</div><div className={`v${v.potEstimated ? ' est' : ''}`}>{v.potLabel}</div></div>
          <div className="tile"><div className="k">Valor</div><div className="v"><Money value={v.value} estimated={v.valueEstimated} /></div></div>
          <div className="tile"><div className="k">Pé</div><div className="v">{p.foot === 'L' ? 'Esquerdo' : 'Direito'}</div></div>
          <div className="tile"><div className="k">Pé fraco</div><div className="v"><Stars n={p.weakFoot} /></div></div>
          <div className="tile"><div className="k">Dribles</div><div className="v"><Stars n={p.skillMoves} /></div></div>
        </div>
        {(v.potEstimated || v.valueEstimated) && (
          <p className="muted small" style={{ marginBottom: 0 }}>
            "~" = estimativa do app (a EA não publica potencial nem valor). {save ? 'Corrija abaixo com o que aparece no seu jogo.' : 'Crie um save para registrar os números reais do seu jogo.'}
          </p>
        )}
      </div>

      {save && (
        <div className="card stack">
          <div className="row wrap">
            <h2 style={{ margin: 0 }}>No seu save</h2>
            <div className="spacer" />
            {inSquad ? (
              <>
                <button className="btn sm" onClick={() => setShowTransfer(true)}><IconSwap /> Vender / emprestar</button>
                <button className="btn sm ghost" onClick={() => removeFromSquad(p.id)}>Tirar do elenco</button>
              </>
            ) : (
              <>
                <button className="btn sm primary" onClick={() => setShowTransfer(true)}><IconSwap /> Registrar contratação</button>
                <button className="btn sm ghost" onClick={() => addToSquad(p.id)}>Só adicionar ao elenco</button>
              </>
            )}
          </div>
          <div className="grid-2">
            <label className="field"><span>Overall atual no jogo</span>
              <NumInput value={o?.ovr} placeholder={String(p.ovr)} onChange={(n) => setOverride(p.id, { ovr: n })} />
            </label>
            <label className="field"><span>Valor no jogo</span>
              <MoneyInput value={o?.value} placeholder={`estimado: ${formatMoney(v.value)}`} onChange={(n) => setOverride(p.id, { value: n })} />
            </label>
            <div className="field"><span>Potencial do olheiro (faixa)</span>
              <div className="range-pair">
                <NumInput value={o?.potMin} placeholder="de" onChange={(n) => setOverride(p.id, { potMin: n })} />
                <NumInput value={o?.potMax} placeholder="até" onChange={(n) => setOverride(p.id, { potMax: n })} />
              </div>
            </div>
            <div className="field" style={{ justifyContent: 'flex-end' }}>
              {o && <button className="btn sm ghost" onClick={() => setOverride(p.id, null)}>Voltar às estimativas</button>}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Rendimento por posição</h2>
        <div className="row wrap" style={{ gap: 10 }}>
          {positions.map(({ pos, rating }) => (
            <div key={pos} className="tile center" style={{ minWidth: 72 }}>
              <div className="k">{POSITION_LABEL[pos]}</div>
              <div className="v"><Ovr value={rating} /></div>
            </div>
          ))}
        </div>
        <p className="muted small" style={{ marginBottom: 0 }}>Calculado pelos atributos (erro médio &lt; 1 ponto contra os overalls oficiais).</p>
      </div>

      {(p.playstyles.length > 0 || p.playstylesPlus.length > 0) && (
        <div className="card">
          <h2>PlayStyles</h2>
          <div className="ps-list">
            {p.playstylesPlus.map((i) => (
              <span key={`p${i}`} className="ps plus" title={db.playstyles[i]?.desc}><Img className="" src={db.playstyles[i]?.icon ?? ''} />{db.playstyles[i]?.name}+</span>
            ))}
            {p.playstyles.map((i) => (
              <span key={i} className="ps" title={db.playstyles[i]?.desc}><Img className="" src={db.playstyles[i]?.icon ?? ''} />{db.playstyles[i]?.name}</span>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2>Atributos</h2>
        <div className="stat-bars">
          {isGk && (
            <div className="stat-group">
              <h3>Goleiro</h3>
              {GK_GROUP.map((k) => <StatBar key={k} k={k} v={p.stats[k]} />)}
            </div>
          )}
          {STAT_GROUPS.map((g) => (
            <div key={g.key} className="stat-group">
              <h3><span>{g.title}</span><span>{p.stats[g.key]}</span></h3>
              {g.stats.map((k) => <StatBar key={k} k={k} v={p.stats[k]} />)}
            </div>
          ))}
        </div>
      </div>

      <div className="card stack">
        <h2 style={{ margin: 0 }}>Substitutos parecidos</h2>
        <div className="row wrap small">
          <label className="row">Até
            <select className="select" style={{ width: 'auto', minHeight: 32 }} value={maxAge ?? defaultMaxAge} onChange={(e) => setMaxAge(Number(e.target.value))}>
              {AGE_OPTIONS.map((a) => <option key={a} value={a}>{a === 40 ? 'qualquer idade' : `${a} anos`}</option>)}
            </select>
          </label>
          {save && (
            <label className="row"><input type="checkbox" checked={inBudget} onChange={(e) => setInBudget(e.target.checked)} /> dentro do orçamento</label>
          )}
        </div>
        <p className="muted small" style={{ margin: 0 }}>Mesmo perfil de atributos para {POSITION_LABEL[p.pos]}, com potencial perto do overall dele ({v.ovr}).</p>
        {similar.length === 0 ? (
          <Empty>Nenhum substituto com esses critérios.</Empty>
        ) : (
          <div className="plist">
            {similar.map(({ v: s, similarity }) => (
              <PlayerRow key={s.p.id} v={s} extra={<span className="tag info">{similarity}% parecido</span>} />
            ))}
          </div>
        )}
      </div>

      {showTransfer && <TransferSheet v={v} onClose={() => setShowTransfer(false)} />}
    </div>
  );
}
