import { useEffect, useRef, useState, type ReactNode } from 'react';
import { avatarUrl } from '../lib/data';
import { formatMoney, parseMoney } from '../lib/estimates';
import { POSITION_GROUP, POSITION_LABEL } from '../lib/positions';
import type { Player, Position } from '../lib/types';
import { IconX } from './icons';

export function ratingClass(r: number): string {
  return r >= 90 ? 'r90' : r >= 85 ? 'r85' : r >= 80 ? 'r80' : r >= 75 ? 'r75' : r >= 70 ? 'r70' : 'r0';
}

export function Ovr({ value, large, title }: { value: number; large?: boolean; title?: string }) {
  return <span className={`ovr ${ratingClass(value)}${large ? ' lg' : ''}`} title={title}>{value}</span>;
}

export function Pos({ pos }: { pos: Position }) {
  return <span className={`pos ${POSITION_GROUP[pos] ?? ''}`} title={pos}>{POSITION_LABEL[pos] ?? pos}</span>;
}

export function Avatar({ p, large }: { p: Player; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const cls = `avatar${large ? ' lg' : ''}`;
  if (failed) {
    return <div className={`${cls} avatar-fallback`}>{(p.shortName[0] ?? '?').toUpperCase()}</div>;
  }
  return <img className={cls} src={avatarUrl(p.id)} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

export function Img({ src, className, title }: { src: string; className: string; title?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return <img className={className} src={src} alt="" title={title} loading="lazy" onError={() => setFailed(true)} />;
}

export function Money({ value, estimated }: { value: number; estimated?: boolean }) {
  return (
    <span className={estimated ? 'est' : undefined} title={estimated ? 'Valor estimado' : 'Valor informado por você'}>
      {estimated ? '~' : ''}{formatMoney(value)}
    </span>
  );
}

export function Sheet({ title, onClose, children }: { title: ReactNode; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="btn icon ghost" onClick={onClose} aria-label="Fechar"><IconX /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Campo de dinheiro que aceita "1,5 mi", "850k" etc. Vazio = undefined. Aplica enquanto digita. */
export function MoneyInput({ value, onChange, placeholder }: { value?: number; onChange: (v?: number) => void; placeholder?: string }) {
  const show = (v?: number) => (v != null ? formatMoney(v).replace('€', '') : '');
  const [text, setText] = useState(show(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(show(value));
  }, [value]);
  return (
    <input
      className="input"
      inputMode="decimal"
      value={text}
      placeholder={placeholder ?? 'ex: 12 mi, 850 mil'}
      onFocus={() => (focused.current = true)}
      onChange={(e) => {
        setText(e.target.value);
        if (!e.target.value.trim()) onChange(undefined);
        else {
          const v = parseMoney(e.target.value);
          if (v != null) onChange(v);
        }
      }}
      onBlur={() => {
        focused.current = false;
        setText(show(value));
      }}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  );
}

/** Campo numérico inteiro opcional (vazio = undefined). */
export function NumInput({ value, onChange, placeholder, min = 0, max = 99 }: {
  value?: number; onChange: (v?: number) => void; placeholder?: string; min?: number; max?: number;
}) {
  return (
    <input
      className="input"
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => {
        const n = e.target.value === '' ? undefined : Math.round(Number(e.target.value));
        onChange(n == null || Number.isNaN(n) ? undefined : n);
      }}
    />
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
