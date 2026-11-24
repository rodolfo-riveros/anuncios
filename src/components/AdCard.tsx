import { useState } from 'react';
import { CAT, type Ad } from '../lib/data';
import { cardSize, fmtPrice, timeAgo, url } from '../lib/format';
import { toggleFav } from '../lib/store';
import Icon from './Icon';

export const photoCount = (ad: Ad) => ad.photos.length || ad.photoLabels.length;

/** Foto real o marcador rayado del diseño */
export function Photo({
  ad,
  i = 0,
  className = '',
  style,
  label,
  children,
}: {
  ad: Ad;
  i?: number;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  children?: React.ReactNode;
}) {
  const src = ad.photos[i];
  const [broken, setBroken] = useState<string | null>(null);
  return (
    <div className={`ph ${className}`} style={style}>
      {src && broken !== src ? (
        <img
          src={src}
          alt={ad.photoLabels[i] ? `${ad.title} — ${ad.photoLabels[i]}` : `${ad.title} — foto ${i + 1}`}
          loading="lazy"
          onError={() => setBroken(src)}
        />
      ) : (
        <span className="lbl">
          <Icon name="camera" size={16} stroke={2.2} />
          {label ?? `FOTO · ${CAT[ad.cat].short}`}
        </span>
      )}
      {children}
    </div>
  );
}

export const adHref = (ad: Ad) => url(`/anuncio?id=${ad.id}`);

export default function AdCard({ ad, fav, delay = 0 }: { ad: Ad; fav: boolean; delay?: number }) {
  const c = CAT[ad.cat];
  const n = photoCount(ad);
  const kicker = n === 0;
  return (
    <a href={adHref(ad)} className="card" style={{ animationDelay: `${Math.min(delay, 8) * 60}ms` }}>
      <button
        type="button"
        className={`fav-mini ${fav ? 'on' : ''}`}
        aria-label={fav ? 'Quitar de guardados' : 'Guardar anuncio'}
        aria-pressed={fav}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFav(ad.id);
        }}
      >
        <Icon name="heart" size={20} />
      </button>
      {kicker ? (
        <div className="band" style={{ background: ad.top || ad.cat === 'empleos' ? 'var(--y)' : '#fff' }}>
          <p className="mono" style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, letterSpacing: '.08em' }}>
            {c.short}
          </p>
          <p>{c.kicker ?? 'ANUNCIO'}</p>
        </div>
      ) : (
        <Photo ad={ad} className={cardSize(ad.id)}>
          {ad.top && <span className="badge-top">★ DESTACADO</span>}
          <span className="badge-n">1/{n}</span>
        </Photo>
      )}
      <div className="card-body">
        <h3>{ad.title}</h3>
        <p className="price">{fmtPrice(ad)}</p>
        <div className="meta">
          <span><Icon name="pin" size={15} />{ad.district}</span>
          <span><Icon name="clock" size={15} />{timeAgo(ad.createdAt)}</span>
        </div>
      </div>
    </a>
  );
}

export function MiniCard({ ad }: { ad: Ad }) {
  return (
    <a href={adHref(ad)} className="mini">
      <Photo ad={ad} label="FOTO" />
      <div className="mini-b">
        <h3>{ad.title}</h3>
        <p className="p">{fmtPrice(ad)}</p>
        <p className="c">{ad.district} · {timeAgo(ad.createdAt)}</p>
      </div>
    </a>
  );
}
