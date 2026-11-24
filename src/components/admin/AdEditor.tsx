import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AD_DAYS, CAT, CATEGORIES, DAY, DISTRICTS, PAY_NAME, districtByName,
  type Ad, type AdRequest, type CatKey, type Currency, type PayMethod,
} from '../../lib/data';
import { fmtDate, fmtPrice, url, waLink } from '../../lib/format';
import { compressImage } from '../../lib/images';
import { addPayment, getAd, getState, nextAdId, setRequestStatus, toast, upsertAd, useStore } from '../../lib/store';
import Icon from '../Icon';
import MapView from '../MapView';

interface Form {
  cat: CatKey;
  title: string;
  price: string;
  currency: Currency;
  monthly: boolean;
  desc: string;
  tags: string;
  photos: string[];
  district: string;
  lat: number;
  lng: number;
  exact: boolean;
  phone: string;
  name: string;
}

const DRAFT = 'pregon:draft';
const MAX_PHOTOS = 10;
const STEPS = ['Categoría', 'Datos y fotos', 'Ubicación y cliente', 'Cobro'];

function blank(): Form {
  const d = DISTRICTS[0]!;
  return {
    cat: 'terrenos', title: '', price: '', currency: 'PEN', monthly: false, desc: '', tags: '', photos: [],
    district: d.name, lat: d.lat, lng: d.lng, exact: false, phone: '', name: '',
  };
}

function fromAd(a: Ad): Form {
  return {
    cat: a.cat, title: a.title, price: a.price == null ? '' : String(a.price), currency: a.currency,
    monthly: a.priceSuffix === '/ mes', desc: a.desc, tags: a.tags.join(', '), photos: a.photos,
    district: a.district, lat: a.lat, lng: a.lng, exact: a.exact, phone: a.seller.phone, name: a.seller.name,
  };
}

/** Convierte el texto libre de la solicitud ("1800 mensual", "24000 dólares") en campos */
function fromRequest(r: AdRequest): Form {
  const d = districtByName(r.district);
  const num = r.price.replace(/[,\s]/g, '').match(/\d+(\.\d+)?/);
  const low = r.price.toLowerCase();
  return {
    ...blank(),
    cat: r.cat, title: r.title, desc: r.desc, photos: r.photos, district: d.name, lat: d.lat, lng: d.lng,
    name: r.name, phone: r.phone,
    price: num ? num[0] : '',
    currency: num ? (/d[oó]lar|us\$|usd/.test(low) ? 'USD' : 'PEN') : 'NONE',
    monthly: /mes|mensual/.test(low),
  };
}

type Errors = Partial<Record<keyof Form, string>>;

function validate(step: number, f: Form): Errors {
  const e: Errors = {};
  if (step === 2) {
    if (f.title.trim().length < 8) e.title = 'Escribe un título de al menos 8 letras.';
    if (f.currency !== 'NONE' && !(Number(f.price) > 0)) e.price = 'Pon un precio válido o elige “A tratar”.';
    if (f.desc.trim().length < 20) e.desc = 'Cuenta un poco más (mínimo 20 letras).';
  }
  if (step === 3) {
    if (!/^9\d{8}$/.test(f.phone.replace(/\D/g, ''))) e.phone = 'Celular de 9 dígitos que empiece en 9.';
    if (f.name.trim().length < 2) e.name = 'Escribe el nombre del anunciante.';
  }
  return e;
}

export default function AdEditor({
  editId,
  requestId,
  onExit,
}: {
  editId?: string;
  requestId?: string;
  onExit: (to: 'anuncios' | 'solicitudes') => void;
}) {
  const settings = useStore((s) => s.settings);
  const editing = editId ? getAd(editId) : undefined;
  const request = requestId ? getState().requests.find((r) => r.id === requestId) : undefined;
  const [f, setF] = useState<Form>(() => {
    if (editing) return fromAd(editing);
    if (request) return fromRequest(request);
    try {
      const d = localStorage.getItem(DRAFT);
      if (d) return { ...blank(), ...JSON.parse(d) };
    } catch { /* sin borrador */ }
    return blank();
  });
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [pay, setPay] = useState<PayMethod | 'pendiente'>('yape');
  const [op, setOp] = useState('');
  const [boost, setBoost] = useState(false);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLElement>(null);

  const free = Boolean(CAT[f.cat].free);
  const alreadyPaid = Boolean(editing && editing.status !== 'pend');
  const needsPay = !alreadyPaid;
  const lastStep = needsPay ? 4 : 3;
  const charge = pay === 'gratis' || pay === 'pendiente' || free ? 0 : settings.adPrice + (boost ? settings.topPrice : 0);

  // borrador solo para anuncios nuevos creados desde cero
  useEffect(() => {
    if (editing || request || doneId) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(DRAFT, JSON.stringify(f)); } catch { /* fotos muy pesadas */ }
    }, 400);
    return () => clearTimeout(t);
  }, [f]);

  useEffect(() => {
    if (free && pay !== 'pendiente') setPay('gratis');
  }, [free]);

  useEffect(() => {
    if (step > 1) boxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  const set = (ch: Partial<Form>) => {
    setF((o) => ({ ...o, ...ch }));
    setErrors((e) => {
      const n = { ...e };
      for (const k of Object.keys(ch)) delete n[k as keyof Errors];
      return n;
    });
  };

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((x) => x.type.startsWith('image/'));
    const room = MAX_PHOTOS - f.photos.length;
    if (!list.length) return;
    if (room <= 0) return toast(`Máximo ${MAX_PHOTOS} fotos`);
    setBusy(true);
    try {
      const out = await Promise.all(list.slice(0, room).map((x) => compressImage(x)));
      setF((o) => ({ ...o, photos: [...o.photos, ...out].slice(0, MAX_PHOTOS) }));
      if (list.length > room) toast(`Solo se agregaron ${room}. Máximo ${MAX_PHOTOS} fotos.`);
    } catch {
      toast('No se pudo leer una de las fotos');
    } finally {
      setBusy(false);
    }
  };

  const movePhoto = (i: number, to: number) =>
    setF((o) => {
      const p = [...o.photos];
      const [x] = p.splice(i, 1);
      p.splice(to, 0, x!);
      return { ...o, photos: p };
    });

  const next = () => {
    const e = validate(step, f);
    if (Object.keys(e).length) {
      setErrors(e);
      toast('Revisa los campos marcados');
      return;
    }
    if (step < lastStep) setStep(step + 1);
    else publish();
  };

  const publish = () => {
    const now = Date.now();
    const id = editing?.id ?? nextAdId();
    const pending = needsPay && pay === 'pendiente';
    const base: Ad = editing ?? {
      id, cat: f.cat, title: '', price: null, currency: 'NONE', desc: '', tags: [], district: f.district, lat: 0, lng: 0,
      exact: false, photos: [], photoLabels: [], createdAt: now, expiresAt: now + AD_DAYS * DAY, status: 'activo', top: false,
      seller: { name: f.name, phone: f.phone, since: new Date().getFullYear(), verified: true }, views: 0, wa: 0,
      week: [0, 0, 0, 0, 0, 0, 0], requestId: request?.id,
    };
    const ad: Ad = {
      ...base,
      cat: f.cat,
      title: f.title.trim(),
      price: f.currency === 'NONE' ? null : Number(f.price),
      currency: f.currency,
      priceSuffix: f.monthly && f.currency !== 'NONE' ? '/ mes' : undefined,
      priceNote: f.currency === 'NONE' ? (f.cat === 'mascotas' ? 'Recompensa' : 'A tratar') : undefined,
      desc: f.desc.trim(),
      tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 8),
      photos: f.photos,
      photoLabels: f.photos.map((_, i) => base.photos[i] === f.photos[i] ? base.photoLabels[i] ?? `Foto ${i + 1}` : `Foto ${i + 1}`),
      district: f.district, lat: f.lat, lng: f.lng, exact: f.exact,
      seller: { ...base.seller, name: f.name.trim(), phone: f.phone.replace(/\D/g, '') },
      top: base.top || (boost && !free && !pending),
    };
    if (needsPay) {
      ad.status = pending ? 'pend' : 'activo';
      if (!pending) {
        ad.createdAt = now;
        ad.expiresAt = now + AD_DAYS * DAY;
      }
    }
    if (!upsertAd(ad)) return;
    if (needsPay && !pending) {
      const method: PayMethod = free ? 'gratis' : (pay as PayMethod);
      addPayment({ adId: id, concept: ad.title.slice(0, 30), method, amount: method === 'gratis' ? 0 : settings.adPrice, op: op || undefined });
      if (boost && !free && method !== 'gratis') addPayment({ adId: id, concept: `Destacado · ${ad.title.slice(0, 18)}`, method, amount: settings.topPrice });
    }
    if (request) setRequestStatus(request.id, 'publicada', { adId: id });
    if (!editing && !request) localStorage.removeItem(DRAFT);
    if (alreadyPaid) {
      toast('Cambios guardados');
      onExit('anuncios');
      return;
    }
    setDoneId(id);
    setStep(5);
  };

  const err = (k: keyof Errors) => (errors[k] ? <span className="err" role="alert">{errors[k]}</span> : null);

  const preview: Ad = {
    id: 'preview', cat: f.cat, title: f.title || 'Título del anuncio', price: f.currency === 'NONE' ? null : Number(f.price) || 0,
    currency: f.currency, priceSuffix: f.monthly ? '/ mes' : undefined, priceNote: f.cat === 'mascotas' ? 'Recompensa' : 'A tratar',
    desc: '', tags: [], district: f.district, lat: 0, lng: 0, exact: false, photos: f.photos, photoLabels: [],
    createdAt: Date.now(), expiresAt: 0, status: 'activo', top: boost, seller: { name: '', phone: '', since: 0, verified: false },
    views: 0, wa: 0, week: [],
  };
  const done = doneId ? getAd(doneId) : undefined;
  const adLink = doneId ? location.origin + url(`/anuncio?id=${doneId}`) : '';

  const PAYS: [PayMethod | 'pendiente', string, string][] = useMemo(
    () => [
      ['yape', 'Yape', 'N.º de operación'],
      ['plin', 'Plin', 'N.º de operación'],
      ['efectivo', 'Efectivo', 'Pagó en persona'],
      ['tarjeta', 'Tarjeta', 'POS o link de pago'],
      ['gratis', 'Cortesía', 'Sin cobro'],
      ['pendiente', 'Aún no paga', 'Queda oculto'],
    ],
    [],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <p className="kicker" style={{ fontSize: 13, marginBottom: 6 }}>
            {request ? `DESDE LA SOLICITUD ${request.id}` : editing ? `EDITANDO ${editing.id}` : 'ANUNCIO NUEVO'}
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 0.95 }}>
            {editing ? 'Editar anuncio' : 'Publicar anuncio'}
          </h1>
        </div>
        <button type="button" className="btn-w" onClick={() => onExit(request ? 'solicitudes' : 'anuncios')}>Cancelar</button>
      </div>

      <ol className="stepper" aria-label="Pasos">
        {STEPS.slice(0, lastStep).map((l, i) => {
          const n = i + 1;
          const cur = n === step;
          const past = n < step;
          return (
            <li key={l} style={{ background: cur ? 'var(--y)' : past ? '#111' : '#fff', color: past ? '#fff' : '#111' }} aria-current={cur ? 'step' : undefined}>
              <button type="button" disabled={!past || step === 5} onClick={() => setStep(n)} style={{ opacity: 1 }}>
                <span className="mono" style={{ fontSize: 22, fontWeight: 700 }}>{past ? '✓' : '0' + n}</span>
                <span style={{ fontWeight: 800, fontSize: 16 }}>{l}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="wrap2">
        <section ref={boxRef} className="stepbox box" key={step} style={{ boxShadow: '8px 8px 0 #111', padding: 32, gap: 24, minWidth: 0, scrollMarginTop: 100 }}>
          {step === 1 && (
            <>
              <h2 style={{ fontSize: 28 }}>Categoría</h2>
              <div className="grid-cats">
                {CATEGORIES.map((c) => (
                  <button key={c.key} type="button" className={`tile ${f.cat === c.key ? 'on' : ''}`} aria-pressed={f.cat === c.key}
                    onClick={() => set({ cat: c.key, monthly: c.key === 'alquiler' || c.key === 'empleos' ? true : f.monthly })}>
                    <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>{c.code}</span>
                      <Icon name={c.key} size={22} stroke={2.2} />
                    </span>
                    <span>{c.name}</span>
                    {c.free && <span className="mono" style={{ fontSize: 11, fontWeight: 700, background: 'var(--y)', color: '#111', padding: '2px 6px' }}>GRATIS</span>}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={{ fontSize: 28 }}>Datos y fotos</h2>
              <label className="fld">
                Título del anuncio
                <input className={`inp ${errors.title ? 'bad' : ''}`} value={f.title} maxLength={80} onChange={(e) => set({ title: e.target.value })} placeholder="Ej. Terreno de 300 m² con vista al nevado" />
                <span style={{ display: 'flex', justifyContent: 'space-between' }}>{err('title') ?? <span />}<span className="counter">{f.title.length}/80</span></span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <label className="fld" style={{ flex: '1 1 200px' }}>
                  {f.cat === 'empleos' ? 'Sueldo' : f.cat === 'mascotas' ? 'Recompensa' : 'Precio'}
                  <input className={`inp ${errors.price ? 'bad' : ''}`} inputMode="numeric" value={f.currency === 'NONE' ? '' : f.price} disabled={f.currency === 'NONE'}
                    onChange={(e) => set({ price: e.target.value.replace(/[^\d.]/g, '') })} placeholder={f.currency === 'NONE' ? '—' : '120000'} />
                  {err('price')}
                </label>
                <label className="fld" style={{ flex: '1 1 200px' }}>
                  Moneda
                  <select className="inp" value={f.currency} onChange={(e) => set({ currency: e.target.value as Currency })}>
                    <option value="PEN">Soles (S/)</option>
                    <option value="USD">Dólares (US$)</option>
                    <option value="NONE">{f.cat === 'mascotas' ? 'Sin monto' : 'A tratar'}</option>
                  </select>
                </label>
              </div>
              {f.currency !== 'NONE' && (
                <label className="ck"><input type="checkbox" checked={f.monthly} onChange={(e) => set({ monthly: e.target.checked })} />Es un monto mensual (alquiler, sueldo)</label>
              )}
              <label className="fld">
                Descripción
                <textarea className={`inp ${errors.desc ? 'bad' : ''}`} value={f.desc} maxLength={1500} onChange={(e) => set({ desc: e.target.value })} />
                <span style={{ display: 'flex', justifyContent: 'space-between' }}>{err('desc') ?? <span />}<span className="counter">{f.desc.length}/1500</span></span>
              </label>
              <label className="fld">
                Etiquetas <small>Separadas por coma. Ej: 300 m², Agua y luz, Título inscrito</small>
                <input className="inp" value={f.tags} onChange={(e) => set({ tags: e.target.value })} />
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>Fotos</span>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>{f.photos.length} / {MAX_PHOTOS} · LA PRIMERA ES LA PORTADA</span>
                </div>
                <div className="photos">
                  {f.photos.map((p, i) => (
                    <div key={i} className="ph pslot">
                      <img src={p} alt={`Foto ${i + 1}`} />
                      {i === 0 && <span className="mono" style={{ position: 'absolute', top: 6, left: 6, zIndex: 2, background: 'var(--y)', border: '2px solid #111', padding: '2px 6px', fontSize: 11, fontWeight: 700 }}>PORTADA</span>}
                      <div className="ops">
                        {i > 0 && <button type="button" title="Hacer portada" aria-label={`Hacer portada la foto ${i + 1}`} onClick={() => movePhoto(i, 0)}><Icon name="star" size={14} /></button>}
                        {i > 0 && <button type="button" title="Mover a la izquierda" aria-label={`Mover foto ${i + 1} a la izquierda`} onClick={() => movePhoto(i, i - 1)}><Icon name="left" size={14} stroke={3} /></button>}
                        <button type="button" title="Quitar" aria-label={`Quitar foto ${i + 1}`} onClick={() => setF((o) => ({ ...o, photos: o.photos.filter((_, j) => j !== i) }))}><Icon name="x" size={14} stroke={3} /></button>
                      </div>
                    </div>
                  ))}
                  {f.photos.length < MAX_PHOTOS && (
                    <button type="button" className={`upl ${drag ? 'drag' : ''}`} onClick={() => fileRef.current?.click()} disabled={busy}
                      onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
                      onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}>
                      <Icon name="upload" size={26} stroke={2.6} />
                      {busy ? 'Procesando…' : 'Subir fotos'}
                      <span className="mono hide-m" style={{ fontSize: 10, fontWeight: 400 }}>o arrástralas aquí</span>
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 style={{ fontSize: 28 }}>Ubicación y cliente</h2>
              <label className="fld">
                Distrito
                <select className="inp" value={f.district} onChange={(e) => { const d = districtByName(e.target.value); set({ district: d.name, lat: d.lat, lng: d.lng }); }}>
                  {DISTRICTS.map((d) => <option key={d.name}>{d.name}</option>)}
                </select>
              </label>
              <div style={{ position: 'relative', border: '3px solid #111' }}>
                <MapView lat={f.lat} lng={f.lng} exact={f.exact} height={300} zoom={14} onMove={(lat, lng) => set({ lat, lng })} />
                <span className="map-tag" style={{ left: 14, bottom: 14, fontSize: 12 }}>TOCA EL MAPA O ARRASTRA EL PIN</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <button type="button" className={`tile ${f.exact ? 'on' : ''}`} style={{ minHeight: 64, flex: '1 1 220px' }} onClick={() => set({ exact: true })}>
                  Mostrar punto exacto<span style={{ fontSize: 13, fontWeight: 500 }}>Terrenos, negocios, eventos</span>
                </button>
                <button type="button" className={`tile ${!f.exact ? 'on' : ''}`} style={{ minHeight: 64, flex: '1 1 220px' }} onClick={() => set({ exact: false })}>
                  Solo zona aproximada<span style={{ fontSize: 13, fontWeight: 500 }}>Protege la dirección del cliente</span>
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <label className="fld" style={{ flex: '1 1 220px' }}>
                  Nombre visible del anunciante
                  <input className={`inp ${errors.name ? 'bad' : ''}`} value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ej. Rosa Q." />
                  {err('name')}
                </label>
                <label className="fld" style={{ flex: '1 1 220px' }}>
                  WhatsApp del anunciante
                  <input className={`inp ${errors.phone ? 'bad' : ''}`} inputMode="tel" value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="9XX XXX XXX" />
                  {err('phone')}
                </label>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 style={{ fontSize: 28 }}>Registrar el cobro</h2>
              <p style={{ fontSize: 16 }}>¿Cómo pagó {f.name || 'el cliente'}? {free && 'Las mascotas perdidas se publican gratis.'}</p>
              <div className="pays">
                {PAYS.filter(([k]) => !free || k === 'gratis' || k === 'pendiente').map(([k, name, sub]) => (
                  <button key={k} type="button" className={`tile ${pay === k ? 'on' : ''}`} style={{ minHeight: 84 }} aria-pressed={pay === k} onClick={() => setPay(k)}>
                    <span style={{ fontSize: 20, fontWeight: 900 }}>{name}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{sub}</span>
                  </button>
                ))}
              </div>
              {(pay === 'yape' || pay === 'plin') && (
                <label className="fld">
                  N.º de operación <small>Opcional, para tu control</small>
                  <input className="inp" inputMode="numeric" value={op} onChange={(e) => setOp(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="Ej. 01234567" />
                </label>
              )}
              {!free && pay !== 'gratis' && pay !== 'pendiente' && (
                <label className="radio" style={{ background: boost ? 'var(--y)' : '#fff' }}>
                  <input type="checkbox" checked={boost} onChange={(e) => setBoost(e.target.checked)} />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    ★ También pagó el destacado · +S/ {settings.topPrice}
                    <span style={{ fontWeight: 500, fontSize: 14 }}>Sale primero en su categoría.</span>
                  </span>
                </label>
              )}
              {pay === 'pendiente' && (
                <p style={{ padding: 14, border: '3px dashed #111', fontWeight: 700 }}>
                  El anuncio quedará guardado como <b>pendiente de pago</b> y no se verá en la portada hasta que registres el cobro.
                </p>
              )}
            </>
          )}

          {step === 5 && done && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 18, padding: '12px 0' }}>
              <span className="pop" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 88, height: 88, background: 'var(--y)', border: '3px solid #111', boxShadow: '5px 5px 0 #111' }}>
                <Icon name="check" size={48} stroke={3.4} />
              </span>
              <h2 style={{ fontSize: 40, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {done.status === 'pend' ? 'Guardado como pendiente' : '¡Anuncio publicado!'}
              </h2>
              <p style={{ fontSize: 18, lineHeight: 1.5, maxWidth: '52ch' }}>
                {done.status === 'pend'
                  ? 'Cuando el cliente pague, búscalo en Anuncios → Pendientes y registra el cobro.'
                  : `Visible hasta el ${fmtDate(done.expiresAt)}. Envíale el enlace al cliente para que lo comparta.`}
              </p>
              <p className="mono" style={{ fontSize: 14, fontWeight: 700 }}>ID {done.id}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {done.status !== 'pend' && (
                  <a className="cbtn" style={{ background: 'var(--wa)', padding: '0 20px' }} target="_blank" rel="noopener"
                    href={waLink(done.seller.phone, `Hola ${done.seller.name.split(' ')[0]}, ¡tu anuncio ya está publicado en Pregón! 🎉\n"${done.title}"\n${adLink}\nEstará visible hasta el ${fmtDate(done.expiresAt)}.`)}>
                    <Icon name="wa" size={20} />Enviar enlace al cliente
                  </a>
                )}
                <a href={url(`/anuncio?id=${done.id}`)} className="btn-y" target="_blank" rel="noopener">Ver anuncio</a>
                <button type="button" className="btn-w" onClick={() => onExit(request ? 'solicitudes' : 'anuncios')}>Volver</button>
              </div>
            </div>
          )}

          {step < 5 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, borderTop: '3px solid #111', paddingTop: 22 }}>
              {step > 1 ? <button type="button" className="btn-w" onClick={() => setStep(step - 1)}>Atrás</button> : <span />}
              <button type="button" className="btn-y" onClick={next} disabled={busy}>
                {step < lastStep
                  ? 'Continuar'
                  : alreadyPaid
                    ? 'Guardar cambios'
                    : pay === 'pendiente'
                      ? 'Guardar como pendiente'
                      : charge
                        ? `Registrar S/ ${charge} y publicar`
                        : 'Publicar'}
              </button>
            </div>
          )}
        </section>

        <aside className="sticky" style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
          <p className="kicker" style={{ fontSize: 13 }}>ASÍ SE VERÁ</p>
          <div className="card" style={{ animation: 'none', margin: 0 }}>
            {f.photos.length === 0 && CAT[f.cat].kicker ? (
              <div className="band" style={{ background: 'var(--y)' }}>
                <p className="mono" style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700 }}>{CAT[f.cat].short}</p>
                <p>{CAT[f.cat].kicker}</p>
              </div>
            ) : (
              <div className="ph" style={{ height: 220 }}>
                {f.photos[0] ? <img src={f.photos[0]} alt="" /> : <span className="lbl"><Icon name="camera" size={16} />FOTO · {CAT[f.cat].short}</span>}
                {(boost || editing?.top) && <span className="badge-top">★ DESTACADO</span>}
                {f.photos.length > 0 && <span className="badge-n">1/{f.photos.length}</span>}
              </div>
            )}
            <div className="card-body">
              <h3>{preview.title}</h3>
              <p className="price">{fmtPrice(preview)}</p>
              <div className="meta">
                <span><Icon name="pin" size={15} />{f.district}</span>
                <span><Icon name="clock" size={15} />ahora</span>
              </div>
            </div>
          </div>
          {request && (
            <div className="box" style={{ padding: 20, gap: 8, borderStyle: 'dashed' }}>
              <p className="mono" style={{ fontSize: 12, fontWeight: 700 }}>SOLICITUD ORIGINAL · {request.id}</p>
              <p style={{ fontSize: 14 }}><b>Precio indicado:</b> {request.price || '—'}</p>
              {request.note && <p style={{ fontSize: 14 }}><b>Nota:</b> {request.note}</p>}
            </div>
          )}
          {needsPay && (
            <div style={{ background: '#111', color: '#fff', border: '3px solid #111', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Line l={`Anuncio por ${AD_DAYS} días`} r={free ? 'Gratis' : pay === 'gratis' ? 'Cortesía' : `S/ ${settings.adPrice}.00`} />
              {boost && !free && pay !== 'gratis' && <Line l="Destacado" r={`S/ ${settings.topPrice}.00`} />}
              {pay !== 'pendiente' && pay !== 'gratis' && <Line l="Método" r={PAY_NAME[pay]} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '2px solid #fff', paddingTop: 12, marginTop: 4 }}>
                <span style={{ fontWeight: 900, fontSize: 20 }}>Cobro</span>
                <span style={{ fontWeight: 900, fontSize: 40, color: 'var(--y)', letterSpacing: '-0.03em' }}>S/ {charge}</span>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Line({ l, r }: { l: string; r: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
      <span>{l}</span>
      <span className="mono" style={{ fontWeight: 700 }}>{r}</span>
    </div>
  );
}
