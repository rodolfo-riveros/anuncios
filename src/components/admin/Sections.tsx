import { useEffect, useMemo, useState } from 'react';
import { AD_DAYS, CAT, CATEGORIES, PAY_NAME, type Ad, type CatKey, type PayMethod, type RequestStatus } from '../../lib/data';
import { daysLeft, fmtDate, fmtNum, fmtPrice, liveStatus, norm, timeAgo, url, waLink, type LiveStatus } from '../../lib/format';
import {
  boostAd, deleteAd, getState, patchAd, renewAd, resetDemo, resolveReport, setRequestStatus, setSettings, toast, useStore,
} from '../../lib/store';
import { Photo } from '../AdCard';
import Icon from '../Icon';
import type { Nav } from './Admin';
import { Head, Modal, PayModal } from './ui';

/* ---------------- Solicitudes ---------------- */

const REQ_TABS: [RequestStatus, string][] = [['nueva', 'Nuevas'], ['contactado', 'Contactados'], ['publicada', 'Publicadas'], ['rechazada', 'Rechazadas']];

export function Requests({ go }: Nav) {
  const requests = useStore((s) => s.requests);
  const settings = useStore((s) => s.settings);
  const focus = useMemo(() => new URLSearchParams(location.search).get('ver'), []);
  const [tab, setTab] = useState<RequestStatus>(() => requests.find((r) => r.id === focus)?.status ?? 'nueva');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [zoom, setZoom] = useState<string | null>(null);
  const list = requests.filter((r) => r.status === tab);

  useEffect(() => {
    if (focus) document.getElementById(focus)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  return (
    <>
      <Head kicker="DESDE EL FORMULARIO “ANÚNCIATE”" title="Solicitudes" />
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 6px 8px 0' }} role="tablist">
        {REQ_TABS.map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>
            {l}<span className="n">{requests.filter((r) => r.status === k).length}</span>
          </button>
        ))}
      </div>

      {list.length === 0 && <div className="empty">No hay solicitudes en esta lista.</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {list.map((r, i) => {
          const free = CAT[r.cat].free;
          const msg = free
            ? `Hola ${r.name.split(' ')[0]}, somos Pregón. Recibimos tu solicitud ${r.id} ("${r.title}"). Los anuncios de mascotas perdidas son gratis, lo publicamos en unos minutos. ¡Ojalá aparezca pronto!`
            : `Hola ${r.name.split(' ')[0]}, somos Pregón. Recibimos tu solicitud ${r.id} ("${r.title}"). Para publicarlo por 30 días el costo es S/ ${settings.adPrice}. Puedes yapear al ${settings.ownerPhone} a nombre de ${settings.ownerName} y enviarnos la captura. ¿Deseas también destacarlo por S/ ${settings.topPrice} más?`;
          return (
            <article key={r.id} id={r.id} className="box" style={{ padding: 22, gap: 14, boxShadow: r.id === focus ? '6px 6px 0 var(--y), 6px 6px 0 3px #111' : '5px 5px 0 #111', animation: `fadeUp .4s ${i * 50}ms both` }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <span className="badge b-activo">{r.id}</span>
                <span className="badge" style={{ background: '#fff' }}>{CAT[r.cat].short}</span>
                {free && <span className="badge" style={{ background: 'var(--y)' }}>GRATIS</span>}
                <span className="mono" style={{ fontSize: 12, color: '#555' }}>{timeAgo(r.createdAt).toUpperCase()} · {r.district.toUpperCase()}</span>
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 900 }}>{r.title}</h3>
              <p style={{ fontSize: 16, lineHeight: 1.5 }}>{r.desc}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 22px', fontSize: 15 }}>
                <span><b>Precio:</b> {r.price || '—'}</span>
                <span><b>Cliente:</b> {r.name}</span>
                <span><b>WhatsApp:</b> <span className="mono">{r.phone}</span></span>
              </div>
              {r.photos.length > 0 && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {r.photos.map((p, k) => (
                    <button key={k} type="button" className="ph thumb" style={{ width: 110, height: 80 }} onClick={() => setZoom(p)} aria-label={`Ver foto ${k + 1}`}>
                      <img src={p} alt="" />
                    </button>
                  ))}
                </div>
              )}
              {r.note && <p style={{ fontSize: 14, padding: '8px 12px', background: '#fffbe0', border: '2px solid #111' }}><b>Nota:</b> {r.note}</p>}
              {(r.status === 'nueva' || r.status === 'contactado') && (
                <input className="inp" style={{ minHeight: 44, fontSize: 15 }} placeholder="Agregar nota interna (ej. pagará mañana)" value={notes[r.id] ?? ''}
                  onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter' && notes[r.id]) { setRequestStatus(r.id, r.status, { note: notes[r.id] }); setNotes({ ...notes, [r.id]: '' }); toast('Nota guardada'); } }} />
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <a className="act" style={{ background: 'var(--wa)' }} href={waLink(r.phone, msg)} target="_blank" rel="noopener"
                  onClick={() => r.status === 'nueva' && setRequestStatus(r.id, 'contactado')}>
                  <Icon name="wa" size={16} />Escribir al cliente
                </a>
                {r.status === 'nueva' && <button type="button" className="act" onClick={() => { setRequestStatus(r.id, 'contactado'); toast('Marcada como contactada'); }}>Marcar contactado</button>}
                {(r.status === 'nueva' || r.status === 'contactado') && (
                  <>
                    <button type="button" className="act k" onClick={() => go('editar', { sol: r.id })}>Crear y publicar anuncio</button>
                    <button type="button" className="act danger" onClick={() => { setRequestStatus(r.id, 'rechazada', notes[r.id] ? { note: notes[r.id] } : {}); toast('Solicitud rechazada'); }}>Rechazar</button>
                  </>
                )}
                {r.status === 'publicada' && r.adId && <a className="act k" href={url(`/anuncio?id=${r.adId}`)} target="_blank" rel="noopener">Ver anuncio {r.adId}</a>}
                {r.status === 'rechazada' && <button type="button" className="act" onClick={() => setRequestStatus(r.id, 'nueva')}>Volver a nuevas</button>}
              </div>
            </article>
          );
        })}
      </div>
      {zoom && (
        <div className="lightbox" onClick={() => setZoom(null)} role="dialog" aria-label="Foto">
          <img src={zoom} alt="" style={{ maxWidth: '100%', maxHeight: '85vh', border: '3px solid var(--y)' }} />
        </div>
      )}
    </>
  );
}

/* ---------------- Anuncios ---------------- */

const LBL: Record<LiveStatus, string> = { activo: 'ACTIVO', vence: 'POR VENCER', vencido: 'VENCIDO', pend: 'PENDIENTE DE PAGO', vendido: 'CERRADO', pausado: 'PAUSADO' };
const TABS: [LiveStatus | 'todos', string][] = [['todos', 'Todos'], ['activo', 'Activos'], ['vence', 'Por vencer'], ['vencido', 'Vencidos'], ['pend', 'Pendientes'], ['pausado', 'Pausados'], ['vendido', 'Cerrados']];

export function AdsAdmin({ go }: Nav) {
  const ads = useStore((s) => s.ads);
  const settings = useStore((s) => s.settings);
  const [tab, setTab] = useState<LiveStatus | 'todos'>(() => (new URLSearchParams(location.search).get('estado') as LiveStatus) || 'todos');
  const [cat, setCat] = useState<CatKey | ''>('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'recientes' | 'vistas' | 'vence'>('recientes');
  const [confirm, setConfirm] = useState<Ad | null>(null);
  const [payFor, setPayFor] = useState<{ ad: Ad; kind: 'renew' | 'boost' } | null>(null);
  const now = Date.now();

  const withSt = useMemo(() => ads.map((a) => ({ a, st: liveStatus(a, now) })), [ads]);
  const list = withSt
    .filter((x) => tab === 'todos' || x.st === tab)
    .filter((x) => !cat || x.a.cat === cat)
    .filter((x) => !q || norm(`${x.a.id} ${x.a.title} ${x.a.seller.name} ${x.a.seller.phone} ${x.a.district}`).includes(norm(q)))
    .sort((x, y) => (sort === 'vistas' ? y.a.views - x.a.views : sort === 'vence' ? x.a.expiresAt - y.a.expiresAt : y.a.createdAt - x.a.createdAt));

  return (
    <>
      <Head kicker={`${ads.length} ANUNCIOS EN TOTAL`} title="Anuncios">
        <button type="button" className="btn-y" onClick={() => go('editar')}><Icon name="plus" size={20} stroke={3} />Publicar anuncio</button>
      </Head>

      <div className="toolbar" style={{ marginBottom: 0 }}>
        <input className="sel" style={{ flex: '1 1 240px' }} placeholder="Buscar por título, ID, cliente o celular…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar anuncios" />
        <select className="sel" value={cat} onChange={(e) => setCat(e.target.value as CatKey | '')} aria-label="Categoría">
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
        </select>
        <select className="sel" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Ordenar">
          <option value="recientes">Más recientes</option>
          <option value="vistas">Más vistos</option>
          <option value="vence">Vencen antes</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 6px 8px 0' }} role="tablist" aria-label="Filtrar por estado">
        {TABS.map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>
            {l}<span className="n">{k === 'todos' ? ads.length : withSt.filter((x) => x.st === k).length}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {list.map(({ a, st }, i) => {
          const isLive = st === 'activo' || st === 'vence';
          const d = Math.max(0, daysLeft(a, now));
          const free = CAT[a.cat].free;
          return (
            <article key={a.id} className="row" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
              <Photo ad={a} label={CAT[a.cat].code} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <span className={`badge b-${st === 'pausado' ? 'vencido' : st}`}>{LBL[st]}</span>
                  {a.top && isLive && <span className="badge" style={{ background: 'var(--y)' }}>★ DESTACADO</span>}
                  {free && <span className="badge" style={{ background: '#fff' }}>GRATIS</span>}
                  <span className="mono" style={{ fontSize: 11, color: '#666' }}>{a.id} · {CAT[a.cat].short}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>
                  <a href={url(`/anuncio?id=${a.id}`)} target="_blank" rel="noopener">{a.title}</a>
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 16px', fontSize: 13, color: '#333' }}>
                  <b>{fmtPrice(a)}</b>
                  <span>{a.seller.name} · <span className="mono">{a.seller.phone}</span></span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span className="bar" style={{ width: 100 }}><span className="fill" style={{ width: `${isLive ? Math.round((d / AD_DAYS) * 100) : 0}%` }} /></span>
                    <b>{st === 'pend' ? 'Sin publicar' : st === 'vendido' ? 'Cerrado' : st === 'pausado' ? 'Oculto' : isLive ? `${d} día${d === 1 ? '' : 's'}` : 'Venció'}</b>
                  </span>
                  <span className="mono" style={{ fontWeight: 700 }}>{fmtNum(a.views)} vistas · {fmtNum(a.wa)} WA</span>
                </div>
              </div>
              <div className="acts" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', maxWidth: 360 }}>
                {st === 'pend' && <button type="button" className="act k" onClick={() => go('editar', { id: a.id })}>Registrar pago</button>}
                {(st === 'vence' || st === 'vencido') && <button type="button" className="act k" onClick={() => setPayFor({ ad: a, kind: 'renew' })}>Renovar</button>}
                {isLive && !a.top && !free && <button type="button" className="act y" onClick={() => setPayFor({ ad: a, kind: 'boost' })}>Destacar</button>}
                {isLive && a.top && <button type="button" className="act" onClick={() => { patchAd(a.id, { top: false }, `Quitaste el destacado de “${a.title}”`); toast('Ya no es destacado'); }}>Quitar ★</button>}
                <button type="button" className="act" onClick={() => go('editar', { id: a.id })}>Editar</button>
                {isLive && <button type="button" className="act" onClick={() => { patchAd(a.id, { status: 'vendido', top: false }, `Cerraste “${a.title}”`); toast(free ? '¡Qué bien! Marcado como encontrado' : 'Marcado como vendido'); }}>{free ? 'Encontrado' : 'Vendido'}</button>}
                {isLive && <button type="button" className="act" onClick={() => { patchAd(a.id, { status: 'pausado' }, `Pausaste “${a.title}”`); toast('Anuncio pausado (oculto)'); }}>Pausar</button>}
                {(st === 'pausado' || st === 'vendido') && <button type="button" className="act" onClick={() => { patchAd(a.id, { status: 'activo' }, `Reactivaste “${a.title}”`); toast('Anuncio reactivado'); }}>Reactivar</button>}
                <a className="act" href={waLink(a.seller.phone, `Hola ${a.seller.name.split(' ')[0]}, te escribimos de Pregón sobre tu anuncio "${a.title}".`)} target="_blank" rel="noopener" aria-label="WhatsApp al cliente" title="WhatsApp al cliente"><Icon name="wa" size={16} /></a>
                <button type="button" className="act danger" aria-label={`Eliminar ${a.title}`} title="Eliminar" onClick={() => setConfirm(a)}><Icon name="trash" size={16} /></button>
              </div>
              {st === 'vendido' && <span className="sold" aria-hidden="true">{free ? '¡ENCONTRADO!' : '¡VENDIDO!'}</span>}
            </article>
          );
        })}
        {list.length === 0 && <div className="empty">No hay anuncios con esos filtros.</div>}
      </div>

      {confirm && (
        <Modal onClose={() => setConfirm(null)} title="¿Eliminar este anuncio?">
          <p style={{ fontSize: 16 }}>“{confirm.title}” ({confirm.id}) se borrará para siempre. Si solo quieres ocultarlo, usa “Pausar”.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button type="button" className="btn-w" onClick={() => setConfirm(null)} autoFocus>Cancelar</button>
            <button type="button" className="btn-k" onClick={() => { deleteAd(confirm.id); setConfirm(null); toast('Anuncio eliminado'); }}>Eliminar</button>
          </div>
        </Modal>
      )}
      {payFor && (
        <PayModal
          title={payFor.kind === 'renew' ? `Renovar ${AD_DAYS} días` : 'Destacar anuncio'}
          amount={payFor.kind === 'renew' ? settings.adPrice : settings.topPrice}
          onClose={() => setPayFor(null)}
          onConfirm={(m) => {
            if (payFor.kind === 'renew') { renewAd(payFor.ad.id, m); toast(`Renovado por ${AD_DAYS} días`); }
            else { boostAd(payFor.ad.id, m); toast('Ahora sale destacado'); }
            setPayFor(null);
          }}
        />
      )}
    </>
  );
}

/* ---------------- Pagos ---------------- */

export function Payments() {
  const payments = useStore((s) => s.payments);
  const months = useMemo(() => {
    const set = new Map<string, string>();
    for (const p of payments) {
      const d = new Date(p.at);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      set.set(k, d.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }));
    }
    return [...set.entries()];
  }, [payments]);
  const [month, setMonth] = useState(months[0]?.[0] ?? '');
  const list = payments.filter((p) => {
    const d = new Date(p.at);
    return !month || `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === month;
  });
  const total = list.reduce((s, p) => s + p.amount, 0);
  const byMethod = (['yape', 'plin', 'efectivo', 'tarjeta', 'gratis'] as PayMethod[]).map((m) => ({ m, n: list.filter((p) => p.method === m).length, s: list.filter((p) => p.method === m).reduce((a, p) => a + p.amount, 0) }));
  const max = Math.max(1, ...byMethod.map((b) => b.s));

  const exportCsv = () => {
    const rows = [['fecha', 'anuncio', 'concepto', 'metodo', 'monto', 'operacion'], ...list.map((p) => [new Date(p.at).toISOString().slice(0, 16).replace('T', ' '), p.adId, p.concept, PAY_NAME[p.method], p.amount.toFixed(2), p.op ?? ''])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `pregon-pagos-${month || 'todo'}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <Head kicker={`TOTAL · S/ ${fmtNum(total)}.00 · ${list.length} PAGOS`} title="Pagos">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select className="sel" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Mes">
            {months.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            <option value="">Todo el historial</option>
          </select>
          <button type="button" className="act" style={{ minHeight: 46 }} onClick={exportCsv}><Icon name="upload" size={16} />Exportar Excel (CSV)</button>
        </div>
      </Head>
      <section className="box" style={{ padding: 24, gap: 12 }}>
        <h2 style={{ fontSize: 20 }}>Por método de pago</h2>
        {byMethod.map((b) => (
          <div key={b.m} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 110px', gap: 12, alignItems: 'center', fontSize: 15 }}>
            <b>{PAY_NAME[b.m]}</b>
            <span style={{ height: 18, border: '2px solid #111', background: '#fff' }}><span className="fill" style={{ width: `${(b.s / max) * 100}%`, background: b.m === 'yape' ? '#742284' : b.m === 'plin' ? '#00b4c5' : '#111' }} /></span>
            <span className="mono" style={{ fontWeight: 700, textAlign: 'right' }}>S/ {b.s} · {b.n}</span>
          </div>
        ))}
      </section>
      <section className="box" style={{ padding: 24, gap: 12 }}>
        {list.length === 0 && <p>Sin pagos en este periodo.</p>}
        {list.map((p) => (
          <div key={p.id} className="line" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <b>{p.concept}</b>
              <span className="mono" style={{ fontSize: 12, color: '#555' }}>
                {fmtDate(p.at).toUpperCase()} · {PAY_NAME[p.method].toUpperCase()}{p.op ? ` · OP ${p.op}` : ''} · {p.adId}
              </span>
            </span>
            <span className="mono" style={{ fontWeight: 700, fontSize: 18 }}>S/ {p.amount.toFixed(2)}</span>
          </div>
        ))}
      </section>
    </>
  );
}

/* ---------------- Reportes ---------------- */

export function Reports({ go }: Nav) {
  const reports = useStore((s) => s.reports);
  const ads = useStore((s) => s.ads);
  const [showAll, setShowAll] = useState(false);
  const list = reports.filter((r) => showAll || !r.resolved);
  return (
    <>
      <Head kicker="DENUNCIAS DE LOS VISITANTES" title="Reportes">
        <label className="ck"><input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />Mostrar resueltos</label>
      </Head>
      {list.length === 0 && <div className="empty"><Icon name="shield" size={40} />No hay reportes pendientes.</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {list.map((r) => {
          const ad = ads.find((a) => a.id === r.adId);
          return (
            <article key={r.id} className="box" style={{ padding: 22, gap: 10, opacity: r.resolved ? 0.6 : 1, boxShadow: r.resolved ? 'none' : '5px 5px 0 #111' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <span className="badge" style={{ background: r.resolved ? '#fff' : 'var(--orange)' }}>{r.resolved ? 'RESUELTO' : 'ABIERTO'}</span>
                <span className="mono" style={{ fontSize: 12, color: '#555' }}>{r.adId} · {timeAgo(r.createdAt).toUpperCase()}</span>
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 800 }}>{ad?.title ?? 'Anuncio eliminado'}</h3>
              <p style={{ fontSize: 16 }}><b>{r.reason}.</b> {r.detail}</p>
              {!r.resolved && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {ad && <a className="act" href={url(`/anuncio?id=${ad.id}`)} target="_blank" rel="noopener">Ver anuncio</a>}
                  {ad && ad.status !== 'pausado' && <button type="button" className="act k" onClick={() => { patchAd(ad.id, { status: 'pausado' }, `Pausaste “${ad.title}” por un reporte`); resolveReport(r.id); toast('Anuncio pausado y reporte resuelto'); }}>Pausar anuncio</button>}
                  {ad && <button type="button" className="act" onClick={() => go('editar', { id: ad.id })}>Corregir</button>}
                  <button type="button" className="act" onClick={() => { resolveReport(r.id); toast('Reporte descartado'); }}>Descartar</button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

/* ---------------- Ajustes ---------------- */

export function Settings({ onLogout }: { onLogout: () => void }) {
  const s = useStore((st) => st.settings);
  const [f, setF] = useState(s);
  const valid = f.ownerName.trim().length > 1 && /^9\d{8}$/.test(f.ownerPhone) && f.adPrice >= 0 && f.topPrice >= 0;
  return (
    <>
      <Head kicker="CONFIGURACIÓN DEL SITIO" title="Ajustes" />
      <form className="box" style={{ maxWidth: 640 }} onSubmit={(e) => { e.preventDefault(); if (!valid) return; setSettings({ ...f, ownerName: f.ownerName.trim() }); toast('Ajustes guardados'); }}>
        <h2 style={{ fontSize: 20 }}>Datos del negocio</h2>
        <label className="fld">Nombre que ven los clientes<input className="inp" value={f.ownerName} onChange={(e) => setF({ ...f, ownerName: e.target.value })} /></label>
        <label className="fld">
          WhatsApp del administrador <small>Aquí llegan los mensajes de “Anúnciate” y se muestra para los pagos por Yape.</small>
          <input className={`inp ${/^9\d{8}$/.test(f.ownerPhone) ? '' : 'bad'}`} inputMode="tel" value={f.ownerPhone} onChange={(e) => setF({ ...f, ownerPhone: e.target.value.replace(/\D/g, '').slice(0, 9) })} />
        </label>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <label className="fld" style={{ flex: '1 1 180px' }}>Precio por anuncio (S/)<input className="inp" type="number" min={0} value={f.adPrice} onChange={(e) => setF({ ...f, adPrice: Number(e.target.value) })} /></label>
          <label className="fld" style={{ flex: '1 1 180px' }}>Precio del destacado (S/)<input className="inp" type="number" min={0} value={f.topPrice} onChange={(e) => setF({ ...f, topPrice: Number(e.target.value) })} /></label>
        </div>
        <button type="submit" className="btn-y" disabled={!valid} style={{ alignSelf: 'flex-start' }}>Guardar</button>
      </form>
      <section className="box" style={{ maxWidth: 640, borderStyle: 'dashed' }}>
        <h2 style={{ fontSize: 20 }}>Datos de prueba</h2>
        <p style={{ fontSize: 15 }}>Todo se guarda en este navegador. Puedes volver a cargar los anuncios, solicitudes, reportes y pagos de ejemplo.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" className="btn-w" onClick={() => { if (confirm('¿Borrar todos los cambios y recargar los datos de prueba?')) { resetDemo(); localStorage.removeItem('pregon:draft'); setF(getState().settings); toast('Datos de prueba restablecidos'); } }}>
            Restablecer datos de prueba
          </button>
          <button type="button" className="btn-k" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </section>
    </>
  );
}
