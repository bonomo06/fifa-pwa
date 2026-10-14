import { useMemo, useState } from 'react';
import { IconPlus } from '../../components/icons';
import { PlayerPicker } from '../../components/PlayerPicker';
import { PlayerRow } from '../../components/PlayerRow';
import { TransferSheet } from '../../components/TransferSheet';
import { Empty, MoneyInput } from '../../components/ui';
import { useAllViews, useSquadViews } from '../../hooks/useViews';
import { seasonLabel } from '../../lib/age';
import { formatMoney } from '../../lib/estimates';
import type { PlayerView } from '../../lib/types';
import { TRANSFER_LABEL, isIncoming, useActiveSave, useApp, type Transfer } from '../../store/app';

export function TransfersTab() {
  const save = useActiveSave()!;
  const { views, byId } = useAllViews();
  const squad = useSquadViews();
  const updateSave = useApp((s) => s.updateSave);
  const undoTransfer = useApp((s) => s.undoTransfer);
  const [picker, setPicker] = useState<'in' | 'out' | null>(null);
  const [transferFor, setTransferFor] = useState<PlayerView | null>(null);

  const bySeason = useMemo(() => {
    const map = new Map<number, Transfer[]>();
    for (const t of save.transfers) map.set(t.season, [...(map.get(t.season) ?? []), t]);
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [save.transfers]);

  return (
    <div className="stack">
      <div className="card stack">
        <label className="field"><span>Orçamento de transferências atual</span>
          <MoneyInput value={save.budget} onChange={(n) => updateSave({ budget: n ?? 0 })} />
        </label>
        <p className="muted small" style={{ margin: 0 }}>Atualizado automaticamente ao registrar compras e vendas. Ajuste se o jogo mostrar outro valor.</p>
        <div className="row wrap">
          <button className="btn primary" onClick={() => setPicker('in')}><IconPlus /> Registrar contratação</button>
          <button className="btn" onClick={() => setPicker('out')}>Registrar saída</button>
        </div>
      </div>

      {bySeason.length === 0 ? (
        <Empty>Nenhuma transferência registrada.</Empty>
      ) : (
        bySeason.map(([season, list]) => {
          const spent = list.filter((t) => isIncoming(t.kind)).reduce((s, t) => s + t.fee, 0);
          const earned = list.filter((t) => !isIncoming(t.kind)).reduce((s, t) => s + t.fee, 0);
          return (
            <section key={season} className="stack" style={{ gap: 6 }}>
              <div className="row wrap">
                <h3>Temporada {seasonLabel(season)}</h3>
                <div className="spacer" />
                <span className="small">Gasto <b style={{ color: 'var(--danger)' }}>{formatMoney(spent)}</b> · Recebido <b style={{ color: 'var(--accent)' }}>{formatMoney(earned)}</b> · Saldo <b>{formatMoney(earned - spent)}</b></span>
              </div>
              {list.map((t) => {
                const v = byId.get(t.playerId);
                if (!v) return null;
                return (
                  <PlayerRow
                    key={t.id}
                    v={v}
                    extra={<span className={`tag ${isIncoming(t.kind) ? 'ok' : 'warn'}`}>{TRANSFER_LABEL[t.kind]} · {formatMoney(t.fee)}</span>}
                    right={<button className="btn sm ghost" onClick={() => undoTransfer(t.id)} title="Desfaz e devolve o dinheiro">Desfazer</button>}
                  />
                );
              })}
            </section>
          );
        })
      )}

      {picker && (
        <PlayerPicker
          title={picker === 'in' ? 'Quem você contratou?' : 'Quem saiu?'}
          pool={picker === 'in' ? views.filter((v) => !save.squad.includes(v.p.id)) : [...squad].sort((a, b) => b.ovr - a.ovr)}
          onPick={(v) => { setPicker(null); setTransferFor(v); }}
          onClose={() => setPicker(null)}
        />
      )}
      {transferFor && <TransferSheet v={transferFor} onClose={() => setTransferFor(null)} />}
    </div>
  );
}
