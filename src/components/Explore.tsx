import { useEffect, useMemo, useRef, useState } from 'react';
import { CAT, CATEGORIES, DISTRICTS, TICKER_TAG, AD_PRICE, type CatKey } from '../lib/data';
import { isPublic, url } from '../lib/format';
import { EMPTY, alertLabel, filtersFromUrl, filtersToQuery, search, type Filters, type Sort } from '../lib/search';
import { addAlert, toast, useStore } from '../lib/store';
import AdCard, { MiniCard } from './AdCard';
import Icon from './Icon';

const PAGE = 12;

export default function Explore() {
  const ads = useStore((s) => s.ads);
  const favs = useStore((s) => s.favs);
  const recentIds = useStore((s) => s.recent);
  const alerts = useStore((s) => s.alerts);
  const [f, setF] = useState<Filters>(() => filtersFromUrl());
  const [qDraft, setQDraft] = useState(f.q);
  const [limit, setLimit] = useState(PAGE);
  const [more, setMore] = useState(Boolean(f.min || f.max || f.fotos || f.sort !== 'recientes'));
  const qRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // sincroniza filtros con la URL (enlaces compartibles)
  useEffect(() => {
    history.replaceState(null, '', location.pathname + filtersToQuery(f) + location.hash);
    setLimit(PAGE);
  }, [f]);

  // búsqueda en vivo con pequeño retraso
  useEffect(() => {
    const t = setTimeout(() => setF((o) => (o.q === qDraft ? o : { ...o, q: qDraft })), 220);
    return () => clearTimeout(t);
  }, [qDraft]);

  useEffect(() => {
    if (new URLSearchParams(location.search).get('buscar')) qRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        qRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const now = Date.now();
  const results = useMemo(() => search(ads, f, now), [ads, f]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { todo: 0 };
    for (const a of ads) {
      if (!isPublic(a, now)) continue;
      if (f.district && a.district !== f.district) continue;
      c.todo!++;
      c[a.cat] = (c[a.cat] ?? 0) + 1;
    }
    return c;
  }, [ads, f.district]);
  const ticker = useMemo(() => {
    const list = ads
      .filter((a) => isPublic(a, now))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 8);
    return list.concat(list);
  }, [ads]);
  const recent = useMemo(
    () => recentIds.map((id) => ads.find((a) => a.id === id)).filter((a) => a && isPublic(a, now)) as typeof ads,
    [recentIds, ads],
  );

  const set = (ch: Partial<Filters>) => setF((o) => ({ ...o, ...ch }));
  const hasFilters = f.q || f.cat !== 'todo' || f.district || f.min || f.max || f.fotos;
  const alreadyAlert = alerts.some((a) => a.q === f.q && a.cat === f.cat && a.district === f.district);
  const title = f.cat === 'todo' ? (f.q ? `Resultados para “${f.q}”` : 'Todos los anuncios') : CAT[f.cat].name;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    set({ q: qDraft });
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const clear = () => {
    setQDraft('');
    setF(EMPTY);
  };

  return (
    <>
      <div className="ticker" aria-label="Recién publicado">
        <div className="track">
          {ticker.map((a, i) => (
            <a key={i} href={url(`/anuncio?id=${a.id}`)} className="tick" tabIndex={i >= ticker.length / 2 ? -1 : 0}>
              <b>{i < 3 ? 'NUEVO' : TICKER_TAG[a.cat]}</b>
              {a.title} · {a.district}
              <span aria-hidden="true">★</span>
            </a>
          ))}
        </div>
      </div>

      <section className="wrap" style={{ paddingTop: 48, paddingBottom: 32 }}>
        <div className="hero">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'center' }}>
            <p className="kicker">URUBAMBA · VALLE SAGRADO · CUSCO</p>
            <h1 className="h-xl rise">Lo que se vende, se busca y se ofrece en el Valle.</h1>
            <form role="search" className="searchbar" onSubmit={submit}>
              <div className="cell">
                <Icon name="search" size={22} />
                <label htmlFor="q" className="sr">Buscar anuncios</label>
                <input
                  ref={qRef}
                  id="q"
                  type="search"
                  placeholder="Terreno en Yucay, perro perdido, mesero…"
                  value={qDraft}
                  onChange={(e) => setQDraft(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="cell">
                <Icon name="pin" size={20} />
                <label htmlFor="lugar" className="sr">Lugar</label>
                <select id="lugar" value={f.district} onChange={(e) => set({ district: e.target.value })}>
                  <option value="">Toda la provincia</option>
                  {DISTRICTS.map((d) => (
                    <option key={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit">Buscar</button>
            </form>
            <p className="mono hide-m" style={{ fontSize: 12, color: '#555' }}>
              Tip: presiona <kbd style={{ border: '2px solid #111', padding: '0 5px', background: '#fff' }}>/</kbd> para buscar desde cualquier parte.
            </p>
          </div>
          <div className="promo">
            <p className="mono" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em' }}>TU ANUNCIO AQUÍ</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span className="stamp" style={{ fontSize: 104, fontWeight: 900, lineHeight: 0.85, letterSpacing: '-0.05em' }}>
                S/{AD_PRICE}
              </span>
              <span style={{ fontSize: 20, fontWeight: 800 }}>por 30 días</span>
            </div>
            <ul className="checks">
              {['Hasta 10 fotos en galería', 'Ubicación en el mapa', 'Te escriben directo a tu WhatsApp', 'Mascotas perdidas: ¡gratis!'].map((t) => (
                <li key={t}><Icon name="check" size={20} stroke={3} />{t}</li>
              ))}
            </ul>
            <a href={url('/anunciate')} className="btn-k" style={{ minHeight: 56 }}>Quiero anunciar</a>
          </div>
        </div>
      </section>

      <section aria-label="Categorías" className="wrap" style={{ paddingTop: 8, paddingBottom: 16 }}>
        <div className="cats">
          {[{ key: 'todo' as const, name: 'Todo' }, ...CATEGORIES].map((c) => (
            <button
              key={c.key}
              type="button"
              className={`chip ${f.cat === c.key ? 'on' : ''}`}
              aria-pressed={f.cat === c.key}
              onClick={() => set({ cat: c.key as CatKey | 'todo' })}
            >
              <Icon name={c.key} size={20} stroke={2.2} />
              {c.name}
              <span className="n">{counts[c.key] ?? 0}</span>
            </button>
          ))}
        </div>
      </section>

      {recent.length > 0 && !hasFilters && (
        <section className="wrap" style={{ paddingTop: 8, paddingBottom: 24 }} aria-label="Vistos recientemente">
          <p className="kicker" style={{ marginBottom: 12 }}>VISTOS RECIENTEMENTE</p>
          <div className="rail">
            {recent.map((a) => <MiniCard key={a.id} ad={a} />)}
          </div>
        </section>
      )}

      <div className="wrap" style={{ paddingTop: 8, paddingBottom: 56, scrollMarginTop: 90 }} ref={resultsRef}>
        <div className="section-h">
          <h2>{title}</h2>
          <p className="mono" style={{ fontSize: 14, fontWeight: 700 }} aria-live="polite">
            {results.length} ANUNCIO{results.length === 1 ? '' : 'S'} · {SORT_LABEL[f.sort]}
          </p>
        </div>

        <div className="toolbar">
          <button type="button" className={`tab ${more ? 'on' : ''}`} onClick={() => setMore(!more)} aria-expanded={more}>
            <Icon name="filter" size={18} />Filtros
          </button>
          <label className="sr" htmlFor="orden">Ordenar</label>
          <select id="orden" className="sel" value={f.sort} onChange={(e) => set({ sort: e.target.value as Sort })}>
            <option value="recientes">Más recientes</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
            <option value="populares">Más vistos</option>
          </select>
          {more && (
            <>
              <input className="sel sm" type="number" min={0} inputMode="numeric" placeholder="S/ mín." aria-label="Precio mínimo en soles" value={f.min} onChange={(e) => set({ min: e.target.value })} />
              <input className="sel sm" type="number" min={0} inputMode="numeric" placeholder="S/ máx." aria-label="Precio máximo en soles" value={f.max} onChange={(e) => set({ max: e.target.value })} />
              <label className="ck"><input type="checkbox" checked={f.fotos} onChange={(e) => set({ fotos: e.target.checked })} />Solo con fotos</label>
            </>
          )}
          <span style={{ flex: 1 }} />
          {hasFilters && (
            <button type="button" className="pill-x" onClick={clear}><Icon name="x" size={14} stroke={3} />Limpiar</button>
          )}
          <button
            type="button"
            className="act y"
            disabled={alreadyAlert}
            onClick={() => {
              addAlert({ q: f.q, cat: f.cat, district: f.district });
              toast(`Te avisaremos de nuevos anuncios: ${alertLabel(f, (k) => CAT[k].name)}`);
            }}
          >
            <Icon name="bell" size={18} />
            {alreadyAlert ? 'Alerta activa' : 'Avísame de nuevos'}
          </button>
        </div>

        {results.length === 0 ? (
          <div className="empty">
            <Icon name="search" size={40} />
            No encontramos anuncios con esos filtros.
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button type="button" className="btn-w" onClick={clear}>Ver todos</button>
              <a className="btn-y" href={url('/anunciate')}>Publica lo que buscas</a>
            </div>
          </div>
        ) : (
          <div className="masonry">
            {results.slice(0, limit).map((a, i) => (
              <AdCard key={a.id} ad={a} fav={favs.includes(a.id)} delay={i} />
            ))}
          </div>
        )}
        {results.length > limit && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
            <button type="button" className="btn-w" onClick={() => setLimit(limit + PAGE)}>
              Ver más anuncios ({results.length - limit})
            </button>
          </div>
        )}
      </div>
    </>
  );
}

const SORT_LABEL: Record<Sort, string> = {
  recientes: 'MÁS RECIENTES PRIMERO',
  'precio-asc': 'MÁS BARATOS PRIMERO',
  'precio-desc': 'MÁS CAROS PRIMERO',
  populares: 'MÁS VISTOS PRIMERO',
};
