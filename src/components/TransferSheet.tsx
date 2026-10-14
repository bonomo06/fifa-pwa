import { useState } from 'react';
import { formatMoney } from '../lib/estimates';
import type { PlayerView } from '../lib/types';
import { TRANSFER_LABEL, isIncoming, useActiveSave, useApp, type TransferKind } from '../store/app';
import { MoneyInput, Sheet } from './ui';

export function TransferSheet({ v, onClose }: { v: PlayerView; onClose: () => void }) {
  const save = useActiveSave();
  const recordTransfer = useApp((s) => s.recordTransfer);
  const inSquad = !!save?.squad.includes(v.p.id);
  const kinds: TransferKind[] = inSquad ? ['venda', 'emprestimo_saida', 'liberado'] : ['compra', 'emprestimo_entrada'];
  const [kind, setKind] = useState<TransferKind>(kinds[0]);
  const watch = save?.watch.find((w) => w.playerId === v.p.id);
  const [fee, setFee] = useState<number | undefined>(watch?.askingPrice ?? v.value);
  if (!save) return null;

  const feeless = kind === 'liberado' || kind.startsWith('emprestimo');
  const amount = feeless && fee == null ? 0 : (fee ?? 0);
  const after = save.budget + (isIncoming(kind) ? -amount : amount);

  return (
    <Sheet title={`Transferência: ${v.p.name}`} onClose={onClose}>
      <div className="stack">
        <div className="chips">
          {kinds.map((k) => (
            <button key={k} className={`chip${k === kind ? ' on' : ''}`} onClick={() => { setKind(k); if (k !== 'compra' && k !== 'venda') setFee(0); }}>
              {TRANSFER_LABEL[k]}
            </button>
          ))}
        </div>
        <label className="field">
          <span>{isIncoming(kind) ? 'Valor pago' : 'Valor recebido'}</span>
          <MoneyInput value={fee} onChange={setFee} />
        </label>
        <div className="muted small">
          Orçamento: {formatMoney(save.budget)} → <b style={{ color: after < 0 ? 'var(--danger)' : 'var(--text)' }}>{formatMoney(after)}</b>
          {isIncoming(kind) ? ' · o jogador entra no elenco' : ' · o jogador sai do elenco'}
        </div>
        <div className="row">
          <div className="spacer" />
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={() => { recordTransfer({ playerId: v.p.id, kind, fee: amount }); onClose(); }}>Registrar</button>
        </div>
      </div>
    </Sheet>
  );
}
