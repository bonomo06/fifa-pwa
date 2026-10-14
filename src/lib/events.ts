import { formatMoney } from './estimates';
import { FORMATIONS } from './lineup';
import { POSITION_LABEL } from './positions';
import type { PlayerView } from './types';

export type EventCategory = 'lesao' | 'diretoria' | 'elenco' | 'mercado' | 'torcida' | 'tatica';
export type EventSeverity = 'bom' | 'neutro' | 'ruim';

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  lesao: 'Lesão', diretoria: 'Diretoria', elenco: 'Vestiário', mercado: 'Mercado', torcida: 'Torcida & mídia', tatica: 'Tática',
};

export interface EventContext {
  squad: PlayerView[];
  /** jogadores de fora do clube, para oportunidades de mercado */
  market: PlayerView[];
  budget: number;
  teamLevel: number;
}

export interface RolledEvent {
  defId: string;
  title: string;
  text: string;
  category: EventCategory;
  severity: EventSeverity;
  playerIds: number[];
  budgetDelta?: number;
}

type Rng = () => number;

interface EventDef {
  id: string;
  category: EventCategory;
  severity: EventSeverity;
  weight: number;
  /** null = evento não se aplica neste contexto (ex.: sem jovens no elenco) */
  build: (ctx: EventContext, rng: Rng) => Omit<RolledEvent, 'defId' | 'category' | 'severity'> | null;
}

const pick = <T,>(list: T[], rng: Rng): T | undefined => list[Math.floor(rng() * list.length)];
const between = (min: number, max: number, rng: Rng) => min + Math.floor(rng() * (max - min + 1));
const byOvr = (l: PlayerView[]) => [...l].sort((a, b) => b.ovr - a.ovr);
const starters = (ctx: EventContext) => byOvr(ctx.squad).slice(0, 14);
const reserves = (ctx: EventContext) => byOvr(ctx.squad).slice(14);
const young = (ctx: EventContext) => ctx.squad.filter((v) => v.age <= 21);
const old = (ctx: EventContext) => ctx.squad.filter((v) => v.age >= 31);
const nm = (v: PlayerView) => `${v.p.name} (${POSITION_LABEL[v.p.pos]}, ${v.ovr})`;

const EVENTS: EventDef[] = [
  // ---------- lesões ----------
  { id: 'lesao-grave', category: 'lesao', severity: 'ruim', weight: 5, build: (ctx, rng) => {
    const v = pick(starters(ctx), rng); if (!v) return null;
    const m = between(2, 5, rng);
    return { title: 'Lesão grave', text: `${nm(v)} rompeu um ligamento e está fora por ${m} meses. Não escale o jogador até lá (no jogo, simule como se ele não existisse).`, playerIds: [v.p.id] };
  } },
  { id: 'lesao-leve', category: 'lesao', severity: 'ruim', weight: 8, build: (ctx, rng) => {
    const v = pick(starters(ctx), rng); if (!v) return null;
    const j = between(2, 5, rng);
    return { title: 'Lesão muscular', text: `${nm(v)} sentiu a coxa no treino e desfalca os próximos ${j} jogos.`, playerIds: [v.p.id] };
  } },
  { id: 'surto-lesoes', category: 'lesao', severity: 'ruim', weight: 3, build: (ctx, rng) => {
    const pool = starters(ctx);
    if (pool.length < 4) return null;
    const a = pick(pool, rng)!;
    const b = pick(pool.filter((x) => x !== a), rng)!;
    return { title: 'Surto de lesões', text: `Virose no CT: ${a.p.name} e ${b.p.name} estão fora dos próximos 3 jogos.`, playerIds: [a.p.id, b.p.id] };
  } },
  // ---------- diretoria ----------
  { id: 'corte-orcamento', category: 'diretoria', severity: 'ruim', weight: 4, build: (ctx, rng) => {
    const pct = between(10, 30, rng);
    const delta = -Math.round((ctx.budget * pct) / 100);
    if (!delta) return null;
    return { title: 'Corte de orçamento', text: `A diretoria cortou ${pct}% da verba de transferências (${formatMoney(-delta)}). No jogo, ignore esse dinheiro até o fim da temporada.`, playerIds: [], budgetDelta: delta };
  } },
  { id: 'novo-investidor', category: 'diretoria', severity: 'bom', weight: 3, build: (ctx, rng) => {
    const pct = between(10, 40, rng);
    const delta = Math.max(1_000_000, Math.round((ctx.budget * pct) / 100));
    return { title: 'Novo investidor', text: `Um investidor entrou no clube: +${formatMoney(delta)} para transferências. (No jogo, considere que você pode gastar esse valor a mais.)`, playerIds: [], budgetDelta: delta };
  } },
  { id: 'exige-venda', category: 'diretoria', severity: 'ruim', weight: 4, build: (ctx, rng) => {
    const v = pick(byOvr(ctx.squad).slice(0, 5), rng); if (!v) return null;
    return { title: 'Diretoria exige uma venda', text: `Para equilibrar as contas, ${nm(v)} precisa ser vendido até o fim da próxima janela, por pelo menos ${formatMoney(Math.round(v.value * 0.8))}.`, playerIds: [v.p.id] };
  } },
  { id: 'politica-jovens', category: 'diretoria', severity: 'neutro', weight: 4, build: () => (
    { title: 'Política de jovens', text: 'A diretoria decidiu: as próximas 2 contratações precisam ter 21 anos ou menos.', playerIds: [] }
  ) },
  { id: 'mercado-fechado', category: 'diretoria', severity: 'ruim', weight: 2, build: () => (
    { title: 'Transfer ban', text: 'Punição da federação: você não pode contratar ninguém na próxima janela (vendas liberadas).', playerIds: [] }
  ) },
  { id: 'teto-gasto', category: 'diretoria', severity: 'neutro', weight: 3, build: (ctx, rng) => {
    const cap = Math.max(500_000, Math.round((ctx.budget * between(15, 35, rng)) / 100));
    return { title: 'Teto por contratação', text: `Nenhuma contratação desta janela pode custar mais de ${formatMoney(cap)}.`, playerIds: [] };
  } },
  { id: 'reforco-liga', category: 'diretoria', severity: 'neutro', weight: 2, build: () => (
    { title: 'Mercado interno', text: 'A próxima contratação precisa vir de um clube da sua própria liga.', playerIds: [] }
  ) },
  // ---------- vestiário ----------
  { id: 'pede-saida', category: 'elenco', severity: 'ruim', weight: 5, build: (ctx, rng) => {
    const v = pick(byOvr(ctx.squad).slice(0, 18), rng); if (!v) return null;
    return { title: 'Jogador pede para sair', text: `${nm(v)} quer jogar em outro clube. Venda-o nesta janela ou deixe-o fora dos próximos 5 jogos.`, playerIds: [v.p.id] };
  } },
  { id: 'indisciplina', category: 'elenco', severity: 'ruim', weight: 4, build: (ctx, rng) => {
    const v = pick(ctx.squad, rng); if (!v) return null;
    return { title: 'Problema disciplinar', text: `${nm(v)} chegou atrasado e brigou no treino: suspenso internamente por 3 jogos.`, playerIds: [v.p.id] };
  } },
  { id: 'grande-fase', category: 'elenco', severity: 'bom', weight: 5, build: (ctx, rng) => {
    const v = pick(ctx.squad, rng); if (!v) return null;
    return { title: 'Em grande fase', text: `${nm(v)} está voando nos treinos. Ele deve ser titular nos próximos 5 jogos.`, playerIds: [v.p.id] };
  } },
  { id: 'saudade', category: 'elenco', severity: 'neutro', weight: 3, build: (ctx, rng) => {
    const v = pick(ctx.squad.filter((x) => x.age >= 20), rng); if (!v) return null;
    return { title: 'Saudade de casa', text: `${nm(v)} está com saudade da família. Empreste-o por uma temporada ou ele perde moral (fique 3 jogos sem escalá-lo).`, playerIds: [v.p.id] };
  } },
  { id: 'aposentadoria', category: 'elenco', severity: 'neutro', weight: 3, build: (ctx, rng) => {
    const v = pick(old(ctx), rng); if (!v) return null;
    return { title: 'Anúncio de aposentadoria', text: `${nm(v)}, ${v.age} anos, vai se aposentar ao fim da temporada. Planeje o substituto (ou venda agora).`, playerIds: [v.p.id] };
  } },
  { id: 'promessa-base', category: 'elenco', severity: 'bom', weight: 3, build: () => (
    { title: 'Joia da base', text: 'Os olheiros da base acharam um talento: promova o melhor jovem da base e dê a ele 5 jogos como titular.', playerIds: [] }
  ) },
  { id: 'capitao', category: 'elenco', severity: 'neutro', weight: 2, build: (ctx, rng) => {
    const v = pick(byOvr(ctx.squad).slice(0, 11), rng); if (!v) return null;
    return { title: 'Novo capitão', text: `O vestiário escolheu ${v.p.name} como capitão. Ele não pode ficar no banco enquanto estiver saudável.`, playerIds: [v.p.id] };
  } },
  // ---------- mercado ----------
  { id: 'proposta-irrecusavel', category: 'mercado', severity: 'neutro', weight: 4, build: (ctx, rng) => {
    const v = pick(byOvr(ctx.squad).slice(0, 8), rng); if (!v) return null;
    const offer = Math.round((v.value * between(130, 180, rng)) / 100 / 100_000) * 100_000;
    return { title: 'Proposta irrecusável', text: `Um gigante oferece ${formatMoney(offer)} por ${nm(v)}. Aceite (venda no jogo pelo valor mais próximo possível) ou recuse e perca 5% do orçamento em multa com a diretoria.`, playerIds: [v.p.id] };
  } },
  { id: 'assedio-jovem', category: 'mercado', severity: 'neutro', weight: 3, build: (ctx, rng) => {
    const v = pick(young(ctx), rng); if (!v) return null;
    return { title: 'Rival de olho na sua joia', text: `Um rival quer ${nm(v)} e ofereceu ${formatMoney(Math.round(v.value * 1.25))}. Se recusar, dê a ele 3 jogos como titular para mantê-lo feliz.`, playerIds: [v.p.id] };
  } },
  { id: 'oportunidade', category: 'mercado', severity: 'bom', weight: 4, build: (ctx, rng) => {
    const pool = ctx.market.filter((v) => v.value <= ctx.budget && v.ovr >= ctx.teamLevel - 6 && v.ovr <= ctx.teamLevel + 4);
    const v = pick(pool, rng); if (!v) return null;
    return { title: 'Oportunidade de mercado', text: `O empresário de ${nm(v)} ofereceu o jogador por ~${formatMoney(Math.round(v.value * 0.8))}. Se quiser, tente contratá-lo nesta janela.`, playerIds: [v.p.id] };
  } },
  { id: 'veterano-barato', category: 'mercado', severity: 'bom', weight: 3, build: (ctx, rng) => {
    const pool = ctx.market.filter((v) => v.age >= 30 && v.ovr >= ctx.teamLevel - 3 && v.value <= ctx.budget);
    const v = pick(pool, rng); if (!v) return null;
    return { title: 'Veterano em fim de contrato', text: `${nm(v)}, ${v.age} anos, está livre no mercado por um preço camarada. Boa opção de experiência.`, playerIds: [v.p.id] };
  } },
  // ---------- torcida & mídia ----------
  { id: 'rodizio', category: 'torcida', severity: 'neutro', weight: 4, build: (ctx, rng) => {
    const pool = reserves(ctx);
    if (pool.length < 3) return null;
    const chosen = [...pool].sort(() => rng() - 0.5).slice(0, 3);
    return { title: 'Torcida pede chances', text: `A torcida quer ver ${chosen.map((v) => v.p.name).join(', ')} em campo: escale os três como titulares no próximo jogo.`, playerIds: chosen.map((v) => v.p.id) };
  } },
  { id: 'pressao', category: 'torcida', severity: 'ruim', weight: 3, build: () => (
    { title: 'Pressão por resultados', text: 'Faixas de protesto no CT: vença 2 dos próximos 3 jogos ou perca 10% do orçamento (registre manualmente se falhar).', playerIds: [] }
  ) },
  { id: 'goleiro-imprensa', category: 'torcida', severity: 'neutro', weight: 2, build: (ctx) => {
    const gks = byOvr(ctx.squad.filter((v) => v.p.pos === 'GK'));
    if (gks.length < 2) return null;
    return { title: 'Polêmica no gol', text: `A imprensa crucificou ${gks[0].p.name}. ${gks[1].p.name} será o titular nos próximos 2 jogos.`, playerIds: [gks[0].p.id, gks[1].p.id] };
  } },
  // ---------- tática ----------
  { id: 'formacao', category: 'tatica', severity: 'neutro', weight: 3, build: (_ctx, rng) => {
    const f = pick(Object.keys(FORMATIONS), rng)!;
    return { title: 'Ideia do auxiliar', text: `Seu auxiliar insiste: jogue no ${f} nos próximos 3 jogos.`, playerIds: [] };
  } },
  { id: 'semana-tranquila', category: 'tatica', severity: 'neutro', weight: 6, build: () => (
    { title: 'Semana tranquila', text: 'Nada de especial aconteceu. Siga o jogo!', playerIds: [] }
  ) },
];

export const EVENT_COUNT = EVENTS.length;

export interface RollOptions {
  /** 'normal' usa os pesos padrão; 'caos' dobra a chance de eventos ruins; 'leve' corta pela metade */
  mode?: 'leve' | 'normal' | 'caos';
  categories?: EventCategory[];
}

export function rollEvent(ctx: EventContext, rng: Rng = Math.random, opts: RollOptions = {}): RolledEvent {
  const factor = (d: EventDef) =>
    d.severity !== 'ruim' ? 1 : opts.mode === 'caos' ? 2 : opts.mode === 'leve' ? 0.5 : 1;
  let pool = EVENTS.filter((d) => !opts.categories?.length || opts.categories.includes(d.category));
  // tenta até achar um evento que se aplique ao elenco atual
  for (let attempt = 0; attempt < 30 && pool.length; attempt++) {
    const total = pool.reduce((s, d) => s + d.weight * factor(d), 0);
    let r = rng() * total;
    const def = pool.find((d) => (r -= d.weight * factor(d)) < 0) ?? pool[pool.length - 1];
    const built = def.build(ctx, rng);
    if (built) return { defId: def.id, category: def.category, severity: def.severity, ...built };
    pool = pool.filter((d) => d !== def);
  }
  return { defId: 'semana-tranquila', category: 'tatica', severity: 'neutro', title: 'Semana tranquila', text: 'Nada de especial aconteceu. Siga o jogo!', playerIds: [] };
}
