import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconTrash } from '../../components/icons';
import { Empty } from '../../components/ui';
import { useAllViews, useSquadViews } from '../../hooks/useViews';
import { seasonLabel } from '../../lib/age';
import { formatMoney } from '../../lib/estimates';
import { CATEGORY_LABEL, rollEvent, type EventCategory } from '../../lib/events';
import { summarize } from '../../lib/squad';
import { useActiveSave, useApp, type EventLog } from '../../store/app';

const MODES = [
  { key: 'leve', label: 'Leve', desc: 'menos eventos ruins' },
  { key: 'normal', label: 'Normal', desc: 'equilibrado' },
  { key: 'caos', label: 'Caos', desc: 'o dobro de problemas' },
] as const;

const SEVERITY_TAG = { bom: 'ok', neutro: 'info', ruim: 'danger' } as const;
const SEVERITY_LABEL = { bom: 'Bom', neutro: 'Neutro', ruim: 'Ruim' } as const;

function EventCard({ e, highlight }: { e: EventLog; highlight?: boolean }) {
  const { byId } = useAllViews();
  const { updateEvent, applyEventBudget, deleteEvent } = useApp();
  return (
    <div className="card stack" style={{ gap: 8, opacity: e.done ? 0.6 : 1, borderColor: highlight ? 'var(--accent)' : undefined }}>
      <div className="row wrap">
        <span className={`tag ${SEVERITY_TAG[e.severity]}`}>{SEVERITY_LABEL[e.severity]}</span>
        <span className="tag">{CATEGORY_LABEL[e.category]}</span>
        <span className="muted small">{seasonLabel(e.season)} · {new Date(e.at).toLocaleDateString('pt-BR')}</span>
        <div className="spacer" />
        <button className="btn icon sm ghost" onClick={() => deleteEvent(e.id)} aria-label="Apagar evento"><IconTrash /></button>
      </div>
      <h2 style={{ margin: 0, textDecoration: e.done ? 'line-through' : undefined }}>{e.title}</h2>
      <p style={{ margin: 0 }}>{e.text}</p>
      {e.playerIds.length > 0 && (
        <div className="row wrap small">
          {e.playerIds.map((id) => {
            const v = byId.get(id);
            return v ? <Link key={id} className="chip" to={`/jogador/${id}`}>{v.p.name}</Link> : null;
          })}
        </div>
      )}
      <div className="row wrap">
        <label className="row small"><input type="checkbox" checked={e.done} onChange={(ev) => updateEvent(e.id, { done: ev.target.checked })} /> Cumprido</label>
        <div className="spacer" />
        {e.budgetDelta != null && (
          <button className={`btn sm${e.budgetApplied ? ' on' : ''}`} onClick={() => applyEventBudget(e.id)}>
            {e.budgetApplied ? 'Orçamento ajustado ✓' : `Aplicar ${e.budgetDelta > 0 ? '+' : '−'}${formatMoney(Math.abs(e.budgetDelta))} no orçamento`}
          </button>
        )}
      </div>
    </div>
  );
}

export function EventsTab() {
  const save = useActiveSave()!;
  const squad = useSquadViews();
  const { views } = useAllViews();
  const { addEvent, updateSave } = useApp();
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [rolled, setRolled] = useState(false);
  const mode = save.eventMode ?? 'normal';
  const events = save.events ?? [];
  const pending = events.filter((e) => !e.done).length;

  const market = useMemo(() => {
    const ids = new Set(save.squad);
    const gender = squad[0]?.p.gender ?? 'M';
    return views.filter((v) => !ids.has(v.p.id) && v.p.gender === gender);
  }, [views, save.squad, squad]);

  const roll = () => {
    const e = rollEvent(
      { squad, market, budget: Math.max(0, save.budget), teamLevel: summarize(squad).bestXiRating || 70 },
      Math.random,
      { mode, categories },
    );
    addEvent(e);
    setRolled(true); // o mais novo fica no topo e ganha destaque
  };

  const toggleCat = (c: EventCategory) => setCategories((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));

  return (
    <div className="stack">
      <div className="card stack">
        <div>
          <h2 style={{ margin: 0 }}>Eventos aleatórios</h2>
          <p className="muted small" style={{ margin: '4px 0 0' }}>
            Deixe a carreira mais imprevisível: sorteie um evento a cada mês do jogo (ou antes de cada janela) e cumpra o que ele mandar.
          </p>
        </div>
        <div className="field"><span>Intensidade</span>
          <div className="chips">
            {MODES.map((m) => (
              <button key={m.key} className={`chip${mode === m.key ? ' on' : ''}`} onClick={() => updateSave({ eventMode: m.key })} title={m.desc}>{m.label}</button>
            ))}
          </div>
        </div>
        <div className="field"><span>Só destes tipos (opcional)</span>
          <div className="chips">
            {(Object.keys(CATEGORY_LABEL) as EventCategory[]).map((c) => (
              <button key={c} className={`chip${categories.includes(c) ? ' on' : ''}`} onClick={() => toggleCat(c)}>{CATEGORY_LABEL[c]}</button>
            ))}
          </div>
        </div>
        <button className="btn primary" style={{ minHeight: 52, fontSize: '1.05rem' }} onClick={roll}>🎲 Sortear evento</button>
      </div>

      {events.length === 0 ? (
        <Empty>Nenhum evento sorteado ainda.</Empty>
      ) : (
        <>
          <h3>Histórico ({pending} pendente{pending === 1 ? '' : 's'})</h3>
          {events.map((e, i) => <EventCard key={e.id} e={e} highlight={i === 0 && rolled} />)}
        </>
      )}
    </div>
  );
}
