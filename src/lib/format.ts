import { DAY, HOUR, MIN, type Ad } from './data';

const nf = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 });

export const fmtNum = (n: number) => nf.format(n);

export function fmtPrice(ad: Pick<Ad, 'price' | 'currency' | 'priceSuffix' | 'priceNote'>) {
  if (ad.price == null || ad.currency === 'NONE') return ad.priceNote || 'A tratar';
  const sym = ad.currency === 'USD' ? 'US$' : 'S/';
  return `${sym} ${nf.format(ad.price)}${ad.priceSuffix ? ' ' + ad.priceSuffix : ''}`;
}

/** Precio normalizado a soles para ordenar/filtrar (1 US$ ≈ S/ 3.75) */
export const priceInPen = (ad: Ad) =>
  ad.price == null ? null : ad.currency === 'USD' ? ad.price * 3.75 : ad.price;

export function timeAgo(ts: number, now = Date.now()) {
  const d = now - ts;
  if (d < MIN) return 'ahora';
  if (d < HOUR) return `hace ${Math.floor(d / MIN)} min`;
  if (d < DAY) return `hace ${Math.floor(d / HOUR)} h`;
  const days = Math.floor(d / DAY);
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;
  return `hace ${Math.floor(days / 30)} mes${days >= 60 ? 'es' : ''}`;
}

export const daysLeft = (ad: Ad, now = Date.now()) => Math.ceil((ad.expiresAt - now) / DAY);

export type LiveStatus = 'activo' | 'vence' | 'vencido' | 'pend' | 'vendido' | 'pausado';

export function liveStatus(ad: Ad, now = Date.now()): LiveStatus {
  if (ad.status !== 'activo') return ad.status;
  const d = daysLeft(ad, now);
  if (d <= 0) return 'vencido';
  if (d <= 3) return 'vence';
  return 'activo';
}

export const isPublic = (ad: Ad, now = Date.now()) => {
  const s = liveStatus(ad, now);
  return s === 'activo' || s === 'vence';
};

export const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString('es-PE', { day: 'numeric', month: 'long' });

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

/** Quita tildes para búsqueda insensible */
export const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function waLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, '');
  const full = digits.startsWith('51') ? digits : '51' + digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}

/** Tamaño de la foto en el mosaico, estable por id */
export function cardSize(id: string): 's' | 'm' | 'l' {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (['s', 'm', 'l'] as const)[h % 3]!;
}

export const url = (path: string) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + path;
};
