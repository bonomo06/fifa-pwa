import { useState } from 'react';

// Paleta categórica validada (dataviz validate_palette, modo escuro, superfície #152233,
// todos os pares): no máximo 3 séries por gráfico.
export const SERIES_COLORS = ['#3987e5', '#d95926', '#199e70'];

export interface RadarSeries {
  name: string;
  values: number[]; // 0-99, mesma ordem de axes
}

export function RadarChart({ axes, series }: { axes: string[]; series: RadarSeries[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const size = 300;
  const c = size / 2;
  const r = size / 2 - 36;
  const n = axes.length;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [c + Math.cos(a) * r * (v / 100), c + Math.sin(a) * r * (v / 100)] as const;
  };
  const ring = (v: number) => axes.map((_, i) => pt(i, v).join(',')).join(' ');

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Radar: ${series.map((s) => s.name).join(' x ')}`} style={{ maxWidth: 360, margin: '0 auto' }}>
        {[25, 50, 75, 100].map((v) => (
          <polygon key={v} points={ring(v)} fill="none" stroke="var(--line)" strokeWidth={1} />
        ))}
        {axes.map((a, i) => {
          const [x, y] = pt(i, 100);
          const [lx, ly] = pt(i, 118);
          return (
            <g key={a}>
              <line x1={c} y1={c} x2={x} y2={y} stroke="var(--line)" strokeWidth={1} />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" style={{ fontWeight: 700 }}>{a}</text>
            </g>
          );
        })}
        {series.map((s, si) => (
          <g key={si} opacity={hover == null || hover === si ? 1 : 0.25} onMouseEnter={() => setHover(si)} onMouseLeave={() => setHover(null)}>
            <polygon
              points={s.values.map((v, i) => pt(i, v).join(',')).join(' ')}
              fill={SERIES_COLORS[si]}
              fillOpacity={0.14}
              stroke={SERIES_COLORS[si]}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            {s.values.map((v, i) => {
              const [x, y] = pt(i, v);
              return (
                <circle key={i} cx={x} cy={y} r={4} fill={SERIES_COLORS[si]} stroke="var(--card)" strokeWidth={2}>
                  <title>{`${s.name} — ${axes[i]}: ${v}`}</title>
                </circle>
              );
            })}
          </g>
        ))}
      </svg>
      {series.length > 1 && (
        <div className="legend" style={{ justifyContent: 'center' }}>
          {series.map((s, i) => (
            <span key={i}><i style={{ background: SERIES_COLORS[i] }} />{s.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export interface LineSeries {
  name: string;
  points: (number | null)[]; // um valor por rótulo de x (null = sem dado)
}

export function LineChart({ labels, series, unit = '' }: { labels: string[]; series: LineSeries[]; unit?: string }) {
  const [hoverX, setHoverX] = useState<number | null>(null);
  // viewBox estreito: no celular o SVG encolhe pouco e o texto continua legível
  const W = 400;
  const H = 230;
  const pad = { l: 30, r: 78, t: 12, b: 28 };
  const all = series.flatMap((s) => s.points.filter((v): v is number => v != null));
  if (!all.length) return null;
  const min = Math.floor(Math.min(...all) - 2);
  const max = Math.ceil(Math.max(...all) + 2);
  const x = (i: number) => pad.l + (labels.length === 1 ? (W - pad.l - pad.r) / 2 : (i * (W - pad.l - pad.r)) / (labels.length - 1));
  const y = (v: number) => pad.t + ((max - v) * (H - pad.t - pad.b)) / (max - min || 1);
  const ticks = Array.from({ length: 5 }, (_, i) => Math.round(min + ((max - min) * i) / 4));

  // rótulos no fim de cada linha, empurrados para não se sobreporem
  const endLabels = series
    .map((s, si) => {
      const last = s.points.reduce<number>((li, v, i) => (v != null ? i : li), -1);
      return last < 0 ? null : { si, x: x(last) + 8, y: y(s.points[last]!) };
    })
    .filter((l): l is { si: number; x: number; y: number } => !!l)
    .sort((p, q) => p.y - q.y);
  for (let i = 1; i < endLabels.length; i++) {
    endLabels[i].y = Math.max(endLabels[i].y, endLabels[i - 1].y + 13);
  }

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Evolução: ${series.map((s) => s.name).join(', ')}`} onMouseLeave={() => setHoverX(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
            <text x={pad.l - 6} y={y(t)} textAnchor="end" dominantBaseline="middle">{t}</text>
          </g>
        ))}
        {labels.map((l, i) => (
          <text key={i} x={x(i)} y={H - 10} textAnchor="middle">{l}</text>
        ))}
        {hoverX != null && <line x1={x(hoverX)} x2={x(hoverX)} y1={pad.t} y2={H - pad.b} stroke="var(--muted)" strokeDasharray="3 3" />}
        {series.map((s, si) => {
          const pts = s.points.map((v, i) => (v == null ? null : ([x(i), y(v)] as const)));
          const path = pts.reduce((acc, p, i) => (p ? acc + `${acc && pts[i - 1] ? 'L' : 'M'}${p[0]},${p[1]}` : acc), '');
          return (
            <g key={si}>
              <path d={path} fill="none" stroke={SERIES_COLORS[si]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((p, i) => p && (
                <circle key={i} cx={p[0]} cy={p[1]} r={hoverX === i ? 5 : 4} fill={SERIES_COLORS[si]} stroke="var(--card)" strokeWidth={2} />
              ))}
            </g>
          );
        })}
        {endLabels.map((l) => (
          <text key={l.si} x={l.x} y={l.y} dominantBaseline="middle" style={{ fill: 'var(--text)', fontWeight: 600 }}>
            {series[l.si].name.length > 12 ? series[l.si].name.slice(0, 11) + '…' : series[l.si].name}
          </text>
        ))}
        {/* faixas invisíveis de hover por coluna */}
        {labels.map((_, i) => (
          <rect key={i} x={x(i) - 20} y={0} width={40} height={H} fill="transparent" onMouseEnter={() => setHoverX(i)} onClick={() => setHoverX(i)} />
        ))}
      </svg>
      {hoverX != null && (
        <div className="card tight small" style={{ marginTop: 6 }}>
          <b>{labels[hoverX]}</b>
          {series.map((s, si) => (
            <div key={si} className="row"><i style={{ width: 10, height: 10, borderRadius: 2, background: SERIES_COLORS[si], display: 'inline-block' }} />{s.name}: <b>{s.points[hoverX] ?? '—'}{unit}</b></div>
          ))}
        </div>
      )}
      {series.length > 1 && (
        <div className="legend mt">
          {series.map((s, i) => <span key={i}><i style={{ background: SERIES_COLORS[i] }} />{s.name}</span>)}
        </div>
      )}
    </div>
  );
}
