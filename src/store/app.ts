import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BASE_SEASON } from '../lib/age';
import type { RolledEvent } from '../lib/events';
import { DEFAULT_FILTER, type PlayerFilter } from '../lib/filters';
import type { PlayerOverride, PlayerView } from '../lib/types';

export type WatchStatus = 'observando' | 'negociando' | 'contratado' | 'descartado';

export const WATCH_STATUS_LABEL: Record<WatchStatus, string> = {
  observando: 'Observando',
  negociando: 'Negociando',
  contratado: 'Contratado',
  descartado: 'Descartado',
};

export interface WatchItem {
  playerId: number;
  status: WatchStatus;
  note: string;
  askingPrice?: number;
  addedAt: string;
}

export type TransferKind = 'compra' | 'emprestimo_entrada' | 'venda' | 'emprestimo_saida' | 'liberado';

export const TRANSFER_LABEL: Record<TransferKind, string> = {
  compra: 'Compra',
  emprestimo_entrada: 'Empréstimo (chegada)',
  venda: 'Venda',
  emprestimo_saida: 'Empréstimo (saída)',
  liberado: 'Rescisão / liberado',
};

export const isIncoming = (k: TransferKind) => k === 'compra' || k === 'emprestimo_entrada';

export interface Transfer {
  id: string;
  playerId: number;
  kind: TransferKind;
  fee: number;
  season: number;
  at: string;
}

export interface Snapshot {
  label: string;
  season: number;
  players: Record<number, { ovr: number; pot: number; value: number }>;
}

export interface EventLog extends RolledEvent {
  id: string;
  season: number;
  at: string;
  done: boolean;
  budgetApplied: boolean;
}

export interface Save {
  id: string;
  name: string;
  teamId: number; // id EA do clube (estável entre atualizações da base)
  startSeason: number;
  season: number;
  budget: number;
  squad: number[];
  overrides: Record<number, PlayerOverride>;
  watch: WatchItem[];
  transfers: Transfer[];
  history: Snapshot[];
  formation: string;
  lineup: (number | null)[];
  events?: EventLog[]; // opcional: saves criados antes dos eventos não têm o campo
  eventMode?: 'leve' | 'normal' | 'caos';
  createdAt: string;
}

interface AppState {
  saves: Save[];
  activeSaveId: string | null;
  compare: number[];
  filter: PlayerFilter;

  setFilter: (f: PlayerFilter) => void;
  toggleCompare: (id: number) => void;
  clearCompare: () => void;

  createSave: (input: { name: string; teamId: number; budget: number; squad: number[]; startSnapshot: Snapshot['players'] }) => string;
  deleteSave: (id: string) => void;
  setActiveSave: (id: string | null) => void;
  updateSave: (patch: Partial<Save>) => void;

  setOverride: (playerId: number, patch: PlayerOverride | null) => void;
  addToSquad: (playerId: number) => void;
  removeFromSquad: (playerId: number) => void;

  toggleWatch: (playerId: number) => void;
  updateWatch: (playerId: number, patch: Partial<WatchItem>) => void;

  recordTransfer: (t: { playerId: number; kind: TransferKind; fee: number }) => void;
  undoTransfer: (transferId: string) => void;

  closeSeason: (squadViews: PlayerView[]) => void;

  addEvent: (e: RolledEvent) => void;
  updateEvent: (id: string, patch: Partial<Pick<EventLog, 'done'>>) => void;
  applyEventBudget: (id: string) => void;
  deleteEvent: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function snapshotOf(views: PlayerView[]): Snapshot['players'] {
  return Object.fromEntries(views.map((v) => [v.p.id, { ovr: v.ovr, pot: v.pot, value: v.value }]));
}

export const useApp = create<AppState>()(
  persist(
    (set) => {
      /** Aplica uma alteração no save ativo. */
      const patchActive = (fn: (s: Save) => Partial<Save>) =>
        set((st) => ({
          saves: st.saves.map((s) => (s.id === st.activeSaveId ? { ...s, ...fn(s) } : s)),
        }));

      return {
        saves: [],
        activeSaveId: null,
        compare: [],
        filter: DEFAULT_FILTER,

        setFilter: (filter) => set({ filter }),
        toggleCompare: (id) =>
          set((st) => ({
            compare: st.compare.includes(id) ? st.compare.filter((x) => x !== id) : [...st.compare, id].slice(-3),
          })),
        clearCompare: () => set({ compare: [] }),

        createSave: ({ name, teamId, budget, squad, startSnapshot }) => {
          const id = uid();
          const save: Save = {
            id,
            name,
            teamId,
            startSeason: BASE_SEASON,
            season: BASE_SEASON,
            budget,
            squad,
            overrides: {},
            watch: [],
            transfers: [],
            history: [{ label: 'Início', season: BASE_SEASON, players: startSnapshot }],
            formation: '4-3-3',
            lineup: [],
            createdAt: new Date().toISOString(),
          };
          set((st) => ({ saves: [...st.saves, save], activeSaveId: id }));
          return id;
        },
        deleteSave: (id) =>
          set((st) => ({
            saves: st.saves.filter((s) => s.id !== id),
            activeSaveId: st.activeSaveId === id ? (st.saves.find((s) => s.id !== id)?.id ?? null) : st.activeSaveId,
          })),
        setActiveSave: (id) => set({ activeSaveId: id }),
        updateSave: (patch) => patchActive(() => patch),

        setOverride: (playerId, patch) =>
          patchActive((s) => {
            const overrides = { ...s.overrides };
            if (patch === null) delete overrides[playerId];
            else {
              const merged = { ...overrides[playerId], ...patch };
              for (const k of Object.keys(merged) as (keyof PlayerOverride)[]) if (merged[k] == null) delete merged[k];
              if (Object.keys(merged).length) overrides[playerId] = merged;
              else delete overrides[playerId];
            }
            return { overrides };
          }),
        addToSquad: (playerId) =>
          patchActive((s) => (s.squad.includes(playerId) ? {} : { squad: [...s.squad, playerId] })),
        removeFromSquad: (playerId) =>
          patchActive((s) => ({
            squad: s.squad.filter((x) => x !== playerId),
            lineup: s.lineup.map((x) => (x === playerId ? null : x)),
          })),

        toggleWatch: (playerId) =>
          patchActive((s) => ({
            watch: s.watch.some((w) => w.playerId === playerId)
              ? s.watch.filter((w) => w.playerId !== playerId)
              : [...s.watch, { playerId, status: 'observando', note: '', addedAt: new Date().toISOString() }],
          })),
        updateWatch: (playerId, patch) =>
          patchActive((s) => ({ watch: s.watch.map((w) => (w.playerId === playerId ? { ...w, ...patch } : w)) })),

        recordTransfer: ({ playerId, kind, fee }) =>
          patchActive((s) => {
            const t: Transfer = { id: uid(), playerId, kind, fee, season: s.season, at: new Date().toISOString() };
            const incoming = isIncoming(kind);
            return {
              transfers: [t, ...s.transfers],
              budget: s.budget + (incoming ? -fee : fee),
              squad: incoming
                ? s.squad.includes(playerId) ? s.squad : [...s.squad, playerId]
                : s.squad.filter((x) => x !== playerId),
              lineup: incoming ? s.lineup : s.lineup.map((x) => (x === playerId ? null : x)),
              watch: incoming
                ? s.watch.map((w) => (w.playerId === playerId ? { ...w, status: 'contratado' as const } : w))
                : s.watch,
            };
          }),
        undoTransfer: (transferId) =>
          patchActive((s) => {
            const t = s.transfers.find((x) => x.id === transferId);
            if (!t) return {};
            const incoming = isIncoming(t.kind);
            return {
              transfers: s.transfers.filter((x) => x.id !== transferId),
              budget: s.budget + (incoming ? t.fee : -t.fee),
              squad: incoming
                ? s.squad.filter((x) => x !== t.playerId)
                : s.squad.includes(t.playerId) ? s.squad : [...s.squad, t.playerId],
            };
          }),

        closeSeason: (squadViews) =>
          patchActive((s) => ({
            history: [
              ...s.history,
              { label: `Fim ${String(s.season).slice(2)}/${String(s.season + 1).slice(2)}`, season: s.season, players: snapshotOf(squadViews) },
            ],
            season: s.season + 1,
          })),

        addEvent: (e) =>
          patchActive((s) => ({
            events: [{ ...e, id: uid(), season: s.season, at: new Date().toISOString(), done: false, budgetApplied: false }, ...(s.events ?? [])],
          })),
        updateEvent: (id, patch) =>
          patchActive((s) => ({ events: (s.events ?? []).map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
        applyEventBudget: (id) =>
          patchActive((s) => {
            const ev = (s.events ?? []).find((e) => e.id === id);
            if (!ev?.budgetDelta) return {};
            // aplicar de novo desfaz (botão funciona como liga/desliga)
            const sign = ev.budgetApplied ? -1 : 1;
            return {
              budget: s.budget + sign * ev.budgetDelta,
              events: (s.events ?? []).map((e) => (e.id === id ? { ...e, budgetApplied: !e.budgetApplied } : e)),
            };
          }),
        deleteEvent: (id) =>
          patchActive((s) => {
            const ev = (s.events ?? []).find((e) => e.id === id);
            return {
              budget: ev?.budgetApplied && ev.budgetDelta ? s.budget - ev.budgetDelta : s.budget,
              events: (s.events ?? []).filter((e) => e.id !== id),
            };
          }),
      };
    },
    {
      name: 'fc27-carreira',
      version: 1,
      // a lista de comparação e o filtro também persistem, para o app abrir onde você parou
      partialize: (st) => ({ saves: st.saves, activeSaveId: st.activeSaveId, compare: st.compare, filter: st.filter }),
    },
  ),
);

export function useActiveSave(): Save | null {
  return useApp((st) => st.saves.find((s) => s.id === st.activeSaveId) ?? null);
}
