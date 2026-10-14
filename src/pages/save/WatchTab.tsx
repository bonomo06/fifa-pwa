import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconSwap, IconTrash } from '../../components/icons';
import { PlayerRow } from '../../components/PlayerRow';
import { TransferSheet } from '../../components/TransferSheet';
import { Empty, MoneyInput, NumInput } from '../../components/ui';
import { useAllViews } from '../../hooks/useViews';
import { formatMoney } from '../../lib/estimates';
import type { PlayerView } from '../../lib/types';
import { WATCH_STATUS_LABEL, useActiveSave, useApp, type WatchStatus } from '../../store/app';

const STATUSES = Object.keys(WATCH_STATUS_LABEL) as WatchStatus[];

export function WatchTab() {
  const save = useActiveSave()!;
  const { byId } = useAllViews();
  const { updateWatch, toggleWatch, setOverride } = useApp();
  const [status, setStatus] = useState<WatchStatus | 'todos'>('todos');
  const [transferFor, setTransferFor] = useState<PlayerView | null>(null);

  const items = useMemo(
    () =>
      save.watch
        .filter((w) => status === 'todos' || w.status === status)
        .map((w) => ({ w, v: byId.get(w.playerId) }))
        .filter((x): x is { w: typeof x.w; v: PlayerView } => !!x.v),
    [save.watch, status, byId],
  );
  const negotiating = save.watch
    .filter((w) => w.status === 'negociando')
    .reduce((s, w) => s + (w.askingPrice ?? byId.get(w.playerId)?.value ?? 0), 0);

  return (
    <div className="stack">
      <div className="card tight row wrap small">
        <span>Orçamento: <b>{formatMoney(save.budget)}</b></span>
        <span className="muted">·</span>
        <span>Em negociação: <b>{formatMoney(negotiating)}</b></span>
        {negotiating > save.budget && <span className="tag danger">acima do orçamento</span>}
      </div>

      <div className="chips">
        {(['todos', ...STATUSES] as const).map((s) => (
          <button key={s} className={`chip${status === s ? ' on' : ''}`} onClick={() => setStatus(s)}>
            {s === 'todos' ? `Todos (${save.watch.length})` : `${WATCH_STATUS_LABEL[s]} (${save.watch.filter((w) => w.status === s).length})`}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <Empty>
          Nenhum alvo {status !== 'todos' ? 'com esse status' : 'ainda'}. Toque na ⭐ de qualquer jogador na <Link to="/" style={{ color: 'var(--accent)' }}>busca</Link> para observá-lo.
        </Empty>
      ) : (
        items.map(({ w, v }) => {
          const o = save.overrides[v.p.id];
          return (
            <div key={w.playerId} className="card tight stack" style={{ gap: 8 }}>
              <PlayerRow v={v} right={<span />} />
              <div className="grid-2" style={{ gap: 8 }}>
                <label className="field"><span>Status</span>
                  <select className="select" value={w.status} onChange={(e) => updateWatch(w.playerId, { status: e.target.value as WatchStatus })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{WATCH_STATUS_LABEL[s]}</option>)}
                  </select>
                </label>
                <label className="field"><span>Preço pedido</span>
                  <MoneyInput value={w.askingPrice} onChange={(n) => updateWatch(w.playerId, { askingPrice: n })} placeholder={`valor: ${formatMoney(v.value)}`} />
                </label>
                <div className="field"><span>Potencial do olheiro</span>
                  <div className="range-pair">
                    <NumInput value={o?.potMin} placeholder="de" onChange={(n) => setOverride(v.p.id, { potMin: n })} />
                    <NumInput value={o?.potMax} placeholder="até" onChange={(n) => setOverride(v.p.id, { potMax: n })} />
                  </div>
                </div>
                <label className="field"><span>Anotações</span>
                  <input className="input" value={w.note} placeholder="ex: contrato até 2027, pede 80 mil/sem" onChange={(e) => updateWatch(w.playerId, { note: e.target.value })} />
                </label>
              </div>
              <div className="row">
                <button className="btn sm ghost danger" onClick={() => toggleWatch(w.playerId)}><IconTrash /> Remover</button>
                <div className="spacer" />
                {!save.squad.includes(v.p.id) && (
                  <button className="btn sm primary" onClick={() => setTransferFor(v)}><IconSwap /> Contratar</button>
                )}
              </div>
            </div>
          );
        })
      )}

      {transferFor && <TransferSheet v={transferFor} onClose={() => setTransferFor(null)} />}
    </div>
  );
}
