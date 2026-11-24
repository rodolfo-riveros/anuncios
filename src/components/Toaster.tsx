import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

/** Muestra mensajes enviados con toast() desde cualquier isla */
export default function Toaster() {
  const [msg, setMsg] = useState('');
  const t = useRef<number>(undefined);
  useEffect(() => {
    const on = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      clearTimeout(t.current);
      t.current = window.setTimeout(() => setMsg(''), 2800);
    };
    window.addEventListener('pregon:toast', on);
    // mensaje pendiente tras una navegación
    const pending = sessionStorage.getItem('pregon:toast');
    if (pending) {
      sessionStorage.removeItem('pregon:toast');
      on(new CustomEvent('x', { detail: pending }));
    }
    return () => window.removeEventListener('pregon:toast', on);
  }, []);
  if (!msg) return <div role="status" aria-live="polite" className="sr" />;
  return (
    <div className="toast" role="status" aria-live="polite" key={msg}>
      <Icon name="check" size={20} stroke={3} style={{ color: 'var(--y)' }} />
      {msg}
    </div>
  );
}
