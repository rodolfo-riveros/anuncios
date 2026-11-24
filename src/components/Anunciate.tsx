import { useRef, useState } from 'react';
import { AD_DAYS, CAT, CATEGORIES, DISTRICTS, type CatKey } from '../lib/data';
import { url, waLink } from '../lib/format';
import { compressImage } from '../lib/images';
import { addRequest, toast, useStore } from '../lib/store';
import Icon from './Icon';

const MAX = 5;

interface Form {
  name: string;
  phone: string;
  cat: CatKey;
  title: string;
  desc: string;
  price: string;
  district: string;
  photos: string[];
  ok: boolean;
}

const EMPTY: Form = { name: '', phone: '', cat: 'terrenos', title: '', desc: '', price: '', district: 'Urubamba', photos: [], ok: false };

export default function Anunciate() {
  const settings = useStore((s) => s.settings);
  const [f, setF] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<{ id: string; form: Form } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (ch: Partial<Form>) => {
    setF((o) => ({ ...o, ...ch }));
    setErrors((e) => {
      const n = { ...e };
      for (const k of Object.keys(ch)) delete n[k as keyof Form];
      return n;
    });
  };
  const free = Boolean(CAT[f.cat].free);

  const addFiles = async (files: FileList) => {
    const list = Array.from(files).filter((x) => x.type.startsWith('image/')).slice(0, MAX - f.photos.length);
    if (!list.length) return toast(`Máximo ${MAX} fotos`);
    setBusy(true);
    try {
      const out = await Promise.all(list.map((x) => compressImage(x, 900, 0.68)));
      setF((o) => ({ ...o, photos: [...o.photos, ...out].slice(0, MAX) }));
    } catch {
      toast('No se pudo leer una de las fotos');
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: typeof errors = {};
    if (f.name.trim().length < 2) err.name = 'Escribe tu nombre.';
    if (!/^9\d{8}$/.test(f.phone.replace(/\D/g, ''))) err.phone = 'Celular de 9 dígitos que empiece en 9.';
    if (f.title.trim().length < 8) err.title = 'Un título de al menos 8 letras.';
    if (f.desc.trim().length < 15) err.desc = 'Cuéntanos un poco más.';
    if (!f.ok) err.ok = 'Necesitamos tu autorización para contactarte.';
    if (Object.keys(err).length) {
      setErrors(err);
      return;
    }
    const id = addRequest({
      name: f.name.trim(), phone: f.phone.replace(/\D/g, ''), cat: f.cat, title: f.title.trim(), desc: f.desc.trim(),
      price: f.price.trim(), district: f.district, photos: f.photos,
    });
    if (!id) return;
    setSent({ id, form: f });
    setF(EMPTY);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const waOwner = (form?: Form, id?: string) =>
    waLink(
      settings.ownerPhone,
      form
        ? `Hola, soy ${form.name}. Envié la solicitud ${id} para anunciar en Pregón: "${form.title}" (${CAT[form.cat].name}, ${form.district}). ¿Cómo hago el pago?`
        : 'Hola, quiero publicar un anuncio en Pregón. ¿Me pueden ayudar?',
    );
  const err = (k: keyof Form) => (errors[k] ? <span className="err" role="alert">{errors[k]}</span> : null);

  return (
    <div className="wrap" style={{ paddingTop: 40, paddingBottom: 64, display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 820 }}>
        <p className="kicker">ANÚNCIATE EN PREGÓN</p>
        <h1 className="h-xl rise" style={{ fontSize: 'clamp(40px, 5.5vw, 76px)' }}>Tú nos cuentas, nosotros lo publicamos.</h1>
        <p style={{ fontSize: 19, lineHeight: 1.5 }}>
          Envía tu anuncio y nuestro equipo lo revisa, te confirma por WhatsApp y lo publica en menos de 2 horas.
          Así cuidamos que no haya estafas ni anuncios falsos.
        </p>
      </div>

      <div className="wrap2">
        <section className="box stepbox" style={{ boxShadow: '8px 8px 0 #111', padding: 32, gap: 22, minWidth: 0 }} key={sent ? 'ok' : 'form'}>
          {sent ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 18 }}>
              <span className="pop" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 88, height: 88, background: 'var(--y)', border: '3px solid #111', boxShadow: '5px 5px 0 #111' }}>
                <Icon name="check" size={48} stroke={3.4} />
              </span>
              <h2 style={{ fontSize: 40, letterSpacing: '-0.03em', lineHeight: 1 }}>¡Recibimos tu solicitud!</h2>
              <p className="mono" style={{ fontSize: 15, fontWeight: 700 }}>N.º {sent.id}</p>
              <p style={{ fontSize: 18, lineHeight: 1.5, maxWidth: '54ch' }}>
                Te escribiremos al <b>{sent.form.phone}</b> para confirmar los datos
                {CAT[sent.form.cat].free ? '. Los anuncios de mascotas perdidas son gratis.' : ` y coordinar el pago de S/ ${settings.adPrice} por Yape, Plin o efectivo.`}
                {' '}Si prefieres, escríbenos tú ahora y lo agilizamos.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <a href={waOwner(sent.form, sent.id)} target="_blank" rel="noopener" className="cbtn wa" style={{ background: 'var(--wa)', padding: '0 22px' }}>
                  <Icon name="wa" size={22} />Escribir al administrador
                </a>
                <button type="button" className="btn-w" onClick={() => setSent(null)}>Enviar otro anuncio</button>
                <a href={url('/')} className="btn-w">Ver anuncios</a>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }} noValidate>
              <h2 style={{ fontSize: 28 }}>Datos de tu anuncio</h2>
              <div className="grid-cats">
                {CATEGORIES.map((c) => (
                  <button key={c.key} type="button" className={`tile ${f.cat === c.key ? 'on' : ''}`} style={{ minHeight: 88, gap: 8 }} aria-pressed={f.cat === c.key} onClick={() => set({ cat: c.key })}>
                    <Icon name={c.key} size={22} stroke={2.2} />
                    <span style={{ fontSize: 15 }}>{c.name}</span>
                  </button>
                ))}
              </div>
              <label className="fld">
                Título
                <input className={`inp ${errors.title ? 'bad' : ''}`} value={f.title} maxLength={80} onChange={(e) => set({ title: e.target.value })} placeholder="Ej. Vendo terreno de 300 m² en Urubamba" />
                {err('title')}
              </label>
              <label className="fld">
                Descripción
                <textarea className={`inp ${errors.desc ? 'bad' : ''}`} value={f.desc} maxLength={1500} onChange={(e) => set({ desc: e.target.value })} placeholder="Medidas, estado, qué incluye, horarios…" />
                {err('desc')}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <label className="fld" style={{ flex: '1 1 200px' }}>
                  {f.cat === 'empleos' ? 'Sueldo' : f.cat === 'mascotas' ? 'Recompensa (opcional)' : 'Precio'}
                  <input className="inp" value={f.price} onChange={(e) => set({ price: e.target.value })} placeholder={f.cat === 'mascotas' ? 'Ej. 200' : 'Ej. 120000 o "a tratar"'} />
                </label>
                <label className="fld" style={{ flex: '1 1 200px' }}>
                  Distrito
                  <select className="inp" value={f.district} onChange={(e) => set({ district: e.target.value })}>
                    {DISTRICTS.map((d) => <option key={d.name}>{d.name}</option>)}
                  </select>
                </label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontWeight: 800, fontSize: 15 }}>Fotos <span style={{ fontWeight: 500, color: '#555' }}>(opcional, hasta {MAX})</span></span>
                <div className="photos">
                  {f.photos.map((p, i) => (
                    <div key={i} className="ph pslot">
                      <img src={p} alt={`Foto ${i + 1}`} />
                      <div className="ops">
                        <button type="button" aria-label={`Quitar foto ${i + 1}`} onClick={() => setF((o) => ({ ...o, photos: o.photos.filter((_, j) => j !== i) }))}><Icon name="x" size={14} stroke={3} /></button>
                      </div>
                    </div>
                  ))}
                  {f.photos.length < MAX && (
                    <button type="button" className="upl" disabled={busy} onClick={() => fileRef.current?.click()}>
                      <Icon name="upload" size={26} stroke={2.6} />{busy ? 'Procesando…' : 'Agregar fotos'}
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
              </div>

              <h2 style={{ fontSize: 24, marginTop: 8 }}>Tus datos de contacto</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <label className="fld" style={{ flex: '1 1 220px' }}>
                  Nombre
                  <input className={`inp ${errors.name ? 'bad' : ''}`} value={f.name} onChange={(e) => set({ name: e.target.value })} autoComplete="name" />
                  {err('name')}
                </label>
                <label className="fld" style={{ flex: '1 1 220px' }}>
                  WhatsApp
                  <input className={`inp ${errors.phone ? 'bad' : ''}`} inputMode="tel" value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="9XX XXX XXX" autoComplete="tel" />
                  {err('phone')}
                </label>
              </div>
              <label className="ck" style={{ alignItems: 'flex-start' }}>
                <input type="checkbox" checked={f.ok} onChange={(e) => set({ ok: e.target.checked })} />
                <span>Acepto que Pregón me contacte por WhatsApp para publicar mi anuncio y muestre mi número en él.</span>
              </label>
              {err('ok')}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, borderTop: '3px solid #111', paddingTop: 22, justifyContent: 'space-between' }}>
                <a href={waOwner()} target="_blank" rel="noopener" className="btn-w"><Icon name="wa" size={20} />Prefiero escribir por WhatsApp</a>
                <button type="submit" className="btn-y" disabled={busy}>Enviar solicitud</button>
              </div>
            </form>
          )}
        </section>

        <aside className="sticky" style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
          <div className="promo" style={{ gap: 14 }}>
            <p className="mono" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em' }}>PRECIO ÚNICO</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span className="stamp" style={{ fontSize: 88, fontWeight: 900, lineHeight: 0.85, letterSpacing: '-0.05em' }}>S/{free ? 0 : settings.adPrice}</span>
              <span style={{ fontSize: 18, fontWeight: 800 }}>por {AD_DAYS} días</span>
            </div>
            <ul className="checks" style={{ fontSize: 16 }}>
              <li><Icon name="check" size={20} stroke={3} />Hasta 10 fotos y mapa</li>
              <li><Icon name="check" size={20} stroke={3} />Botón directo a tu WhatsApp</li>
              <li><Icon name="check" size={20} stroke={3} />Destacado: +S/ {settings.topPrice}</li>
              <li><Icon name="check" size={20} stroke={3} />Mascotas perdidas: gratis</li>
            </ul>
          </div>
          <div style={{ background: '#111', color: '#fff', border: '3px solid #111', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--y)' }}>CÓMO FUNCIONA</p>
            {[
              ['01', 'Envías tu solicitud con fotos y datos.'],
              ['02', 'Te escribimos por WhatsApp y pagas por Yape, Plin o efectivo.'],
              ['03', 'Publicamos tu anuncio y te enviamos el enlace.'],
            ].map(([n, t]) => (
              <div key={n} style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
                <span className="mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--y)' }}>{n}</span>
                <span style={{ fontSize: 16, lineHeight: 1.4 }}>{t}</span>
              </div>
            ))}
          </div>
          <p className="mono" style={{ fontSize: 12, color: '#555' }}>
            Atención: lunes a sábado de 8 am a 8 pm · WhatsApp {settings.ownerPhone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}
          </p>
        </aside>
      </div>
    </div>
  );
}
