import { SIM_NAMES, SIM_REQUESTS } from './data';
import { isPublic } from './format';
import { addRequest, getState, setState, toast } from './store';

/**
 * Simula visitantes reales mientras el panel de administración está abierto:
 * suma vistas y clics a WhatsApp, y cada cierto tiempo llega una solicitud nueva.
 * Devuelve una función para detenerla.
 */
export function startSimulation(onEvent?: (text: string) => void) {
  let tick = 0;
  const id = window.setInterval(() => {
    tick++;
    const s = getState();
    const pub = s.ads.filter((a) => isPublic(a));
    if (!pub.length) return;

    // 1–3 visitas por ciclo, más probables en destacados
    const visits = 1 + Math.floor(Math.random() * 3);
    const dow = (new Date().getDay() + 6) % 7;
    const hits = new Map<string, { v: number; w: number }>();
    for (let i = 0; i < visits; i++) {
      const pool = Math.random() < 0.45 ? pub.filter((a) => a.top) : pub;
      const ad = (pool.length ? pool : pub)[Math.floor(Math.random() * (pool.length || pub.length))]!;
      const h = hits.get(ad.id) ?? { v: 0, w: 0 };
      h.v++;
      if (Math.random() < 0.18) h.w++;
      hits.set(ad.id, h);
    }
    const waEvents: string[] = [];
    setState((st) => ({
      ...st,
      ads: st.ads.map((a) => {
        const h = hits.get(a.id);
        if (!h) return a;
        if (h.w) waEvents.push(`Alguien escribió por WhatsApp a “${a.title}”`);
        return { ...a, views: a.views + h.v, wa: a.wa + h.w, week: a.week.map((v, i) => (i === dow ? v + h.v : v)) };
      }),
      activity: waEvents.length
        ? [...waEvents.map((text) => ({ at: Date.now(), text, kind: 'wa' as const })), ...st.activity].slice(0, 40)
        : st.activity,
    }));
    waEvents.forEach((t) => onEvent?.(t));

    // una solicitud nueva aprox. cada 25–40 s
    if (tick % 8 === 0 && Math.random() < 0.85) {
      const tpl = SIM_REQUESTS[Math.floor(Math.random() * SIM_REQUESTS.length)]!;
      const name = Math.random() < 0.5 ? tpl.name : `${SIM_NAMES[Math.floor(Math.random() * SIM_NAMES.length)]} ${tpl.name.split(' ').slice(-1)[0]}`;
      const reqId = addRequest({ ...tpl, name });
      if (reqId) {
        const msg = `Nueva solicitud ${reqId} de ${name}`;
        toast(msg);
        onEvent?.(msg);
      }
    }
  }, 4000);
  return () => clearInterval(id);
}
