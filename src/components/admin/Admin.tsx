import { useEffect, useMemo, useRef, useState } from 'react';
import { DAY } from '../../lib/data';
import { daysLeft, fmtNum, liveStatus, timeAgo, url } from '../../lib/format';
import { startSimulation } from '../../lib/sim';
import { isAdmin, login, logout, renewAd, setSettings, toast, useStore } from '../../lib/store';
import Icon, { type IconName } from '../Icon';
import AdEditor from './AdEditor';
import { AdsAdmin, Payments, Reports, Requests, Settings } from './Sections';
import { Bars, Head, PayModal, Stat, useCountUp } from './ui';

export type Section = 'resumen' | 'solicitudes' | 'anuncios' | 'editar' | 'pagos' | 'reportes' | 'ajustes';

export interface Nav {
  go: (s: Section, params?: Record<string, string>) => void;
}

const MENU: [Section, string, IconName][] = [
  ['resumen', 'Resumen', 'todo'],
  ['solicitudes', 'Solicitudes', 'chat'],
  ['anuncios', 'Anuncios', 'list'],
  ['editar', 'Publicar nuevo', 'plus'],
  ['pagos', 'Pagos', 'card'],
  ['reportes', 'Reportes', 'flag'],
  ['ajustes', 'Ajustes', 'user'],
];

export default function Admin() {
  const [authed, setAuthed] = useState(isAdmin);
  return authed ? <Shell onLogout={() => { logout(); setAuthed(false); }} /> : <Login onOk={() => setAuthed(true)} />;
}

function Login({ onOk }: { onOk: () => void }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [bad, setBad] = useState(false);
  return (
    <div className="wrap" style={{ padding: '64px 16px 96px', display: 'flex', justifyContent: 'center' }}>
      <form
        className="box fadein"
        style={{ width: 'min(440px, 100%)', boxShadow: '10px 10px 0 #111', gap: 18 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (login(u, p)) onOk();
          else setBad(true);
        }}
      >
        <p className="kicker" style={{ fontSize: 13 }}>SOLO PARA EL PROPIETARIO</p>
        <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>Ingresar al panel</h1>
        <label className="fld">Usuario<input className={`inp ${bad ? 'bad' : ''}`} value={u} onChange={(e) => { setU(e.target.value); setBad(false); }} autoComplete="username" autoFocus /></label>
        <label className="fld">Contraseña<input className={`inp ${bad ? 'bad' : ''}`} type="password" value={p} onChange={(e) => { setP(e.target.value); setBad(false); }} autoComplete="current-password" /></label>
        {bad && <span className="err" role="alert">Usuario o contraseña incorrectos.</span>}
        <button type="submit" className="btn-y">Entrar</button>
        <p className="mono" style={{ fontSize: 11, color: '#666', lineHeight: 1.5 }}>
          DEMO: las credenciales de prueba están en src/lib/config.ts. Este acceso no es seguro hasta conectarlo a un servidor.
        </p>
      </form>
    </div>
  );
}

function readUrl() {
  const p = new URLSearchParams(location.search);
  return { s: (p.get('s') as Section) || 'resumen', id: p.get('id') ?? undefined, sol: p.get('sol') ?? undefined };
}

function Shell({ onLogout }: { onLogout: () => void }) {
  const [route, setRoute] = useState(readUrl);
  const requests = useStore((s) => s.requests);
  const reports = useStore((s) => s.reports);
  const simulate = useStore((s) => s.settings.simulate);

  const go: Nav['go'] = (s, params = {}) => {
    const q = new URLSearchParams({ ...(s === 'resumen' ? {} : { s }), ...params }).toString();
    history.pushState(null, '', location.pathname + (q ? '?' + q : ''));
    setRoute({ s, id: params.id, sol: params.sol });
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const onPop = () => setRoute(readUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (!simulate) return;
    return startSimulation();
  }, [simulate]);

  const badge: Partial<Record<Section, number>> = {
    solicitudes: requests.filter((r) => r.status === 'nueva').length,
    reportes: reports.filter((r) => !r.resolved).length,
  };

  return (
    <div className="wrap" style={{ paddingTop: 28, paddingBottom: 64 }}>
      <div className="shell">
        <nav className="side" aria-label="Administración">
          <p className="mono hide-m" style={{ fontSize: 12, fontWeight: 700, padding: '0 16px 6px', letterSpacing: '.08em' }}>PANEL DEL PROPIETARIO</p>
          {MENU.map(([k, l, ic]) => {
            const on = route.s === k && !(k === 'editar' && route.id);
            return (
              <button key={k} type="button" className={`nav ${on ? 'on' : ''}`} aria-current={on ? 'page' : undefined} onClick={() => go(k)}>
                <Icon name={ic} size={20} />
                {l}
                {!!badge[k] && <span className="hbadge">{badge[k]}</span>}
              </button>
            );
          })}
          <div style={{ borderTop: '3px solid #111', margin: '8px 0' }} className="hide-m" />
          <button type="button" className={`nav ${simulate ? 'on' : ''}`} onClick={() => { setSettings({ simulate: !simulate }); toast(simulate ? 'Simulación detenida' : 'Simulación en vivo activada'); }} title="Simula visitas, clics y solicitudes">
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: simulate ? '#25D366' : '#bbb', boxShadow: simulate ? '0 0 0 3px rgba(37,211,102,.35)' : 'none', flex: 'none' }} className={simulate ? 'ping-dot' : ''} />
            {simulate ? 'Simulación: ON' : 'Simulación: OFF'}
          </button>
          <a href={url('/')} className="nav" target="_blank" rel="noopener"><Icon name="eye" size={20} />Ver sitio</a>
          <button type="button" className="nav" onClick={onLogout}><Icon name="back" size={20} />Salir</button>
        </nav>
        <div className="content">
          {route.s === 'resumen' && <Summary go={go} />}
          {route.s === 'solicitudes' && <Requests go={go} />}
          {route.s === 'anuncios' && <AdsAdmin go={go} />}
          {route.s === 'editar' && <AdEditor key={`${route.id}-${route.sol}`} editId={route.id} requestId={route.sol} onExit={(to) => go(to)} />}
          {route.s === 'pagos' && <Payments />}
          {route.s === 'reportes' && <Reports go={go} />}
          {route.s === 'ajustes' && <Settings onLogout={onLogout} />}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Resumen ---------------- */

function Summary({ go }: Nav) {
  const ads = useStore((s) => s.ads);
  const requests = useStore((s) => s.requests);
  const reports = useStore((s) => s.reports);
  const payments = useStore((s) => s.payments);
  const activity = useStore((s) => s.activity);
  const settings = useStore((s) => s.settings);
  const [renew, setRenew] = useState<string | null>(null);
  const e = useCountUp();
  const now = Date.now();

  const st = useMemo(() => ads.map((a) => ({ a, st: liveStatus(a, now) })), [ads]);
  const live = st.filter((x) => x.st === 'activo' || x.st === 'vence');
  const soon = st.filter((x) => x.st === 'vence' || x.st === 'vencido').sort((x, y) => x.a.expiresAt - y.a.expiresAt);
  const month = new Date();
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1).getTime();
  const income = payments.filter((p) => p.at >= monthStart).reduce((s, p) => s + p.amount, 0);
  const newReq = requests.filter((r) => r.status === 'nueva');
  const views = ads.reduce((s, a) => s + a.views, 0);
  const wa = ads.reduce((s, a) => s + a.wa, 0);
  const fmt = (n: number) => fmtNum(Math.round(n * e));

  const weeks = useMemo(() => {
    const out = Array(8).fill(0) as number[];
    for (const p of payments) {
      const w = Math.floor((now - p.at) / (7 * DAY));
      if (w >= 0 && w < 8) out[7 - w]! += p.amount;
    }
    return out;
  }, [payments]);
  const weekViews = useMemo(() => {
    const V = [0, 0, 0, 0, 0, 0, 0];
    for (const a of ads) a.week.forEach((v, i) => (V[i]! += v));
    return V;
  }, [ads]);

  // resalta la actividad nueva
  const firstAt = useRef(activity[0]?.at ?? 0);

  return (
    <>
      <Head kicker={new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()} title="Resumen">
        <button type="button" className="btn-y" onClick={() => go('editar')}><Icon name="plus" size={20} stroke={3} />Publicar anuncio</button>
      </Head>

      <div className="tiles">
        <Stat k="INGRESOS DEL MES" v={`S/ ${fmt(income)}`} tone="k" />
        <Stat k="ANUNCIOS ACTIVOS" v={fmt(live.length)} delay={0.06} />
        <Stat k="SOLICITUDES NUEVAS" v={fmt(newReq.length)} tone="y" delay={0.12} />
        <Stat k="REPORTES ABIERTOS" v={fmt(reports.filter((r) => !r.resolved).length)} delay={0.18} />
      </div>
      <div className="tiles">
        <Stat k="VISTAS TOTALES" v={fmt(views)} delay={0.1} />
        <Stat k="CLICS A WHATSAPP" v={fmt(wa)} delay={0.14} />
        <Stat k="POR VENCER / VENCIDOS" v={fmt(soon.length)} delay={0.18} />
        <Stat k="PENDIENTES DE PAGO" v={fmt(st.filter((x) => x.st === 'pend').length)} delay={0.22} />
      </div>

      {!settings.simulate && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, padding: '18px 22px', border: '3px dashed #111', background: '#fffbe0' }}>
          <Icon name="eye" size={28} />
          <p style={{ flex: '1 1 300px', fontSize: 16 }}>
            <b>¿Quieres ver el sitio “en vivo”?</b> Activa la simulación: llegarán visitas, clics a WhatsApp y solicitudes nuevas de clientes ficticios.
          </p>
          <button type="button" className="btn-k" style={{ minHeight: 46 }} onClick={() => { setSettings({ simulate: true }); toast('Simulación en vivo activada'); }}>Activar simulación</button>
        </div>
      )}

      <div className="duo">
        <section className="box" style={{ padding: 24, gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ fontSize: 22 }}>Ingresos por semana</h2>
            <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>ÚLTIMAS 8 SEMANAS · S/ {fmtNum(weeks.reduce((a, b) => a + b, 0))}</span>
          </div>
          <Bars data={weeks} labels={weeks.map((_, i) => (i === 7 ? 'HOY' : `-${7 - i}S`))} fmt={(n) => `S/${n}`} />
        </section>
        <section className="box" style={{ padding: 24, gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ fontSize: 22 }}>Vistas por día</h2>
            {settings.simulate && <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: '#1a8f4a' }}>● EN VIVO</span>}
          </div>
          <Bars data={weekViews} labels={['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']} height={150} />
        </section>
      </div>

      <div className="duo">
        <section className="box" style={{ padding: 24, gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <h2 style={{ fontSize: 22 }}>Solicitudes por atender</h2>
            <button type="button" className="pill-x" onClick={() => go('solicitudes')}>Ver todas</button>
          </div>
          {newReq.length === 0 && <p style={{ fontSize: 15 }}>No hay solicitudes nuevas. 🎉</p>}
          {newReq.slice(0, 4).map((r) => (
            <div key={r.id} className="line" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: '1 1 200px' }}>
                <b>{r.title}</b>
                <span className="mono" style={{ fontSize: 12, color: '#555' }}>{r.id} · {r.name} · {timeAgo(r.createdAt).toUpperCase()}</span>
              </span>
              <button type="button" className="act k" onClick={() => go('solicitudes', { ver: r.id })}>Atender</button>
            </div>
          ))}
        </section>
        <section className="box" style={{ padding: 24, gap: 12 }}>
          <h2 style={{ fontSize: 22 }}>Actividad reciente</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflow: 'auto' }}>
            {activity.slice(0, 14).map((a, i) => (
              <div key={a.at + '-' + i} style={{ display: 'flex', gap: 10, fontSize: 14, alignItems: 'baseline', animation: a.at > firstAt.current ? 'fadeIn .4s both' : undefined }}>
                <span className="mono" style={{ fontSize: 11, color: '#666', flex: 'none', width: 74 }}>{timeAgo(a.at)}</span>
                <span>{ICON_TXT[a.kind]} {a.text}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {soon.length > 0 && (
        <section className="box" style={{ padding: 24, gap: 12 }}>
          <h2 style={{ fontSize: 22 }}>Por vencer o vencidos</h2>
          <p style={{ fontSize: 14, color: '#444' }}>Escríbeles para ofrecer la renovación de S/ {settings.adPrice}.</p>
          {soon.map(({ a }) => {
            const d = daysLeft(a, now);
            return (
              <div key={a.id} className="line" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ flex: '1 1 220px' }}><b>{a.title}</b><br /><span className="mono" style={{ fontSize: 12 }}>{a.id} · {a.seller.name} · {d > 0 ? `VENCE EN ${d} DÍA${d === 1 ? '' : 'S'}` : 'VENCIDO'}</span></span>
                <a className="act" target="_blank" rel="noopener" href={`https://wa.me/51${a.seller.phone}?text=${encodeURIComponent(`Hola ${a.seller.name.split(' ')[0]}, tu anuncio "${a.title}" en Pregón ${d > 0 ? `vence en ${d} días` : 'ya venció'}. ¿Deseas renovarlo por S/ ${settings.adPrice} y 30 días más?`)}`}>
                  <Icon name="wa" size={16} />Avisar
                </a>
                <button type="button" className="act k" onClick={() => setRenew(a.id)}>Renovar</button>
              </div>
            );
          })}
        </section>
      )}

      {renew && (
        <PayModal title="Renovar 30 días" amount={settings.adPrice} onClose={() => setRenew(null)}
          onConfirm={(m) => { renewAd(renew, m); setRenew(null); toast('Renovado por 30 días'); }} />
      )}
    </>
  );
}

const ICON_TXT: Record<string, string> = { view: '👁', wa: '💬', req: '📩', pub: '✅', pay: '💰', rep: '🚩', admin: '⚙' };
