import { useMemo } from 'react';
import { BASE_SEASON } from '../lib/age';
import type { Database, PlayerOverride, PlayerView } from '../lib/types';
import { makeViews } from '../lib/views';
import { useActiveSave } from '../store/app';
import { useDb } from '../store/data';

interface ViewsCache {
  db: Database;
  season: number;
  overrides: Record<number, PlayerOverride> | undefined;
  views: PlayerView[];
  byId: Map<number, PlayerView>;
}

// Um cache só para o app inteiro: várias telas pedem as mesmas ~20 mil views.
let cache: ViewsCache | null = null;

function getViews(db: Database, season: number, overrides: Record<number, PlayerOverride> | undefined) {
  if (!cache || cache.db !== db || cache.season !== season || cache.overrides !== overrides) {
    const views = makeViews(db.players, { season, overrides });
    cache = { db, season, overrides, views, byId: new Map(views.map((v) => [v.p.id, v])) };
  }
  return cache;
}

/** Todas as views no contexto do save ativo (idade da temporada + correções). */
export function useAllViews(): { views: PlayerView[]; byId: Map<number, PlayerView> } {
  const db = useDb();
  const save = useActiveSave();
  const season = save?.season ?? BASE_SEASON;
  const overrides = save?.overrides;
  return useMemo(() => {
    const c = getViews(db, season, overrides);
    return { views: c.views, byId: c.byId };
  }, [db, season, overrides]);
}

export function useView(id: number): PlayerView | undefined {
  return useAllViews().byId.get(id);
}

export function useSquadViews(): PlayerView[] {
  const save = useActiveSave();
  const { byId } = useAllViews();
  return useMemo(
    () => (save?.squad ?? []).map((id) => byId.get(id)).filter((v): v is PlayerView => !!v),
    [save?.squad, byId],
  );
}
