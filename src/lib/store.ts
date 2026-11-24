import { useSyncExternalStore } from 'react';
import {
  AD_DAYS, AD_PRICE, DAY, TOP_PRICE, seedAds, seedPayments, seedReports, seedRequests,
  type Ad, type AdRequest, type CatKey, type PayMethod, type Report, type RequestStatus,
} from './data';
import { DEFAULT_OWNER, DEMO_ADMIN } from './config';

export interface SearchAlert {
  id: string;
  q: string;
  cat: CatKey | 'todo';
  district: string;
  createdAt: number;
  /** Última vez que el visitante revisó la alerta */
  seenAt: number;
}

export interface Payment {
  id: string;
  adId: string;
  concept: string;
  method: PayMethod;
  amount: number;
  at: number;
  op?: string;
}

export interface Activity {
  at: number;
  text: string;
  kind: 'view' | 'wa' | 'req' | 'pub' | 'pay' | 'rep' | 'admin';
}

export interface Settings {
  ownerName: string;
  ownerPhone: string;
  adPrice: number;
  topPrice: number;
  simulate: boolean;
}

export interface State {
  v: 2;
  ads: Ad[];
  requests: AdRequest[];
  reports: Report[];
  payments: Payment[];
  activity: Activity[];
  settings: Settings;
  /* datos del visitante */
  favs: string[];
  recent: string[];
  alerts: SearchAlert[];
}

const KEY = 'pregon:v2';
const SESSION = 'pregon:admin';
const listeners = new Set<() => void>();
let state: State | null = null;

function initial(): State {
  const ads = seedAds();
  const now = Date.now();
  return {
    v: 2,
    ads,
    requests: seedRequests(),
    reports: seedReports(),
    payments: seedPayments(ads),
    activity: [
      { at: now - 18 * 60_000, text: 'Nueva solicitud de Hilda Condori: “Alquilo minidepartamento para pareja”', kind: 'req' },
      { at: now - 40 * 60_000, text: 'Publicaste “Se busca a Luna, perrita mestiza color canela”', kind: 'pub' },
      { at: now - 2 * 3_600_000, text: 'Nuevo reporte sobre “Auto sedán 2019 automático, como nuevo”', kind: 'rep' },
    ],
    settings: { ownerName: DEFAULT_OWNER.name, ownerPhone: DEFAULT_OWNER.phone, adPrice: AD_PRICE, topPrice: TOP_PRICE, simulate: false },
    favs: [],
    recent: [],
    alerts: [],
  };
}

function load(): State {
  if (typeof localStorage === 'undefined') return initial();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed?.v === 2 && Array.isArray(parsed.ads)) return parsed;
    }
  } catch {
    /* datos corruptos: se reinicia */
  }
  localStorage.removeItem('pregon:v1');
  const s = initial();
  persist(s);
  return s;
}

function persist(s: State): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    toast('No hay espacio para guardar. Prueba con menos fotos o más livianas.');
    return false;
  }
}

export function getState(): State {
  if (!state) state = load();
  return state;
}

export function setState(fn: (s: State) => State): boolean {
  const next = fn(getState());
  const ok = persist(next);
  if (ok) {
    state = next;
    listeners.forEach((l) => l());
  }
  return ok;
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = null;
      l();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener('storage', onStorage);
  };
}

/** El selector debe devolver una parte del estado tal cual (sin crear arrays nuevos) */
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => sel(getState()), () => sel(getState()));
}

export const uid = (p = '') => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

const log = (s: State, text: string, kind: Activity['kind']): Activity[] =>
  [{ at: Date.now(), text, kind }, ...s.activity].slice(0, 40);

/* ---------- Sesión de administrador (DEMO, no segura) ---------- */

export const isAdmin = () => typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION) === '1';

export function login(user: string, pass: string) {
  const ok = user.trim() === DEMO_ADMIN.user && pass === DEMO_ADMIN.pass;
  if (ok) sessionStorage.setItem(SESSION, '1');
  return ok;
}

export function logout() {
  sessionStorage.removeItem(SESSION);
}

/* ---------- Anuncios ---------- */

export function nextAdId(): string {
  const nums = getState().ads.map((a) => Number(a.id.replace(/\D/g, '')) || 0);
  return 'PG-' + String(Math.max(400, ...nums) + 1).padStart(5, '0');
}

export const getAd = (id: string) => getState().ads.find((a) => a.id === id);

export function patchAd(id: string, ch: Partial<Ad>, note?: string) {
  return setState((s) => ({
    ...s,
    ads: s.ads.map((a) => (a.id === id ? { ...a, ...ch } : a)),
    activity: note ? log(s, note, 'admin') : s.activity,
  }));
}

export function upsertAd(ad: Ad) {
  return setState((s) => {
    const exists = s.ads.some((a) => a.id === ad.id);
    return {
      ...s,
      ads: exists ? s.ads.map((a) => (a.id === ad.id ? ad : a)) : [ad, ...s.ads],
      activity: log(s, `${exists ? 'Editaste' : 'Publicaste'} “${ad.title}”`, 'pub'),
    };
  });
}

export function deleteAd(id: string) {
  return setState((s) => ({
    ...s,
    ads: s.ads.filter((a) => a.id !== id),
    favs: s.favs.filter((f) => f !== id),
    recent: s.recent.filter((f) => f !== id),
    activity: log(s, `Eliminaste el anuncio ${id}`, 'admin'),
  }));
}

export function renewAd(id: string, method: PayMethod = 'yape') {
  const s0 = getState();
  const ad = s0.ads.find((a) => a.id === id);
  if (!ad) return;
  setState((s) => ({
    ...s,
    ads: s.ads.map((a) => (a.id === id ? { ...a, status: 'activo', expiresAt: Math.max(Date.now(), a.expiresAt) + AD_DAYS * DAY } : a)),
    payments: [{ id: uid('p'), adId: id, concept: `Renovación · ${ad.title.slice(0, 18)}`, method, amount: method === 'gratis' ? 0 : s.settings.adPrice, at: Date.now() }, ...s.payments],
    activity: log(s, `Renovaste “${ad.title}” por ${AD_DAYS} días`, 'pay'),
  }));
}

export function boostAd(id: string, method: PayMethod = 'yape') {
  const ad = getAd(id);
  if (!ad) return;
  setState((s) => ({
    ...s,
    ads: s.ads.map((a) => (a.id === id ? { ...a, top: true } : a)),
    payments: [{ id: uid('p'), adId: id, concept: `Destacado · ${ad.title.slice(0, 18)}`, method, amount: method === 'gratis' ? 0 : s.settings.topPrice, at: Date.now() }, ...s.payments],
    activity: log(s, `Destacaste “${ad.title}”`, 'pay'),
  }));
}

/* ---------- Visitantes ---------- */

export function toggleFav(id: string) {
  setState((s) => ({ ...s, favs: s.favs.includes(id) ? s.favs.filter((f) => f !== id) : [id, ...s.favs] }));
}

export function trackView(id: string) {
  if (isAdmin()) return setState((s) => ({ ...s, recent: [id, ...s.recent.filter((r) => r !== id)].slice(0, 8) }));
  const dow = (new Date().getDay() + 6) % 7;
  setState((s) => ({
    ...s,
    recent: [id, ...s.recent.filter((r) => r !== id)].slice(0, 8),
    ads: s.ads.map((a) => (a.id === id ? { ...a, views: a.views + 1, week: a.week.map((v, i) => (i === dow ? v + 1 : v)) } : a)),
  }));
}

export function trackWa(id: string) {
  if (isAdmin()) return;
  setState((s) => ({ ...s, ads: s.ads.map((a) => (a.id === id ? { ...a, wa: a.wa + 1 } : a)) }));
}

export function addAlert(a: Pick<SearchAlert, 'q' | 'cat' | 'district'>) {
  const now = Date.now();
  setState((s) => ({ ...s, alerts: [{ ...a, id: uid('al'), createdAt: now, seenAt: now }, ...s.alerts] }));
}

export function removeAlert(id: string) {
  setState((s) => ({ ...s, alerts: s.alerts.filter((a) => a.id !== id) }));
}

export function markAlertSeen(id: string) {
  setState((s) => ({ ...s, alerts: s.alerts.map((a) => (a.id === id ? { ...a, seenAt: Date.now() } : a)) }));
}

/* ---------- Solicitudes ---------- */

export function nextRequestId() {
  const nums = getState().requests.map((r) => Number(r.id.replace(/\D/g, '')) || 0);
  return 'SOL-' + String(Math.max(0, ...nums) + 1).padStart(4, '0');
}

export function addRequest(r: Omit<AdRequest, 'id' | 'createdAt' | 'status'>) {
  const id = nextRequestId();
  const ok = setState((s) => ({
    ...s,
    requests: [{ ...r, id, createdAt: Date.now(), status: 'nueva' }, ...s.requests],
    activity: log(s, `Nueva solicitud de ${r.name}: “${r.title}”`, 'req'),
  }));
  return ok ? id : null;
}

export function setRequestStatus(id: string, status: RequestStatus, ch: Partial<AdRequest> = {}) {
  setState((s) => ({ ...s, requests: s.requests.map((r) => (r.id === id ? { ...r, ...ch, status } : r)) }));
}

/* ---------- Reportes ---------- */

export function addReport(adId: string, reason: string, detail: string) {
  setState((s) => {
    const ad = s.ads.find((a) => a.id === adId);
    return {
      ...s,
      reports: [{ id: uid('R-'), adId, reason, detail, createdAt: Date.now(), resolved: false }, ...s.reports],
      activity: log(s, `Nuevo reporte sobre “${ad?.title ?? adId}”: ${reason}`, 'rep'),
    };
  });
}

export function resolveReport(id: string) {
  setState((s) => ({ ...s, reports: s.reports.map((r) => (r.id === id ? { ...r, resolved: true } : r)) }));
}

/* ---------- Pagos y ajustes ---------- */

export function addPayment(p: Omit<Payment, 'id' | 'at'>) {
  setState((s) => ({
    ...s,
    payments: [{ ...p, id: uid('p'), at: Date.now() }, ...s.payments],
    activity: p.amount ? log(s, `Registraste un pago de S/ ${p.amount} (${p.concept})`, 'pay') : s.activity,
  }));
}

export function setSettings(ch: Partial<Settings>) {
  setState((s) => ({ ...s, settings: { ...s.settings, ...ch } }));
}

export function pushActivity(text: string, kind: Activity['kind']) {
  setState((s) => ({ ...s, activity: log(s, text, kind) }));
}

export function resetDemo() {
  const s = initial();
  persist(s);
  state = s;
  listeners.forEach((l) => l());
}

export function toast(msg: string) {
  window.dispatchEvent(new CustomEvent('pregon:toast', { detail: msg }));
}
