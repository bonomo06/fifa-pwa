import { create } from 'zustand';
import { loadDatabase } from '../lib/data';
import type { Database } from '../lib/types';

interface DataState {
  db: Database | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error?: string;
  load: () => Promise<void>;
}

export const useData = create<DataState>((set, get) => ({
  db: null,
  status: 'idle',
  async load() {
    if (get().status === 'loading' || get().status === 'ready') return;
    set({ status: 'loading', error: undefined });
    try {
      set({ db: await loadDatabase(), status: 'ready' });
    } catch (err) {
      set({ status: 'error', error: err instanceof Error ? err.message : String(err) });
    }
  },
}));

/** Base já carregada (o App só renderiza as telas depois que status === 'ready'). */
export function useDb(): Database {
  const db = useData((s) => s.db);
  if (!db) throw new Error('Base de jogadores ainda não carregada');
  return db;
}
