import { useEffect, useState } from 'react';
import { PAY_NAME, type PayMethod } from '../../lib/data';

export function Head({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <p className="kicker" style={{ fontSize: 13, marginBottom: 6 }}>{kicker}</p>
        <h1 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 0.95 }}>{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

/** Ventana para registrar cómo pagó el cliente (renovar, destacar…) */
export function PayModal({
  title,
  amount,
  onClose,
  onConfirm,
}: {
  title: string;
  amount: number;
  onClose: () => void;
  onConfirm: (m: PayMethod) => void;
}) {
  const [m, setM] = useState<PayMethod>('yape');
  return (
    <Modal title={title} onClose={onClose}>
      <p style={{ fontSize: 16 }}>Registra cómo pagó el cliente <b>S/ {amount}.00</b>:</p>
      {(['yape', 'plin', 'efectivo', 'tarjeta', 'gratis'] as PayMethod[]).map((k) => (
        <label key={k} className="radio">
          <input type="radio" name="pm" checked={m === k} onChange={() => setM(k)} />
          {PAY_NAME[k]}
        </label>
      ))}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button type="button" className="btn-w" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn-y" onClick={() => onConfirm(m)} autoFocus>Confirmar</button>
      </div>
    </Modal>
  );
}

export function Stat({ k, v, tone = 'w', delay = 0 }: { k: string; v: string; tone?: 'w' | 'k' | 'y'; delay?: number }) {
  const bg = tone === 'k' ? '#111' : tone === 'y' ? 'var(--y)' : '#fff';
  return (
    <div className="stat" style={{ background: bg, color: tone === 'k' ? '#fff' : '#111', animationDelay: `${delay}s`, boxShadow: tone === 'y' ? '5px 5px 0 #111' : undefined }}>
      <span className="k" style={{ color: tone === 'k' ? 'var(--y)' : undefined }}>{k}</span>
      <span className="v" style={{ fontSize: 44 }}>{v}</span>
    </div>
  );
}

export function useCountUp(ms = 900) {
  const [k, setK] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return setK(1);
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const v = Math.min(1, (t - t0) / ms);
      setK(v);
      if (v < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return 1 - Math.pow(1 - k, 3);
}

export function Bars({ data, labels, height = 180, fmt = String }: { data: number[]; labels: string[]; height?: number; fmt?: (n: number) => string }) {
  const max = Math.max(1, ...data);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height, borderBottom: '3px solid #111' }}>
        {data.map((v, i) => (
          <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 6 }}>
            <span className="mono" style={{ textAlign: 'center', fontSize: 11, fontWeight: 700 }}>{fmt(v)}</span>
            <div className={`vbar ${v === max && v > 0 ? 'hi' : ''}`} style={{ height: `${Math.round((v / max) * 82)}%`, animationDelay: `${200 + i * 60}ms` }} title={`${labels[i]}: ${fmt(v)}`} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {labels.map((l, i) => <span key={i} className="mono" style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 700 }}>{l}</span>)}
      </div>
    </div>
  );
}
