import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const PIN = L.divIcon({
  className: 'pin-icon',
  html: '<svg width="44" height="52" viewBox="0 0 24 28"><path d="M12 27s-10-8.5-10-15a10 10 0 0 1 20 0c0 6.5-10 15-10 15z" fill="#111"/><circle cx="12" cy="12" r="4" fill="#FFD400"/></svg>',
  iconSize: [44, 52],
  iconAnchor: [22, 52],
});

/** Radio de la zona aproximada en metros */
const APPROX_R = 450;

/**
 * Mapa de OpenStreetMap. Con `onMove` el pin es arrastrable (formulario de publicar).
 * Si `exact` es falso solo se muestra un círculo de zona aproximada.
 */
export default function MapView({
  lat,
  lng,
  exact,
  onMove,
  height = 340,
  zoom = 15,
}: {
  lat: number;
  lng: number;
  exact: boolean;
  onMove?: (lat: number, lng: number) => void;
  height?: number;
  zoom?: number;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map>(null);
  const marker = useRef<L.Marker>(null);
  const circle = useRef<L.Circle>(null);
  const moveRef = useRef(onMove);
  moveRef.current = onMove;

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { scrollWheelZoom: false, attributionControl: true }).setView([lat, lng], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(m);
    circle.current = L.circle([lat, lng], {
      radius: APPROX_R,
      color: '#111',
      weight: 3,
      dashArray: '8 6',
      fillColor: '#FFD400',
      fillOpacity: 0.3,
    });
    marker.current = L.marker([lat, lng], { icon: PIN, draggable: Boolean(onMove), keyboard: true, title: 'Ubicación' });
    marker.current.on('dragend', () => {
      const p = marker.current!.getLatLng();
      moveRef.current?.(p.lat, p.lng);
    });
    if (onMove) {
      m.on('click', (e: L.LeafletMouseEvent) => moveRef.current?.(e.latlng.lat, e.latlng.lng));
    }
    map.current = m;
    // corrige tamaño cuando el contenedor aparece con animación
    const t = setTimeout(() => m.invalidateSize(), 300);
    return () => {
      clearTimeout(t);
      m.remove();
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    marker.current!.setLatLng([lat, lng]);
    circle.current!.setLatLng([lat, lng]);
    // en modo aproximado se oculta el pin para no revelar la casa (salvo al editar)
    if (exact || onMove) marker.current!.addTo(m);
    else marker.current!.remove();
    if (!exact) circle.current!.addTo(m);
    else circle.current!.remove();
    if (!m.getBounds().pad(-0.2).contains([lat, lng])) m.panTo([lat, lng]);
  }, [lat, lng, exact]);

  return <div ref={el} className="map" style={{ height }} role="application" aria-label="Mapa de ubicación" />;
}
