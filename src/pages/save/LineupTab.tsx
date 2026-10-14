import { useEffect, useMemo, useState } from 'react';
import { IconWand } from '../../components/icons';
import { PlayerPicker } from '../../components/PlayerPicker';
import { PlayerRow } from '../../components/PlayerRow';
import { Empty, Ovr } from '../../components/ui';
import { useSquadViews } from '../../hooks/useViews';
import { avatarUrl } from '../../lib/data';
import { FORMATIONS, autoFill, lineupRating, slotRating } from '../../lib/lineup';
import { POSITION_LABEL, isFamiliar } from '../../lib/positions';
import { useActiveSave, useApp } from '../../store/app';

export function LineupTab() {
  const save = useActiveSave()!;
  const squad = useSquadViews();
  const updateSave = useApp((s) => s.updateSave);
  const [slotIdx, setSlotIdx] = useState<number | null>(null);

  const formation = FORMATIONS[save.formation] ? save.formation : '4-3-3';
  const slots = FORMATIONS[formation];
  const byId = useMemo(() => new Map(squad.map((v) => [v.p.id, v])), [squad]);

  // escalação salva inválida (formação trocada / jogador saiu) → completa automaticamente
  const lineup = useMemo(() => {
    const cur = save.lineup.length === slots.length ? save.lineup.map((id) => (id != null && byId.has(id) ? id : null)) : null;
    return cur ?? autoFill(squad, slots);
  }, [save.lineup, slots, byId, squad]);

  useEffect(() => {
    if (squad.length && save.lineup.length !== slots.length) updateSave({ lineup: autoFill(squad, slots) });
  }, [squad, slots, save.lineup.length, updateSave]);

  if (!squad.length) return <Empty>Adicione jogadores ao elenco para montar a escalação.</Empty>;

  const rating = lineupRating(lineup, slots, byId);
  const bench = squad.filter((v) => !lineup.includes(v.p.id)).sort((a, b) => b.ovr - a.ovr);

  const assign = (idx: number, playerId: number) => {
    const next = [...lineup];
    const prevIdx = next.indexOf(playerId);
    // se o jogador já estava em campo, troca de lugar com o ocupante da vaga
    if (prevIdx >= 0) next[prevIdx] = next[idx];
    next[idx] = playerId;
    updateSave({ lineup: next });
  };

  return (
    <div className="stack">
      <div className="row wrap">
        <select className="select" style={{ width: 'auto' }} value={formation} onChange={(e) => updateSave({ formation: e.target.value, lineup: autoFill(squad, FORMATIONS[e.target.value]) })}>
          {Object.keys(FORMATIONS).map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <button className="btn sm" onClick={() => updateSave({ lineup: autoFill(squad, slots) })}><IconWand /> Melhor XI</button>
        <div className="spacer" />
        <span className="muted small">Força do time</span>
        <Ovr value={rating} />
      </div>

      <div className="pitch">
        {slots.map((s, i) => {
          const v = lineup[i] != null ? byId.get(lineup[i]!) : undefined;
          return (
            <button key={i} className={`slot${v ? '' : ' empty'}`} style={{ left: `${s.x}%`, top: `${s.y}%` }} onClick={() => setSlotIdx(i)}>
              <div className="disc">
                {v ? <img src={avatarUrl(v.p.id)} alt="" loading="lazy" /> : POSITION_LABEL[s.pos]}
              </div>
              {v && (
                <>
                  <span className="lbl">{v.p.shortName}</span>
                  <span className={`rt${isFamiliar(v.p, s.pos) ? '' : ' off'}`} title={isFamiliar(v.p, s.pos) ? '' : 'Fora da posição'}>
                    {POSITION_LABEL[s.pos]} {slotRating(v, s.pos)}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
      <p className="muted small center" style={{ margin: 0 }}>Toque numa posição para trocar o jogador. Laranja = fora da posição de origem.</p>

      <h3>Banco e reservas</h3>
      <div className="plist">{bench.map((v) => <PlayerRow key={v.p.id} v={v} />)}</div>

      {slotIdx != null && (
        <PlayerPicker
          title={`Escolher ${POSITION_LABEL[slots[slotIdx].pos]}`}
          pool={[...squad].sort((a, b) => slotRating(b, slots[slotIdx].pos) - slotRating(a, slots[slotIdx].pos))}
          extra={(v) => (
            <span className={`tag ${isFamiliar(v.p, slots[slotIdx].pos) ? 'ok' : 'warn'}`}>
              {POSITION_LABEL[slots[slotIdx].pos]}: {slotRating(v, slots[slotIdx].pos)}
              {lineup.includes(v.p.id) ? ' · em campo' : ''}
            </span>
          )}
          onPick={(v) => { assign(slotIdx, v.p.id); setSlotIdx(null); }}
          onClose={() => setSlotIdx(null)}
        />
      )}
    </div>
  );
}
