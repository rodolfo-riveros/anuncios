import { useEffect, useMemo, useState } from 'react';
import { CAT } from '../lib/data';
import { daysLeft, fmtPrice, initials, isPublic, liveStatus, timeAgo, url, waLink } from '../lib/format';
import { addReport, isAdmin, toast, toggleFav, trackView, trackWa, useStore } from '../lib/store';
import { MiniCard, Photo, photoCount } from './AdCard';
import Icon from './Icon';
import MapView from './MapView';

/** Desplaza el centro de forma estable para no revelar la ubicación exacta */
function fuzz(id: string, lat: number, lng: number) {
  let h = 0;
  for (const ch of id) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  const ang = (h % 360) * (Math.PI / 180);
  const d = 0.0018; // ~200 m
  return [lat + Math.sin(ang) * d, lng + Math.cos(ang) * d] as const;
}

const REASONS = ['Es una estafa o pide adelantos', 'Información falsa o engañosa', 'Ya se vendió / no está disponible', 'Contenido ofensivo', 'Otro motivo'];

export default function AdDetail() {
  const id = useMemo(() => new URLSearchParams(location.search).get('id') ?? '', []);
  const ads = useStore((s) => s.ads);
  const favs = useStore((s) => s.favs);
  const ad = ads.find((a) => a.id === id);
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [report, setReport] = useState(false);
  const [reason, setReason] = useState(REASONS[0]!);
  const [detail, setDetail] = useState('');
  const admin = useMemo(() => isAdmin(), []);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (ad) {
      trackView(ad.id);
      document.title = `${ad.title} · ${fmtPrice(ad)} — Pregón`;
    }
  }, [ad?.id]);

  const n = ad ? photoCount(ad) : 0;
  const go = (d: number) => n && setIdx((i) => (i + d + n) % n);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'Escape') { setZoom(false); setReport(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [n]);

  // gesto de deslizar en celular
  const [touchX, setTouchX] = useState<number | null>(null);
  const swipe = {
    onTouchStart: (e: React.TouchEvent) => setTouchX(e.touches[0]!.clientX),
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchX == null) return;
      const dx = e.changedTouches[0]!.clientX - touchX;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      setTouchX(null);
    },
  };

  const related = useMemo(() => {
    if (!ad) return [];
    const pub = ads.filter((a) => a.id !== ad.id && isPublic(a));
    const same = pub.filter((a) => a.cat === ad.cat);
    const near = pub.filter((a) => a.cat !== ad.cat && a.district === ad.district);
    return [...same, ...near].slice(0, 4);
  }, [ads, ad?.id]);

  const others = useMemo(
    () => (ad ? ads.filter((a) => a.id !== ad.id && a.seller.name === ad.seller.name && isPublic(a)) : []),
    [ads, ad?.id],
  );

  if (!ad || (!admin && (ad.status === 'pend' || ad.status === 'pausado'))) {
    return (
      <div className="wrap" style={{ padding: '80px 32px', minHeight: '60vh' }}>
        <div className="empty">
          <Icon name="search" size={40} />
          Este anuncio no existe o fue eliminado.
          <a className="btn-y" href={url('/')}>Ver anuncios</a>
        </div>
      </div>
    );
  }

  const c = CAT[ad.cat];
  const st = liveStatus(ad);
  const fav = favs.includes(ad.id);
  const labels = ad.photos.length ? ad.photos.map((_, i) => `Foto ${i + 1}`) : ad.photoLabels;
  const [mlat, mlng] = ad.exact ? [ad.lat, ad.lng] : fuzz(ad.id, ad.lat, ad.lng);
  const shareUrl = location.href;
  const waText = `Hola ${ad.seller.name.split(' ')[0]}, vi tu anuncio en Pregón: "${ad.title}" (${fmtPrice(ad)}). ¿Sigue disponible? ${shareUrl}`;
  const left = daysLeft(ad);

  const share = async () => {
    const data = { title: ad.title, text: `${ad.title} · ${fmtPrice(ad)} en Pregón`, url: shareUrl };
    if (navigator.share) {
      try { await navigator.share(data); return; } catch { /* cancelado */ }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast('Enlace copiado');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      prompt('Copia este enlace:', shareUrl);
    }
  };

  const mainPhoto = (big: boolean) => (
    <Photo
      ad={ad}
      i={idx}
      className=""
      style={big ? { width: '100%', height: '100%' } : { height: 'clamp(280px, 48vw, 520px)', border: '3px solid #111', boxShadow: '8px 8px 0 #111' }}
      label={n ? `FOTO ${idx + 1} · ${(labels[idx] ?? '').toUpperCase()}` : `SIN FOTOS · ${c.short}`}
    >
      {ad.top && !big && <span className="badge-top" style={{ top: 16, left: 16, fontSize: 13 }}>★ DESTACADO</span>}
      {n > 0 && <span className="badge-n" style={{ bottom: 16, right: 16, fontSize: 14 }}>{idx + 1} / {n}</span>}
      {n > 1 && (
        <>
          <button type="button" className="gal-btn" style={{ left: 16 }} aria-label="Foto anterior" onClick={() => go(-1)}><Icon name="left" size={22} stroke={3} /></button>
          <button type="button" className="gal-btn" style={{ right: 16 }} aria-label="Foto siguiente" onClick={() => go(1)}><Icon name="right" size={22} stroke={3} /></button>
        </>
      )}
      {!big && n > 0 && (
        <button type="button" className="gal-btn" style={{ top: 16, right: 16, left: 'auto', marginTop: 0, width: 44, height: 44 }} aria-label="Ver en pantalla completa" onClick={() => setZoom(true)}>
          <Icon name="expand" size={20} stroke={2.6} />
        </button>
      )}
    </Photo>
  );

  return (
    <div className="wrap" style={{ paddingTop: 28, paddingBottom: 64, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <nav aria-label="Ruta" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 700 }}>
        <a href={url('/')} onClick={(e) => { if (document.referrer.includes(location.host)) { e.preventDefault(); history.back(); } }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon name="back" size={18} stroke={2.6} />Volver
        </a>
        <span aria-hidden="true">/</span>
        <a href={url(`/?cat=${ad.cat}`)}>{c.name}</a>
        <span aria-hidden="true">/</span>
        <a href={url(`/?cat=${ad.cat}&lugar=${encodeURIComponent(ad.district)}`)}>{ad.district}</a>
      </nav>

      {admin && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: '14px 18px', border: '3px solid #111', background: '#fffbe0' }}>
          <b style={{ flex: 1 }}>Vista de administrador · {ad.views} vistas · {ad.wa} contactos{st === 'pend' ? ' · Pendiente de pago (no visible al público)' : st === 'pausado' ? ' · Pausado (no visible al público)' : st === 'vencido' ? ' · Vencido' : ''}</b>
          <a className="act" href={url(`/admin?s=editar&id=${ad.id}`)}>Editar</a>
          <a className="act k" href={url('/admin?s=anuncios')}>Ir al admin</a>
        </div>
      )}
      {!admin && !isPublic(ad) && (
        <div style={{ padding: '14px 18px', border: '3px solid #111', background: '#d9d9d4', fontWeight: 800 }}>
          {st === 'vendido' ? 'Este anuncio ya fue cerrado por su autor.' : 'Este anuncio ya no está vigente.'}
        </div>
      )}

      <div className="layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, minWidth: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} {...swipe}>
            {mainPhoto(false)}
            {n > 1 && (
              <div className="thumbs">
                {labels.slice(0, 12).map((l, i) => (
                  <button key={i} type="button" className={`ph thumb ${i === idx ? 'on' : ''}`} onClick={() => setIdx(i)} aria-label={`Ver foto ${i + 1}: ${l}`} aria-current={i === idx}>
                    {ad.photos[i] ? <img src={ad.photos[i]} alt="" /> : <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: '#444' }}>{i + 1}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <section className="box">
            <h2>Descripción</h2>
            <p style={{ fontSize: 18, lineHeight: 1.55, maxWidth: '68ch', whiteSpace: 'pre-line' }}>{ad.desc}</p>
            {ad.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {ad.tags.map((t) => <span key={t} className="tag">{t}</span>)}
              </div>
            )}
          </section>

          <section className="box" style={{ padding: 0, gap: 0 }}>
            <div style={{ padding: '22px 28px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderBottom: '3px solid #111' }}>
              <h2>Ubicación</h2>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mlat.toFixed(5)},${mlng.toFixed(5)}`}
                target="_blank"
                rel="noopener"
                className="act y"
              >
                Abrir en Google Maps
              </a>
            </div>
            <div style={{ position: 'relative' }}>
              <MapView lat={mlat} lng={mlng} exact={ad.exact} />
              <span className="map-tag">{ad.district.toUpperCase()}, CUSCO · {ad.exact ? 'PUNTO EXACTO' : 'ZONA APROXIMADA'}</span>
            </div>
          </section>
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }} className="sticky">
          <section className="box fadein" style={{ boxShadow: '8px 8px 0 #111', gap: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <p className="mono" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em' }}>
                {c.short} · {ad.district.toUpperCase()} · {timeAgo(ad.createdAt).toUpperCase()}
              </p>
              <button type="button" className={`heart ${fav ? 'on' : ''}`} onClick={() => { toggleFav(ad.id); toast(fav ? 'Quitado de guardados' : 'Guardado en tu lista'); }} aria-label={fav ? 'Quitar de guardados' : 'Guardar anuncio'} aria-pressed={fav}>
                <Icon name="heart" size={24} />
              </button>
            </div>
            <h1 style={{ fontSize: 36, lineHeight: 1.02, fontWeight: 900, letterSpacing: '-0.025em' }}>{ad.title}</h1>
            <p style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>{fmtPrice(ad)}</p>
            <a href={waLink(ad.seller.phone, waText)} target="_blank" rel="noopener" className="cbtn wa" style={{ background: 'var(--wa)' }} onClick={() => trackWa(ad.id)}>
              <Icon name="wa" size={22} />Escribir por WhatsApp
            </a>
            <a href={`tel:+51${ad.seller.phone}`} className="cbtn" style={{ background: 'var(--y)' }}>
              <Icon name="phone" size={22} />Llamar
            </a>
            <button type="button" className="cbtn" onClick={share}>
              <Icon name={copied ? 'check' : 'share'} size={22} />{copied ? '¡Enlace copiado!' : 'Compartir anuncio'}
            </button>
            <p className="mono" style={{ fontSize: 12, display: 'flex', gap: 14, color: '#444' }}>
              <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><Icon name="eye" size={14} />{ad.views} vistas</span>
              <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><Icon name="wa" size={14} />{ad.wa} contactos</span>
            </p>
          </section>

          <section className="box" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 60, background: '#111', color: 'var(--y)', fontWeight: 900, fontSize: 24, flex: 'none' }}>{initials(ad.seller.name)}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontWeight: 900, fontSize: 20 }}>{ad.seller.name}</span>
                <span style={{ fontSize: 15, color: '#444' }}>Anunciante desde {ad.seller.since}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 15, fontWeight: 700 }}>
              {ad.seller.verified && <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="check" size={18} stroke={2.6} />Celular verificado por SMS</span>}
              {ad.status !== 'pend' && <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="check" size={18} stroke={2.6} />{c.free ? 'Anuncio comunitario gratuito' : 'Pago del anuncio confirmado'}</span>}
            </div>
            {others.length > 0 && <a href="#otros" style={{ fontWeight: 800, fontSize: 15 }}>Ver sus otros anuncios ({others.length})</a>}
          </section>

          <section style={{ background: 'var(--y)', border: '3px solid #111', padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 900 }}><Icon name="shield" size={22} />Trata seguro</h2>
            <p style={{ fontSize: 16, lineHeight: 1.45 }}>Visita el lugar antes de pagar. Nunca envíes adelantos por Yape a desconocidos. Pide ver los documentos originales.</p>
            <a href={url('/seguridad')} style={{ fontWeight: 800, fontSize: 15 }}>Más consejos de seguridad</a>
          </section>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, fontSize: 14 }}>
            <span className="mono" style={{ fontWeight: 700 }}>ID {ad.id}{st === 'activo' || st === 'vence' ? ` · VENCE EN ${left} DÍA${left === 1 ? '' : 'S'}` : ''}</span>
            {!admin && (
              <button type="button" onClick={() => setReport(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, background: 'none', border: 0, textDecoration: 'underline', cursor: 'pointer', fontSize: 14, padding: 0 }}>
                <Icon name="flag" size={16} />Reportar anuncio
              </button>
            )}
          </div>
        </aside>
      </div>

      {others.length > 0 && (
        <section id="otros" style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 16, scrollMarginTop: 90 }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', borderBottom: '3px solid #111', paddingBottom: 12 }}>Más de {ad.seller.name}</h2>
          <div className="rel">{others.slice(0, 4).map((a) => <MiniCard key={a.id} ad={a} />)}</div>
        </section>
      )}

      {related.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 16 }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', borderBottom: '3px solid #111', paddingBottom: 12 }}>Parecidos en el Valle</h2>
          <div className="rel">{related.map((a) => <MiniCard key={a.id} ad={a} />)}</div>
        </section>
      )}

      {zoom && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Galería en pantalla completa" onClick={(e) => e.target === e.currentTarget && setZoom(false)} {...swipe}>
          <button type="button" className="gal-btn close" style={{ marginTop: 0, position: 'absolute' }} onClick={() => setZoom(false)} aria-label="Cerrar" autoFocus>
            <Icon name="x" size={22} stroke={3} />
          </button>
          <div className="frame">{mainPhoto(true)}</div>
        </div>
      )}

      {report && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setReport(false)}>
          <form
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rep-h"
            onSubmit={(e) => {
              e.preventDefault();
              addReport(ad.id, reason, detail.trim());
              setReport(false);
              setDetail('');
              toast('Gracias. Revisaremos el anuncio en menos de 24 h.');
            }}
          >
            <h2 id="rep-h">Reportar anuncio</h2>
            <p style={{ fontSize: 15 }}>¿Qué problema tiene “{ad.title}”?</p>
            {REASONS.map((r) => (
              <label key={r} className="radio">
                <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
                {r}
              </label>
            ))}
            <label className="fld">Detalles (opcional)<textarea className="inp" style={{ minHeight: 90 }} value={detail} onChange={(e) => setDetail(e.target.value)} /></label>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="btn-w" onClick={() => setReport(false)}>Cancelar</button>
              <button type="submit" className="btn-y">Enviar reporte</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
