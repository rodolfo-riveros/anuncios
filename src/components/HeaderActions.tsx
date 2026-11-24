import { useMemo } from 'react';
import { isAdmin, useStore } from '../lib/store';
import { url } from '../lib/format';
import { matches } from '../lib/search';
import Icon from './Icon';

export default function HeaderActions() {
  const favs = useStore((s) => s.favs);
  const alerts = useStore((s) => s.alerts);
  const ads = useStore((s) => s.ads);
  const fresh = useMemo(
    () => alerts.reduce((n, a) => n + ads.filter((ad) => ad.createdAt > a.seenAt && matches(ad, a)).length, 0),
    [alerts, ads],
  );
  return (
    <>
      {isAdmin() && (
        <a href={url('/admin')} className="mono hide-m" style={{ color: 'var(--y)', border: '2px solid var(--y)', padding: '4px 8px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
          ADMIN
        </a>
      )}
      <a href={url('/guardados?s=alertas')} className="hicon" aria-label={`Alertas${fresh ? `, ${fresh} nuevas` : ''}`} title="Alertas de búsqueda">
        <Icon name="bell" size={20} />
        {fresh > 0 && <span className="hbadge">{fresh}</span>}
      </a>
      <a href={url('/guardados')} className="hicon" aria-label={`Guardados, ${favs.length}`} title="Guardados">
        <Icon name="heart" size={20} />
        {favs.length > 0 && <span className="hbadge">{favs.length}</span>}
      </a>
    </>
  );
}
