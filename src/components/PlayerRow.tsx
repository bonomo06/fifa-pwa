import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { PlayerView } from '../lib/types';
import { useActiveSave, useApp } from '../store/app';
import { useDb } from '../store/data';
import { IconCompare, IconStar } from './icons';
import { Avatar, Img, Money, Ovr, Pos } from './ui';

interface Props {
  v: PlayerView;
  /** conteúdo extra à direita (substitui as ações padrão) */
  right?: ReactNode;
  /** linha extra abaixo do nome */
  extra?: ReactNode;
  onClick?: () => void;
}

export function PlayerRow({ v, right, extra, onClick }: Props) {
  const db = useDb();
  const save = useActiveSave();
  const compare = useApp((s) => s.compare);
  const toggleCompare = useApp((s) => s.toggleCompare);
  const toggleWatch = useApp((s) => s.toggleWatch);
  const team = db.teams[v.p.teamIdx];
  const nation = db.nations[v.p.nationIdx];
  const watched = save?.watch.some((w) => w.playerId === v.p.id);
  const inSquad = save?.squad.includes(v.p.id);

  const body = (
    <>
      <Avatar p={v.p} />
      <div style={{ minWidth: 0 }}>
        <div className="name">{v.p.name}</div>
        <div className="meta">
          <Pos pos={v.p.pos} />
          {v.p.altPos.slice(0, 2).map((a) => <span key={a} className="small">{a}</span>)}
          <span>{v.age} anos</span>
          <span className="show-sm"><Money value={v.value} estimated={v.valueEstimated} /></span>
          <Img className="flag" src={nation?.flag ?? ''} title={nation?.name} />
          <Img className="crest" src={team?.crest ?? ''} title={team?.name} />
          <span className="hide-sm">{team?.name}</span>
          {inSquad && <span className="tag ok">elenco</span>}
        </div>
        {extra}
      </div>
    </>
  );

  return (
    <div className="prow">
      {onClick ? (
        <button onClick={onClick} style={{ display: 'contents', textAlign: 'left', background: 'none', border: 0, cursor: 'pointer' }}>{body}</button>
      ) : (
        <Link to={`/jogador/${v.p.id}`} style={{ display: 'contents' }}>{body}</Link>
      )}
      <div className="nums">
        <div className="num"><div className="k">OVR</div><Ovr value={v.ovr} /></div>
        <div className="num"><div className="k">POT</div><div className={`v${v.potEstimated ? ' est' : ''}`}>{v.potLabel}</div></div>
        <div className="num hide-sm" style={{ minWidth: 70 }}><div className="k">Valor</div><div className="v"><Money value={v.value} estimated={v.valueEstimated} /></div></div>
        {right ?? (
          <div className="actions">
            {save && (
              <button className={`btn icon sm${watched ? ' on' : ''}`} title={watched ? 'Remover dos alvos' : 'Adicionar aos alvos'} onClick={() => toggleWatch(v.p.id)}>
                <IconStar fill={watched ? 'currentColor' : 'none'} />
              </button>
            )}
            <button className={`btn icon sm${compare.includes(v.p.id) ? ' on' : ''}`} title="Comparar" onClick={() => toggleCompare(v.p.id)}>
              <IconCompare />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
