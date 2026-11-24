export type CatKey =
  | 'terrenos'
  | 'mascotas'
  | 'empleos'
  | 'vehiculos'
  | 'alquiler'
  | 'servicios'
  | 'venta'
  | 'eventos';

export interface Category {
  key: CatKey;
  name: string;
  short: string;
  code: string;
  /** Texto grande para anuncios sin foto (empleos, servicios) */
  kicker?: string;
  free?: boolean;
}

export const CATEGORIES: Category[] = [
  { key: 'terrenos', name: 'Terrenos y casas', short: 'TERRENOS', code: 'TER' },
  { key: 'mascotas', name: 'Mascotas perdidas', short: 'MASCOTAS', code: 'MAS', free: true },
  { key: 'empleos', name: 'Empleos', short: 'EMPLEOS', code: 'EMP', kicker: 'SE NECESITA' },
  { key: 'vehiculos', name: 'Vehículos', short: 'VEHÍCULOS', code: 'VEH' },
  { key: 'alquiler', name: 'Alquileres', short: 'ALQUILERES', code: 'ALQ' },
  { key: 'servicios', name: 'Servicios', short: 'SERVICIOS', code: 'SER', kicker: 'A DOMICILIO' },
  { key: 'venta', name: 'Compra y venta', short: 'COMPRA Y VENTA', code: 'VTA' },
  { key: 'eventos', name: 'Eventos', short: 'EVENTOS', code: 'EVE' },
];

export const CAT: Record<CatKey, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c]),
) as Record<CatKey, Category>;

export interface District {
  name: string;
  lat: number;
  lng: number;
}

export const DISTRICTS: District[] = [
  { name: 'Urubamba', lat: -13.3048, lng: -72.1158 },
  { name: 'Ollantaytambo', lat: -13.2583, lng: -72.2636 },
  { name: 'Yucay', lat: -13.3197, lng: -72.0839 },
  { name: 'Huayllabamba', lat: -13.3389, lng: -72.0647 },
  { name: 'Maras', lat: -13.3353, lng: -72.1556 },
  { name: 'Chinchero', lat: -13.3917, lng: -72.0486 },
  { name: 'Calca', lat: -13.3228, lng: -71.9561 },
  { name: 'Machupicchu', lat: -13.1547, lng: -72.5254 },
];

export const districtByName = (n: string) =>
  DISTRICTS.find((d) => d.name === n) ?? DISTRICTS[0]!;

export type Currency = 'PEN' | 'USD' | 'NONE';
/** pausado = oculto por el administrador (ej. tras un reporte) */
export type Status = 'activo' | 'pend' | 'vendido' | 'pausado';
export type PayMethod = 'yape' | 'plin' | 'tarjeta' | 'efectivo' | 'gratis';

export const PAY_NAME: Record<PayMethod, string> = {
  yape: 'Yape',
  plin: 'Plin',
  tarjeta: 'Tarjeta',
  efectivo: 'Efectivo',
  gratis: 'Cortesía',
};

export interface Ad {
  id: string;
  cat: CatKey;
  title: string;
  /** null = sin precio, se muestra priceNote */
  price: number | null;
  currency: Currency;
  priceSuffix?: string;
  priceNote?: string;
  desc: string;
  tags: string[];
  district: string;
  lat: number;
  lng: number;
  exact: boolean;
  /** URLs o data URLs de las fotos */
  photos: string[];
  /** Descripción corta de cada foto (texto alternativo) */
  photoLabels: string[];
  createdAt: number;
  expiresAt: number;
  status: Status;
  top: boolean;
  /** Datos de contacto del anunciante (cliente) */
  seller: { name: string; phone: string; since: number; verified: boolean };
  views: number;
  wa: number;
  /** Vistas por día de la semana (LUN..DOM) */
  week: number[];
  /** Solicitud de origen, si vino desde el formulario público */
  requestId?: string;
}

export type RequestStatus = 'nueva' | 'contactado' | 'publicada' | 'rechazada';

export interface AdRequest {
  id: string;
  createdAt: number;
  name: string;
  phone: string;
  cat: CatKey;
  title: string;
  desc: string;
  price: string;
  district: string;
  photos: string[];
  status: RequestStatus;
  note?: string;
  adId?: string;
}

export interface Report {
  id: string;
  adId: string;
  reason: string;
  detail: string;
  createdAt: number;
  resolved: boolean;
}

export const DAY = 86_400_000;
export const HOUR = 3_600_000;
export const MIN = 60_000;
export const AD_DAYS = 30;
export const AD_PRICE = 5;
export const TOP_PRICE = 3;

/* ---------- Fotos de prueba (Unsplash) ---------- */

const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=1000&q=70&auto=format&fit=crop`;

export const PHOTOS = {
  land: ['1531065208531-4036c0dba3ca', '1500382017468-9049fed747ef', '1464822759023-fed622ff2c3b', '1500076656116-558758c991c1', '1416879595882-3373a0480b5b', '1526392060635-9d6019884377', '1587595431973-160d0d94add1', '1580619305218-8423a7ef79b4'].map(U),
  house: ['1449844908441-8829872d2607', '1568605114967-8130f3a36994', '1570129477492-45c003edd2be', '1564013799919-ab600027ffc6', '1600585154340-be6161a56a0c'].map(U),
  room: ['1505693416388-ac5ce068fe85', '1522708323590-d24dbb6b0267', '1502672260266-1c1ef2d93688', '1484154218962-a197022b5858'].map(U),
  dog: ['1587300003388-59208cc962cb', '1543466835-00a7907e9de1', '1552053831-71594a27632d', '1517849845537-4d257902454a'].map(U),
  cat: ['1514888286974-6c03e2ca1dba', '1574158622682-e40e69881006'].map(U),
  moto: ['1558981806-ec527fa84c39', '1568772585407-9361f9bf3a87'].map(U),
  car: ['1559416523-140ddc3d238c', '1494976388531-d1058494cdd8', '1533473359331-0135ef1b58bf', '1503376780353-7e6692767b70'].map(U),
  bike: ['1485965120184-e220f721d03e', '1532298229144-0ec0c57515c7'].map(U),
  textile: ['1601924994987-69e26d50dc26', '1488459716781-31db52582fe9'].map(U),
  food: ['1504674900247-0877df9cc836', '1414235077428-338989a2e8c0', '1555396273-367ea4eb4db5', '1556910103-1c02745aae4d'].map(U),
  veg: ['1464226184884-fa280b87c399', '1488459716781-31db52582fe9'].map(U),
  tools: ['1621905251189-08b45d6a269e', '1581578731548-c64695cc6952'].map(U),
  event: ['1533174072545-7a4b6ad7a6c3', '1492684223066-81342ee5ff30', '1514525253161-7a46d19cd819'].map(U),
};

/** Toma n fotos de una o varias colecciones, rotando desde `start` */
function pick(pools: (keyof typeof PHOTOS)[], n: number, start = 0) {
  const all = pools.flatMap((p) => PHOTOS[p]);
  return Array.from({ length: Math.min(n, all.length) }, (_, i) => all[(start + i) % all.length]!);
}

/* ---------- Anuncios de prueba ---------- */

const seller = (name: string, phone: string, since = 2025) => ({ name, phone, since, verified: true });

interface SeedInput {
  id: string;
  cat: CatKey;
  title: string;
  price: number | null;
  currency?: Currency;
  priceSuffix?: string;
  priceNote?: string;
  district: string;
  ago: number;
  daysLeft?: number;
  status?: Status;
  top?: boolean;
  exact?: boolean;
  views?: number;
  seller: Ad['seller'];
  desc: string;
  tags?: string[];
  photos?: string[];
  labels?: string[];
}

const rnd = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

function seed(list: SeedInput[]): Ad[] {
  const now = Date.now();
  return list.map((s, i) => {
    const d = districtByName(s.district);
    const createdAt = now - s.ago;
    const left = s.daysLeft ?? AD_DAYS - Math.floor(s.ago / DAY);
    const views = s.views ?? Math.round(30 + rnd(i + 3) * 600);
    const photos = s.photos ?? [];
    const week = Array.from({ length: 7 }, (_, k) => Math.round((views / 9) * (0.6 + rnd(i * 7 + k) * 0.9) * (k === 5 ? 1.5 : 1)));
    return {
      id: s.id,
      cat: s.cat,
      title: s.title,
      price: s.price,
      currency: s.currency ?? (s.price == null ? 'NONE' : 'PEN'),
      priceSuffix: s.priceSuffix,
      priceNote: s.priceNote,
      desc: s.desc,
      tags: s.tags ?? [],
      district: s.district,
      lat: d.lat + (rnd(i + 1) - 0.5) * 0.02,
      lng: d.lng + (rnd(i + 2) - 0.5) * 0.02,
      exact: s.exact ?? false,
      photos,
      photoLabels: s.labels ?? photos.map((_, k) => `Foto ${k + 1}`),
      createdAt,
      expiresAt: now + left * DAY,
      status: s.status ?? 'activo',
      top: s.top ?? false,
      seller: s.seller,
      views: s.status === 'pend' ? 0 : views,
      wa: s.status === 'pend' ? 0 : Math.round(views * (0.04 + rnd(i + 11) * 0.06)),
      week: s.status === 'pend' ? [0, 0, 0, 0, 0, 0, 0] : week,
    };
  });
}

const ROSA = seller('Rosa Quispe', '984123456', 2026);
const VALLE_SUR = seller('Inmobiliaria Valle Sur', '984111999', 2024);

export function seedAds(): Ad[] {
  return seed([
    {
      id: 'PG-00412', cat: 'terrenos', title: 'Terreno de 300 m² con vista al nevado Chicón', price: 120000,
      district: 'Urubamba', ago: 2 * HOUR, daysLeft: 28, top: true, views: 412, seller: ROSA,
      desc: 'Terreno plano de 300 m² a 5 minutos de la plaza de Urubamba, con vista directa al nevado Chicón. Cuenta con acceso vehicular, agua y luz en la puerta. Ideal para vivienda u hospedaje. Documentos en regla, título inscrito en Registros Públicos.',
      tags: ['300 m²', 'Agua y luz', 'Acceso vehicular', 'Título inscrito'],
      photos: pick(['land'], 8), labels: ['Vista al nevado', 'Frente del terreno', 'Laguna cercana', 'Lindero norte', 'Tierra fértil', 'Vista al valle', 'Andenes', 'Atardecer'],
    },
    {
      id: 'PG-00418', cat: 'mascotas', title: 'Se busca a Luna, perrita mestiza color canela', price: null, priceNote: 'Recompensa',
      district: 'Huayllabamba', ago: 40 * MIN, daysLeft: 25, views: 640, seller: ROSA,
      desc: 'Luna se perdió el domingo por la tarde cerca al puente de Huayllabamba. Es mestiza, color canela, mediana, con collar rojo. Es muy cariñosa y responde a su nombre. Se ofrece recompensa a quien dé información.',
      tags: ['Collar rojo', 'Mediana', 'Responde a Luna'], photos: pick(['dog'], 2), labels: ['Luna de frente', 'Luna jugando'],
    },
    {
      id: 'PG-00419', cat: 'empleos', title: 'Mesero/a con inglés básico para restaurante', price: 1300, priceSuffix: '/ mes',
      district: 'Ollantaytambo', ago: 3 * HOUR, seller: seller('Restaurante Inti Raymi', '984555111'),
      desc: 'Buscamos mesero/a con inglés básico para atender turistas. Horario de 11 am a 9 pm, un día de descanso a la semana. Se ofrece almuerzo y propinas. Experiencia mínima de 6 meses.',
      tags: ['Tiempo completo', 'Inglés básico', 'Almuerzo incluido'],
    },
    {
      id: 'PG-00405', cat: 'vehiculos', title: 'Moto lineal 2021, papeles en regla', price: 9500,
      district: 'Urubamba', ago: 5 * HOUR, daysLeft: 19, views: 188, seller: seller('Edwin Huallpa', '984202020'),
      desc: 'Moto lineal 2021, único dueño, SOAT vigente y tarjeta de propiedad al día. Motor en perfecto estado, llantas nuevas. Se puede ver en Urubamba.',
      tags: ['2021', 'SOAT vigente', 'Único dueño'], photos: pick(['moto'], 2), labels: ['Vista lateral', 'En ruta'],
    },
    {
      id: 'PG-00399', cat: 'alquiler', title: 'Cuarto amoblado a dos cuadras de la plaza', price: 450, priceSuffix: '/ mes',
      district: 'Urubamba', ago: 28 * HOUR, daysLeft: 2, top: true, views: 230, seller: seller('Doña Julia Ccahuana', '984300400'),
      desc: 'Cuarto amoblado con baño propio, agua caliente e internet. A dos cuadras de la plaza de armas. Ideal para estudiante o profesional. Incluye cama, ropero y escritorio.',
      tags: ['Baño propio', 'Wi-Fi', 'Agua caliente'], photos: pick(['room'], 4), labels: ['Cuarto', 'Cama', 'Sala común', 'Cocina'],
    },
    {
      id: 'PG-00398', cat: 'servicios', title: 'Gasfitero y electricista a domicilio', price: null, priceNote: 'Consultar',
      district: 'Urubamba', ago: 30 * HOUR, seller: seller('Julio Mamani', '984777222'),
      desc: 'Instalaciones eléctricas, reparación de tuberías, terma y bombas de agua. Atiendo en todo el Valle, incluso fines de semana. Presupuesto sin compromiso.',
      tags: ['Todo el Valle', 'Fines de semana', 'Presupuesto gratis'],
    },
    {
      id: 'PG-00391', cat: 'venta', title: 'Textiles tejidos a telar, hechos a mano', price: 180,
      district: 'Chinchero', ago: 31 * DAY, daysLeft: -1, seller: seller('Asociación Awaq Warmi', '984909090'),
      desc: 'Mantas y chalinas tejidas a telar por artesanas de Chinchero, con tintes naturales. Varios diseños y tamaños. Precio por unidad.',
      tags: ['Hecho a mano', 'Tintes naturales'], photos: pick(['textile'], 2), labels: ['Chalinas', 'Feria'],
    },
    {
      id: 'PG-00387', cat: 'terrenos', title: 'Lote agrícola de 1 ha con riego', price: 260000,
      district: 'Maras', ago: 2 * DAY, exact: true, seller: seller('Familia Huamán', '984333444'),
      desc: 'Lote agrícola de una hectárea con canal de riego propio, ideal para maíz o quinua. Acceso por trocha carrozable. Papeles saneados.',
      tags: ['1 ha', 'Riego propio', 'Papeles saneados'], photos: pick(['land'], 4, 1), labels: ['Panorámica', 'Laguna', 'Casa de campo', 'Tierra'],
    },
    {
      id: 'PG-00415', cat: 'mascotas', title: 'Encontrado: gato atigrado en calle Comercio', price: null, priceNote: 'Para devolver',
      district: 'Urubamba', ago: 6 * HOUR, seller: seller('Carmen V.', '984888999'),
      desc: 'Encontré un gato atigrado, macho, muy manso, en la calle Comercio. Parece tener dueño. Si es tuyo escríbeme con una foto para devolverlo.',
      tags: ['Macho', 'Atigrado', 'Manso'], photos: pick(['cat'], 2), labels: ['Gato', 'Detalle'],
    },
    {
      id: 'PG-00380', cat: 'eventos', title: 'Feria gastronómica y concierto del Valle, sábado', price: null, priceNote: 'Entrada libre',
      district: 'Calca', ago: 2 * DAY, top: true, exact: true, seller: seller('Municipalidad de Calca', '984000111'),
      desc: 'Este sábado desde las 10 am en la plaza de Calca: platos típicos, chicha de jora, concurso de cuyes y por la noche concierto con bandas del Valle. Entrada libre para toda la familia.',
      tags: ['Sábado 10 am', 'Música en vivo', 'Familiar'], photos: [...pick(['event'], 2), ...pick(['food'], 2)], labels: ['Concierto', 'Público', 'Platos típicos', 'Restaurantes'],
    },
    {
      id: 'PG-00376', cat: 'empleos', title: 'Ayudante de cocina, turno mañana', price: 1130, priceSuffix: '/ mes',
      district: 'Yucay', ago: 3 * DAY, seller: seller('Hotel Posada del Valle', '984222333'),
      desc: 'Se requiere ayudante de cocina para turno de mañana (6 am a 2 pm). No se requiere experiencia, se capacita. Planilla y beneficios de ley.',
      tags: ['Turno mañana', 'Se capacita', 'Planilla'], photos: [PHOTOS.food[3]!, PHOTOS.food[2]!], labels: ['Cocina', 'Restaurante'],
    },
    {
      id: 'PG-00370', cat: 'vehiculos', title: 'Camioneta 4x4 2016, mantenimiento al día', price: 21000, currency: 'USD',
      district: 'Calca', ago: 4 * HOUR, status: 'pend', seller: seller('Marco Gutiérrez', '984616161'),
      desc: 'Camioneta 4x4 2016, motor diésel, 98,000 km. Mantenimiento en concesionario, llantas al 80%. Lista para el campo o la ciudad.',
      tags: ['4x4', 'Diésel', '98,000 km'], photos: [PHOTOS.car[0]!], labels: ['Camioneta'],
    },
    {
      id: 'PG-00366', cat: 'terrenos', title: 'Lote de 450 m² cerca al río', price: 98000,
      district: 'Yucay', ago: 5 * DAY, seller: VALLE_SUR,
      desc: 'Lote de 450 m² a 100 metros del río Vilcanota. Zona tranquila, con servicios básicos cerca. Ideal para casa de campo.',
      tags: ['450 m²', 'Cerca al río'], photos: pick(['land'], 3, 2), labels: ['Vista al río', 'Casa vecina', 'Terreno'],
    },
    {
      id: 'PG-00361', cat: 'terrenos', title: 'Casa de dos pisos con huerto y cochera', price: 210000,
      district: 'Huayllabamba', ago: 6 * DAY, top: true, seller: VALLE_SUR,
      desc: 'Casa de dos pisos, 4 habitaciones, 2 baños, con huerto de frutales, cochera y patio amplio. A 10 minutos de Urubamba.',
      tags: ['4 habitaciones', 'Huerto', 'Cochera'], photos: [...pick(['house'], 3), ...pick(['room'], 2)], labels: ['Fachada', 'Frente', 'Jardín', 'Dormitorio', 'Sala'],
    },
    {
      id: 'PG-00355', cat: 'alquiler', title: 'Departamento de 2 habitaciones con cochera', price: 900, priceSuffix: '/ mes',
      district: 'Calca', ago: 7 * DAY, seller: seller('Luis T.', '984666555'),
      desc: 'Departamento en segundo piso, 2 habitaciones, sala-comedor, cocina equipada y cochera para un auto. Contrato mínimo de 6 meses.',
      tags: ['2 habitaciones', 'Cochera', 'Cocina equipada'], photos: [PHOTOS.room[3]!, PHOTOS.room[2]!, PHOTOS.room[1]!], labels: ['Cocina', 'Sala', 'Dormitorio'],
    },
    {
      id: 'PG-00350', cat: 'venta', title: 'Bicicleta montañera aro 29, poco uso', price: 1200,
      district: 'Ollantaytambo', ago: 8 * DAY, seller: seller('Diego A.', '984444777'),
      desc: 'Bicicleta montañera aro 29, frenos hidráulicos, 21 cambios. Poco uso, como nueva. Incluye casco.',
      tags: ['Aro 29', 'Frenos hidráulicos', 'Incluye casco'], photos: pick(['bike'], 2), labels: ['Bicicleta', 'Detalle'],
    },
    {
      id: 'PG-00421', cat: 'mascotas', title: 'Se perdió Rocky, golden retriever con collar azul', price: 300, priceSuffix: 'de recompensa',
      district: 'Ollantaytambo', ago: 3 * HOUR, views: 290, seller: seller('Familia Paucar', '984515151'),
      desc: 'Rocky es un golden retriever de 3 años. Se perdió cerca a la estación de tren de Ollantaytambo. Lleva collar azul con placa. Es muy amigable. Recompensa de S/ 300.',
      tags: ['Golden retriever', 'Collar azul', '3 años'], photos: [PHOTOS.dog[2]!], labels: ['Rocky'],
    },
    {
      id: 'PG-00422', cat: 'vehiculos', title: 'Auto sedán 2019 automático, como nuevo', price: 14500, currency: 'USD',
      district: 'Urubamba', ago: 9 * HOUR, top: true, seller: seller('Autos del Valle', '984717171', 2024),
      desc: 'Sedán 2019 automático, 45,000 km, aire acondicionado, cámara de retroceso. Mantenimientos en concesionario. Se acepta parte de pago.',
      tags: ['Automático', '45,000 km', 'A/C'], photos: [PHOTOS.car[1]!, PHOTOS.car[3]!], labels: ['Lateral', 'Posterior'],
    },
    {
      id: 'PG-00423', cat: 'venta', title: 'Verduras orgánicas del Valle, delivery los sábados', price: 25, priceSuffix: 'la canasta',
      district: 'Chinchero', ago: 12 * HOUR, seller: seller('Huerto Sumaq', '984818181'),
      desc: 'Canasta de verduras orgánicas cultivadas en Chinchero: zanahoria, lechuga, papa nativa, habas y hierbas. Delivery los sábados a todo el Valle.',
      tags: ['Orgánico', 'Delivery', 'Papa nativa'], photos: pick(['veg'], 2), labels: ['Zanahorias', 'Mercado'],
    },
    {
      id: 'PG-00424', cat: 'alquiler', title: 'Casa de campo para fines de semana con jardín', price: 350, priceSuffix: 'la noche',
      district: 'Yucay', ago: 20 * HOUR, seller: seller('Casa Killa', '984919191'),
      desc: 'Casa de campo con 3 habitaciones, jardín, parrilla y vista al valle. Capacidad para 8 personas. Ideal para familias y grupos.',
      tags: ['8 personas', 'Parrilla', 'Jardín'], photos: [PHOTOS.house[4]!, PHOTOS.house[3]!, PHOTOS.room[0]!], labels: ['Casa', 'Piscina', 'Dormitorio'],
    },
    {
      id: 'PG-00425', cat: 'servicios', title: 'Reparación de electrodomésticos y refrigeradoras', price: null, priceNote: 'Desde S/ 40',
      district: 'Calca', ago: 26 * HOUR, seller: seller('Técnico Ramiro', '984121212'),
      desc: 'Reparo refrigeradoras, lavadoras, cocinas y microondas. Repuestos originales y garantía de 3 meses. Visita a domicilio en Calca, Urubamba y Yucay.',
      tags: ['Garantía 3 meses', 'A domicilio'], photos: pick(['tools'], 2), labels: ['Trabajo', 'Herramientas'],
    },
    {
      id: 'PG-00426', cat: 'empleos', title: 'Guía de turismo bilingüe para Machu Picchu', price: 2200, priceSuffix: '/ mes',
      district: 'Machupicchu', ago: 1 * DAY, seller: seller('Andes Travel', '984131313', 2024),
      desc: 'Agencia busca guía oficial con carné de DIRCETUR, inglés avanzado. Tours diarios a Machu Picchu. Sueldo fijo más comisiones.',
      tags: ['Inglés avanzado', 'Carné DIRCETUR', 'Comisiones'], photos: [PHOTOS.land[5]!, PHOTOS.land[6]!], labels: ['Machu Picchu', 'Ciudadela'],
    },
    {
      id: 'PG-00427', cat: 'eventos', title: 'Noche de música andina en vivo, viernes', price: 20, priceSuffix: 'la entrada',
      district: 'Urubamba', ago: 1 * DAY, seller: seller('Kuntur Bar', '984141414'),
      desc: 'Este viernes desde las 8 pm: música andina y fusión con grupos del Valle. Comida y bebida a la venta. Reserva tu mesa por WhatsApp.',
      tags: ['Viernes 8 pm', 'Reserva por WhatsApp'], photos: [PHOTOS.event[2]!, PHOTOS.event[0]!], labels: ['Escenario', 'Público'],
    },
    {
      id: 'PG-00428', cat: 'empleos', title: 'Recepcionista para hostal, turno noche', price: 1200, priceSuffix: '/ mes',
      district: 'Ollantaytambo', ago: 2 * DAY, seller: seller('Hostal Pakarina', '984151515'),
      desc: 'Hostal busca recepcionista para turno noche (8 pm a 8 am), 4 noches por semana. Inglés básico. Incluye alojamiento.',
      tags: ['Turno noche', 'Alojamiento'],
    },
    {
      id: 'PG-00429', cat: 'terrenos', title: 'Terreno de 1,200 m² con vista a Machu Picchu', price: 85000, currency: 'USD',
      district: 'Machupicchu', ago: 4 * DAY, seller: seller('Ing. Pedro Ccori', '984161616'),
      desc: 'Terreno con vista privilegiada, apto para lodge u hospedaje turístico. Acceso peatonal y vehicular parcial. Factibilidad de servicios.',
      tags: ['1,200 m²', 'Apto para hospedaje'], photos: [PHOTOS.land[7]!, PHOTOS.land[5]!, PHOTOS.land[0]!], labels: ['Vista', 'Ciudadela', 'Montaña'],
    },
    {
      id: 'PG-00410', cat: 'venta', title: 'Bicicleta urbana negra, aro 28', price: 650,
      district: 'Urubamba', ago: 12 * DAY, status: 'vendido', seller: seller('Ana L.', '984171717'),
      desc: 'Bicicleta urbana en buen estado, aro 28, con canastilla.', photos: [PHOTOS.bike[1]!], labels: ['Bicicleta'],
    },
    {
      id: 'PG-00402', cat: 'servicios', title: 'Préstamos rápidos sin requisitos por WhatsApp', price: null, priceNote: 'Consultar',
      district: 'Urubamba', ago: 3 * DAY, status: 'pausado', seller: seller('Financiera X', '900000000'),
      desc: 'Préstamos al instante, solo envía un adelanto por Yape para activar tu crédito.',
    },
  ]);
}

/* ---------- Solicitudes de prueba (formulario "Anúnciate") ---------- */

export function seedRequests(): AdRequest[] {
  const now = Date.now();
  const R = (r: Omit<AdRequest, 'photos'> & { photos?: string[] }): AdRequest => ({ photos: [], ...r });
  return [
    R({ id: 'SOL-0031', createdAt: now - 18 * MIN, name: 'Hilda Condori', phone: '984252525', cat: 'alquiler', title: 'Alquilo minidepartamento para pareja', desc: 'Minidepartamento con cocina, baño y lavandería, cerca al mercado de Urubamba. Sin mascotas.', price: '700 al mes', district: 'Urubamba', status: 'nueva', photos: [PHOTOS.room[1]!, PHOTOS.room[3]!] }),
    R({ id: 'SOL-0030', createdAt: now - 55 * MIN, name: 'Wilber Quispe', phone: '984262626', cat: 'vehiculos', title: 'Vendo moto deportiva 250cc', desc: 'Moto 250cc del 2020, 15,000 km, papeles al día. Precio conversable.', price: '12500', district: 'Calca', status: 'nueva', photos: [PHOTOS.moto[1]!] }),
    R({ id: 'SOL-0029', createdAt: now - 3 * HOUR, name: 'Sonia Mamani', phone: '984272727', cat: 'mascotas', title: 'Se perdió perrito pug "Toby"', desc: 'Toby se perdió ayer en la plaza de Yucay. Es un pug color crema con collar negro.', price: 'Recompensa', district: 'Yucay', status: 'nueva', photos: [PHOTOS.dog[3]!] }),
    R({ id: 'SOL-0028', createdAt: now - 6 * HOUR, name: 'Restaurante Wayra', phone: '984282828', cat: 'empleos', title: 'Buscamos cocinero/a con experiencia', desc: 'Restaurante en Ollantaytambo busca cocinero con experiencia en comida novoandina. Turno tarde.', price: '1800 mensual', district: 'Ollantaytambo', status: 'contactado', note: 'Pagará por Yape hoy en la tarde' }),
    R({ id: 'SOL-0027', createdAt: now - 1 * DAY, name: 'Gloria Huamán', phone: '984292929', cat: 'venta', title: 'Vendo refrigeradora 2 puertas', desc: 'Refrigeradora no frost en buen estado, por viaje.', price: '900', district: 'Urubamba', status: 'contactado', note: 'Pidió publicar el lunes' }),
    R({ id: 'SOL-0026', createdAt: now - 2 * DAY, name: 'Familia Paucar', phone: '984515151', cat: 'mascotas', title: 'Se perdió Rocky, golden retriever', desc: 'Golden retriever con collar azul, cerca a la estación.', price: '300 de recompensa', district: 'Ollantaytambo', status: 'publicada', adId: 'PG-00421' }),
    R({ id: 'SOL-0025', createdAt: now - 3 * DAY, name: 'Inversiones Rápidas', phone: '900111222', cat: 'servicios', title: 'Gana dinero desde casa', desc: 'Invierte S/ 100 y gana S/ 1000 en una semana.', price: '', district: 'Urubamba', status: 'rechazada', note: 'Posible estafa piramidal' }),
  ];
}

export function seedReports(): Report[] {
  const now = Date.now();
  return [
    { id: 'R-005', adId: 'PG-00422', reason: 'Información falsa o engañosa', detail: 'El kilometraje parece alterado.', createdAt: now - 2 * HOUR, resolved: false },
    { id: 'R-004', adId: 'PG-00399', reason: 'Ya se vendió / no está disponible', detail: 'Llamé y dicen que ya lo alquilaron.', createdAt: now - 20 * HOUR, resolved: false },
    { id: 'R-003', adId: 'PG-00402', reason: 'Es una estafa o pide adelantos', detail: 'Pide adelanto por Yape para "activar" el préstamo.', createdAt: now - 3 * DAY, resolved: true },
  ];
}

/** Pool para la simulación: solicitudes que llegan "en vivo" */
export const SIM_REQUESTS: Omit<AdRequest, 'id' | 'createdAt' | 'status'>[] = [
  { name: 'Teodoro Ccahua', phone: '984313131', cat: 'terrenos', title: 'Vendo terreno de 500 m² en Maras', desc: 'Terreno con vista a las salineras, papeles en regla.', price: '75000', district: 'Maras', photos: [PHOTOS.land[1]!] },
  { name: 'Lucía Villca', phone: '984323232', cat: 'alquiler', title: 'Alquilo habitación para estudiante', desc: 'Habitación con baño compartido y wifi.', price: '300 al mes', district: 'Calca', photos: [PHOTOS.room[0]!] },
  { name: 'Mario Apaza', phone: '984333232', cat: 'vehiculos', title: 'Vendo camioneta doble cabina', desc: 'Camioneta 2018, diésel, 4x4.', price: '24000 dólares', district: 'Urubamba', photos: [PHOTOS.car[0]!] },
  { name: 'Panadería El Molino', phone: '984343434', cat: 'empleos', title: 'Se necesita ayudante de panadería', desc: 'Turno madrugada, sin experiencia, se capacita.', price: '1130 mensual', district: 'Yucay', photos: [] },
  { name: 'Rosa Huillca', phone: '984353535', cat: 'mascotas', title: 'Se perdió gatita blanca', desc: 'Gatita blanca de ojos azules, se perdió en la calle Grau.', price: 'Recompensa', district: 'Urubamba', photos: [PHOTOS.cat[1]!] },
  { name: 'Eventos Inti', phone: '984363636', cat: 'eventos', title: 'Fiesta de aniversario de Ollantaytambo', desc: 'Concierto, danzas y feria artesanal.', price: 'Entrada libre', district: 'Ollantaytambo', photos: [PHOTOS.event[1]!] },
  { name: 'Carlos Yupanqui', phone: '984373737', cat: 'servicios', title: 'Clases de inglés a domicilio', desc: 'Profesor con experiencia, niños y adultos.', price: '30 por hora', district: 'Urubamba', photos: [] },
];

export const SIM_NAMES = ['Valeria', 'Jhon', 'Maritza', 'Elvis', 'Yeny', 'Ronald', 'Nilda', 'Percy'];

/** Pagos de prueba de los últimos 2 meses */
export function seedPayments(ads: Ad[]) {
  const now = Date.now();
  const methods = ['yape', 'yape', 'plin', 'yape', 'efectivo', 'plin', 'tarjeta'] as const;
  const out: { id: string; adId: string; concept: string; method: PayMethod; amount: number; at: number; op?: string }[] = [];
  let n = 0;
  for (const a of ads) {
    if (a.status === 'pend' || a.status === 'pausado') continue;
    const free = CAT[a.cat].free;
    const m = methods[n % methods.length]!;
    out.push({ id: 'p' + ++n, adId: a.id, concept: a.title.slice(0, 30), method: free ? 'gratis' : m, amount: free ? 0 : AD_PRICE, at: a.createdAt + 20 * MIN, op: m === 'yape' || m === 'plin' ? String(10000000 + Math.round(rnd(n) * 89999999)) : undefined });
    if (a.top && !free) out.push({ id: 'p' + ++n, adId: a.id, concept: `Destacado · ${a.title.slice(0, 18)}`, method: m, amount: TOP_PRICE, at: a.createdAt + 25 * MIN });
  }
  // historial anterior (anuncios ya vencidos y borrados)
  for (let i = 0; i < 34; i++) {
    const m = methods[i % methods.length]!;
    out.push({ id: 'h' + i, adId: `PG-00${300 + i}`, concept: ['Terreno', 'Alquiler', 'Moto', 'Empleo', 'Servicio', 'Venta'][i % 6]! + ' (archivado)', method: m, amount: i % 4 === 0 ? AD_PRICE + TOP_PRICE : AD_PRICE, at: now - (8 + rnd(i + 40) * 52) * DAY });
  }
  return out.sort((a, b) => b.at - a.at);
}

export const TICKER_TAG: Record<CatKey, string> = {
  terrenos: 'TERRENO',
  mascotas: 'MASCOTA',
  empleos: 'EMPLEO',
  vehiculos: 'VEHÍCULO',
  alquiler: 'ALQUILER',
  servicios: 'SERVICIO',
  venta: 'VENTA',
  eventos: 'EVENTO',
};
