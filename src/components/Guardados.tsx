import { useEffect, useMemo, useState } from 'react';
import { CAT, type Ad } from '../lib/data';
import { isPublic, timeAgo, url } from '../lib/format';
import { EMPTY, alertLabel, filtersToQuery, matches } from '../lib/search';
import { markAlertSeen, removeAlert, setState, toast, useStore } from '../lib/store';
import AdCard from './AdCard';
import Icon from './Icon';

type Tab = 'guardados' | 'alertas';

/** Favoritos y alertas del visitante (se guardan en su navegador) */
export default function Guardados() {
  const [tab, setTab] = useState<Tab>(() => (new URLSearchParams(location.search).get('s') === 'alertas' ? 'alertas' : 'guardados'));
  const ads = useStore((s) => s.ads);
  const favs = useStore((s) => s.favs);
  const alerts = useStore((s) => s.alerts);

  useEffect(() => {
    history.replaceState(null, '', location.pathname + (tab === 'alertas' ? '?s=alertas' : ''));
  }, [tab]);

  const fresh = useMemo(() => alerts.map((a) => ads.filter((ad) => ad.createdAt > a.seenAt && matches(ad, a)).length), [alerts, ads]);
  const list = favs.map((id) => ads.find((a) => a.id === id)).filter(Boolean) as Ad[];
  const live = list.filter((a) => isPublic(a));
  const gone = list.filter((a) => !isPublic(a));

  return (
    <div className="wrap" style={{ paddingTop: 36, paddingBottom: 64, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 0.95 }}>Lo que te interesa</h1>
      <div style={{ display: 'flex', gap: 10 }} role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'guardados'} className={`tab ${tab === 'guardados' ? 'on' : ''}`} onClick={() => setTab('guardados')}>
          <Icon name="heart" size={18} />Guardados<span className="n">{favs.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === 'alertas'} className={`tab ${tab === 'alertas' ? 'on' : ''}`} onClick={() => setTab('alertas')}>
          <Icon name="bell" size={18} />Alertas<span className="n">{alerts.length}</span>
        </button>
      </div>
      <p className="mono" style={{ fontSize: 12, color: '#555' }}>Se guardan solo en este dispositivo, no necesitas cuenta.</p>

      {tab === 'guardados' && (
        <>
          {list.length === 0 ? (
            <div className="empty">
              <Icon name="heart" size={40} />
              Aún no guardas anuncios. Toca el corazón en cualquier anuncio para tenerlo a mano.
              <a href={url('/')} className="btn-y">Explorar anuncios</a>
            </div>
          ) : (
            <div className="masonry">{live.map((a, i) => <AdCard key={a.id} ad={a} fav delay={i} />)}</div>
          )}
          {gone.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p className="kicker" style={{ fontSize: 13 }}>YA NO DISPONIBLES</p>
              {gone.map((a) => (
                <div key={a.id} className="line" style={{ alignItems: 'center' }}>
                  <span style={{ textDecoration: 'line-through' }}>{a.title}</span>
                  <button type="button" className="pill-x" onClick={() => setState((s) => ({ ...s, favs: s.favs.filter((f) => f !== a.id) }))}>Quitar</button>
                </div>
              ))}
            </section>
          )}
        </>
      )}

      {tab === 'alertas' && (
        <>
          <p style={{ fontSize: 17, lineHeight: 1.5, maxWidth: '60ch' }}>
            Haz una búsqueda en la portada y toca <b>“Avísame de nuevos”</b>. Aquí verás cuántos anuncios nuevos coinciden.
          </p>
          {alerts.length === 0 ? (
            <div className="empty">
              <Icon name="bell" size={40} />
              No tienes alertas todavía.
              <a href={url('/?cat=terrenos')} className="btn-y">Crear una alerta</a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {alerts.map((a, i) => (
                <article key={a.id} className="row" style={{ gridTemplateColumns: 'auto minmax(0,1fr) auto' }}>
                  <span style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: fresh[i] ? 'var(--y)' : '#fff', border: '3px solid #111' }}>
                    <Icon name="bell" size={24} />
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <h3 style={{ fontSize: 19, fontWeight: 800 }}>{alertLabel(a, (k) => CAT[k].name)}</h3>
                    <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>
                      {fresh[i] ? `${fresh[i]} NUEVO${fresh[i] === 1 ? '' : 'S'}` : 'SIN NOVEDADES'} · CREADA {timeAgo(a.createdAt).toUpperCase()}
                    </span>
                  </div>
                  <div className="acts" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <a className="act k" href={url('/' + filtersToQuery({ ...EMPTY, q: a.q, cat: a.cat, district: a.district }))} onClick={() => markAlertSeen(a.id)}>Ver resultados</a>
                    <button type="button" className="act danger" onClick={() => { removeAlert(a.id); toast('Alerta eliminada'); }} aria-label="Eliminar alerta"><Icon name="trash" size={18} /></button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
