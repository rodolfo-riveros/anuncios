import { CAT, type Ad, type CatKey } from './data';
import { isPublic, norm, priceInPen } from './format';

export type Sort = 'recientes' | 'precio-asc' | 'precio-desc' | 'populares';

export interface Filters {
  q: string;
  cat: CatKey | 'todo';
  district: string; // '' = toda la provincia
  min: string;
  max: string;
  fotos: boolean;
  sort: Sort;
}

export const EMPTY: Filters = { q: '', cat: 'todo', district: '', min: '', max: '', fotos: false, sort: 'recientes' };

export function matches(ad: Ad, f: Pick<Filters, 'q' | 'cat' | 'district'> & Partial<Filters>, now = Date.now()) {
  if (!isPublic(ad, now)) return false;
  if (f.cat !== 'todo' && ad.cat !== f.cat) return false;
  if (f.district && ad.district !== f.district) return false;
  if (f.q) {
    const hay = norm([ad.title, ad.desc, ad.district, CAT[ad.cat].name, ...ad.tags].join(' '));
    const words = norm(f.q).split(/\s+/).filter(Boolean);
    if (!words.every((w) => hay.includes(w))) return false;
  }
  const p = priceInPen(ad);
  if (f.min && (p == null || p < Number(f.min))) return false;
  if (f.max && (p == null || p > Number(f.max))) return false;
  if (f.fotos && ad.photos.length + ad.photoLabels.length === 0) return false;
  return true;
}

export function search(ads: Ad[], f: Filters, now = Date.now()) {
  const list = ads.filter((a) => matches(a, f, now));
  const byPrice = (a: Ad) => priceInPen(a);
  list.sort((a, b) => {
    if (f.sort === 'precio-asc' || f.sort === 'precio-desc') {
      const pa = byPrice(a), pb = byPrice(b);
      if (pa == null && pb == null) return b.createdAt - a.createdAt;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return f.sort === 'precio-asc' ? pa - pb : pb - pa;
    }
    if (f.sort === 'populares') return b.views - a.views;
    // recientes, con destacados primero
    if (a.top !== b.top) return a.top ? -1 : 1;
    return b.createdAt - a.createdAt;
  });
  return list;
}

export function filtersFromUrl(): Filters {
  const p = new URLSearchParams(location.search);
  return {
    q: p.get('q') ?? '',
    cat: (p.get('cat') as Filters['cat']) || 'todo',
    district: p.get('lugar') ?? '',
    min: p.get('min') ?? '',
    max: p.get('max') ?? '',
    fotos: p.get('fotos') === '1',
    sort: (p.get('orden') as Sort) || 'recientes',
  };
}

export function filtersToQuery(f: Filters) {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.cat !== 'todo') p.set('cat', f.cat);
  if (f.district) p.set('lugar', f.district);
  if (f.min) p.set('min', f.min);
  if (f.max) p.set('max', f.max);
  if (f.fotos) p.set('fotos', '1');
  if (f.sort !== 'recientes') p.set('orden', f.sort);
  const s = p.toString();
  return s ? '?' + s : '';
}

export function alertLabel(a: { q: string; cat: CatKey | 'todo'; district: string }, catName: (k: CatKey) => string) {
  const parts = [a.q && `“${a.q}”`, a.cat !== 'todo' && catName(a.cat), a.district || 'Toda la provincia'].filter(Boolean);
  return parts.join(' · ');
}
