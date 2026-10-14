import { useState } from 'react';
import { NavLink, Navigate, useParams } from 'react-router-dom';
import { IconPlus, IconTrash } from '../components/icons';
import { Img } from '../components/ui';
import { seasonLabel } from '../lib/age';
import { formatMoney } from '../lib/estimates';
import { useActiveSave, useApp } from '../store/app';
import { useDb } from '../store/data';
import { EventsTab } from './save/EventsTab';
import { EvolutionTab } from './save/EvolutionTab';
import { LineupTab } from './save/LineupTab';
import { NewSave } from './save/NewSave';
import { SquadTab } from './save/SquadTab';
import { TransfersTab } from './save/TransfersTab';
import { WatchTab } from './save/WatchTab';

const TABS = [
  { key: 'elenco', label: 'Elenco', el: <SquadTab /> },
  { key: 'escalacao', label: 'Escalação', el: <LineupTab /> },
  { key: 'alvos', label: 'Alvos', el: <WatchTab /> },
  { key: 'transferencias', label: 'Transferências', el: <TransfersTab /> },
  { key: 'evolucao', label: 'Evolução', el: <EvolutionTab /> },
  { key: 'eventos', label: 'Eventos', el: <EventsTab /> },
];

export function SavePage() {
  const { tab } = useParams();
  const db = useDb();
  const save = useActiveSave();
  const saves = useApp((s) => s.saves);
  const setActiveSave = useApp((s) => s.setActiveSave);
  const deleteSave = useApp((s) => s.deleteSave);
  const [creating, setCreating] = useState(false);

  if (!save || creating) {
    return (
      <div className="stack">
        {creating && saves.length > 0 && (
          <button className="btn sm ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setCreating(false)}>← Voltar ao save</button>
        )}
        <NewSave onDone={() => setCreating(false)} />
      </div>
    );
  }

  const current = TABS.find((t) => t.key === tab);
  if (!current) return <Navigate to="/save/elenco" replace />;
  const team = db.teams.find((t) => t.id === save.teamId);
  const pendingEvents = (save.events ?? []).filter((e) => !e.done).length;

  return (
    <div>
      <div className="page-head">
        <div className="row" style={{ gap: 10 }}>
          <Img className="crest lg" src={team?.crest ?? ''} />
          <div>
            <h1>{save.name}</h1>
            <div className="sub">Temporada {seasonLabel(save.season)} · Orçamento {formatMoney(save.budget)}</div>
          </div>
        </div>
        <div className="row">
          {saves.length > 1 && (
            <select className="select" style={{ width: 'auto', minHeight: 32 }} value={save.id} onChange={(e) => setActiveSave(e.target.value)}>
              {saves.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button className="btn icon sm" title="Novo save" onClick={() => setCreating(true)}><IconPlus /></button>
          <button
            className="btn icon sm danger"
            title="Apagar save"
            onClick={() => confirm(`Apagar o save "${save.name}"? Isso não pode ser desfeito.`) && deleteSave(save.id)}
          >
            <IconTrash />
          </button>
        </div>
      </div>

      <nav className="tabs">
        {TABS.map((t) => (
          <NavLink key={t.key} to={`/save/${t.key}`}>
            {t.label}
            {t.key === 'alvos' && save.watch.length > 0 && ` (${save.watch.length})`}
            {t.key === 'eventos' && pendingEvents > 0 && ` (${pendingEvents})`}
          </NavLink>
        ))}
      </nav>
      {current.el}
    </div>
  );
}
