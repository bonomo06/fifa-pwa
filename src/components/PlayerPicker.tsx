import { useDeferredValue, useMemo, useState } from 'react';
import { normalize } from '../lib/data';
import type { PlayerView } from '../lib/types';
import { PlayerRow } from './PlayerRow';
import { Empty, Sheet } from './ui';

interface Props {
  title: string;
  /** lista onde procurar (ex.: elenco); padrão = já vem ordenada por relevância */
  pool: PlayerView[];
  onPick: (v: PlayerView) => void;
  onClose: () => void;
  /** texto extra por jogador (ex.: rating na vaga) */
  extra?: (v: PlayerView) => React.ReactNode;
}

export function PlayerPicker({ title, pool, onPick, onClose, extra }: Props) {
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);
  const list = useMemo(() => {
    const terms = normalize(dq).split(/\s+/).filter(Boolean);
    const filtered = terms.length ? pool.filter((v) => terms.every((t) => v.p.searchName.includes(t))) : pool;
    return filtered.slice(0, 60);
  }, [pool, dq]);

  return (
    <Sheet title={title} onClose={onClose}>
      <div className="stack">
        <input className="input" type="search" autoFocus placeholder="Buscar pelo nome…" value={q} onChange={(e) => setQ(e.target.value)} />
        {list.length === 0 ? (
          <Empty>Ninguém encontrado.</Empty>
        ) : (
          <div className="plist">
            {list.map((v) => (
              <PlayerRow key={v.p.id} v={v} onClick={() => onPick(v)} extra={extra?.(v)} right={<span />} />
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}
