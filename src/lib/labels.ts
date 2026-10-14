import type { StatKey } from './types';

export const STAT_LABEL: Record<StatKey, string> = {
  pac: 'Ritmo', sho: 'Finalização', pas: 'Passe', dri: 'Drible', def: 'Defesa', phy: 'Físico',
  acceleration: 'Aceleração', sprintSpeed: 'Pique',
  positioning: 'Posicionamento', finishing: 'Finalização', shotPower: 'Força do chute', longShots: 'Chute de longe', volleys: 'Voleio', penalties: 'Pênaltis',
  vision: 'Visão', crossing: 'Cruzamento', freeKickAccuracy: 'Falta', shortPassing: 'Passe curto', longPassing: 'Passe longo', curve: 'Curva',
  agility: 'Agilidade', balance: 'Equilíbrio', reactions: 'Reação', ballControl: 'Controle de bola', dribbling: 'Drible', composure: 'Compostura',
  interceptions: 'Interceptação', headingAccuracy: 'Cabeceio', defensiveAwareness: 'Consciência defensiva', standingTackle: 'Desarme em pé', slidingTackle: 'Carrinho',
  jumping: 'Impulsão', stamina: 'Fôlego', strength: 'Força', aggression: 'Agressividade',
  gkDiving: 'Elasticidade', gkHandling: 'Manejo', gkKicking: 'Chute (GOL)', gkPositioning: 'Posicionamento (GOL)', gkReflexes: 'Reflexos',
};

export const FACE_STATS: StatKey[] = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];
export const FACE_SHORT: Record<string, string> = { pac: 'RIT', sho: 'FIN', pas: 'PAS', dri: 'DRI', def: 'DEF', phy: 'FIS' };
export const GK_FACE: StatKey[] = ['gkDiving', 'gkHandling', 'gkKicking', 'gkReflexes', 'acceleration', 'gkPositioning'];
export const GK_SHORT: Record<string, string> = { gkDiving: 'ELA', gkHandling: 'MAN', gkKicking: 'CHU', gkReflexes: 'REF', acceleration: 'VEL', gkPositioning: 'POS' };

export const STAT_GROUPS: { key: StatKey; title: string; stats: StatKey[] }[] = [
  { key: 'pac', title: 'Ritmo', stats: ['acceleration', 'sprintSpeed'] },
  { key: 'sho', title: 'Finalização', stats: ['positioning', 'finishing', 'shotPower', 'longShots', 'volleys', 'penalties'] },
  { key: 'pas', title: 'Passe', stats: ['vision', 'crossing', 'freeKickAccuracy', 'shortPassing', 'longPassing', 'curve'] },
  { key: 'dri', title: 'Drible', stats: ['agility', 'balance', 'reactions', 'ballControl', 'dribbling', 'composure'] },
  { key: 'def', title: 'Defesa', stats: ['interceptions', 'headingAccuracy', 'defensiveAwareness', 'standingTackle', 'slidingTackle'] },
  { key: 'phy', title: 'Físico', stats: ['jumping', 'stamina', 'strength', 'aggression'] },
];

export const GK_GROUP: StatKey[] = ['gkDiving', 'gkHandling', 'gkKicking', 'gkPositioning', 'gkReflexes'];

export function statColor(v: number): string {
  return v >= 85 ? '#22c55e' : v >= 75 ? '#84cc16' : v >= 65 ? '#eab308' : v >= 50 ? '#f59e0b' : '#ef4444';
}
