# 📣 Pregón — Clasificados del Valle

**Pregón** es una página web de anuncios clasificados para el Valle Sagrado de los Incas (Urubamba, Cusco – Perú). Ahí se publica lo que se **vende, se busca y se ofrece** en la zona: terrenos y casas, alquileres, vehículos, empleos, servicios, compra y venta, eventos y mascotas perdidas.

El modelo es simple: **cada anuncio cuesta S/ 5 por 30 días** (destacarlo cuesta S/ 3 más) y los de **mascotas perdidas son gratis**. Los anunciantes **no publican solos**: envían su solicitud y el **propietario de la página** la revisa, cobra (Yape, Plin o efectivo) y la publica desde un panel privado. Así se evitan estafas y anuncios falsos.

> Estado: **demo funcional**. Todo corre en el navegador con datos de prueba; todavía no tiene servidor ni base de datos (ver [Próximos pasos](#-próximos-pasos)).

---

## ✨ Funcionalidades

### Para los visitantes
- **Portada** con ticker de "recién publicado", buscador y mosaico de anuncios con fotos.
- **Búsqueda en vivo** por texto (sin importar tildes), distrito, categoría, rango de precio y "solo con fotos". Orden por fecha, precio o más vistos. Los filtros quedan en la URL para compartir la búsqueda. Atajo de teclado `/`.
- **Detalle del anuncio**: galería con flechas del teclado, deslizar en celular y pantalla completa; mapa real (OpenStreetMap) con punto exacto o zona aproximada; botón de **WhatsApp con el mensaje ya escrito**; llamar; compartir; reportar; "más de este anunciante" y "parecidos en el Valle".
- **Guardados** (favoritos) y **alertas de búsqueda** ("avísame de nuevos"), sin necesidad de cuenta.
- **Anúnciate**: formulario de solicitud con fotos y botón directo al WhatsApp del propietario.
- **Vistos recientemente**, consejos de seguridad y diseño adaptado a celular con barra de navegación inferior.

### Para el propietario (`/admin`, con inicio de sesión)
- **Resumen**: ingresos del mes, anuncios activos, solicitudes nuevas, reportes, vistas y clics a WhatsApp; gráficos de ingresos por semana y vistas por día; actividad reciente; anuncios por vencer con botón para avisar al cliente y renovar.
- **Solicitudes**: lo que llega desde "Anúnciate". Escribir al cliente con las instrucciones de pago ya redactadas, notas internas, rechazar o **crear y publicar** el anuncio con los datos precargados.
- **Anuncios**: buscador y filtros por estado y categoría. Registrar pago, renovar, destacar, pausar o reactivar, marcar vendido o encontrado, editar, escribir al cliente y eliminar.
- **Publicar**: asistente en 4 pasos (categoría → datos y fotos → ubicación y cliente → cobro), con subida de hasta 10 fotos comprimidas en el navegador, mapa con pin arrastrable y vista previa en vivo.
- **Pagos**: historial por mes, totales por método y exportación a Excel (CSV).
- **Reportes**: denuncias de los visitantes; pausar, corregir o descartar.
- **Ajustes**: nombre y WhatsApp del negocio, precios y restablecer datos de prueba.
- **Simulación en vivo**: con el panel abierto llegan visitas, clics a WhatsApp y solicitudes nuevas de clientes ficticios, para ver la página "funcionando".

---

## 🛠 Tecnologías

| | |
|---|---|
| Framework | [Astro 7](https://astro.build) (sitio estático) con islas de [React 19](https://react.dev) |
| Lenguaje | TypeScript |
| Mapas | [Leaflet](https://leafletjs.com) + OpenStreetMap |
| Tipografías | Archivo y Space Mono (vía Fontsource, sin depender de Google Fonts) |
| Estilos | CSS propio, estilo neo-brutalista (bordes gruesos, sombras duras, amarillo `#FFD400`) |
| Datos | `localStorage` del navegador (demo) |
| Fotos de prueba | [Unsplash](https://unsplash.com) |

---

## 🚀 Cómo correrlo

Requisitos: **Node.js 20 o superior**.

```bash
git clone https://github.com/rodolfo-riveros/anuncios.git
cd anuncios
npm install
npm run dev      # abre http://localhost:4321
```

Otros comandos:

```bash
npm run build    # genera el sitio estático en dist/
npm run preview  # sirve la versión compilada
```

### Acceso al panel
Entra a `http://localhost:4321/admin` (también hay un enlace "Admin" en el pie de página). Las **credenciales de prueba** están en [`src/lib/config.ts`](src/lib/config.ts) (`DEMO_ADMIN`); cámbialas ahí.

> ⚠ El login de la demo se valida en el navegador y **no es seguro**: cualquiera que lea el código puede ver la contraseña. Antes de publicar el sitio hay que moverlo a un servidor.

---

## 🗺 Páginas

| Ruta | Quién | Qué hace |
|---|---|---|
| `/` | Público | Portada, buscador, categorías y anuncios |
| `/anuncio?id=PG-00412` | Público | Detalle del anuncio |
| `/anunciate` | Público | Solicitud para anunciar + WhatsApp del propietario |
| `/guardados` | Público | Favoritos y alertas del visitante |
| `/seguridad` | Público | Consejos de seguridad y términos |
| `/admin` | Propietario | Panel privado |

Las rutas antiguas `/publicar` y `/panel` redirigen a `/anunciate` y `/admin`.

---

## 🧪 Datos de prueba

- **28 anuncios** en todas las categorías y estados (activos, destacados, por vencer, vencido, pendiente de pago, pausado, vendido), con fotos.
- **7 solicitudes** de clientes, **3 reportes** y unos **2 meses de pagos**.
- Se generan en [`src/lib/data.ts`](src/lib/data.ts). Desde **Admin → Ajustes → Restablecer datos de prueba** se vuelven a cargar.

---

## 📁 Estructura

```
src/
  components/        Islas React públicas (Explore, AdDetail, Anunciate, Guardados, MapView, AdCard…)
  components/admin/  Panel del propietario (Admin, Sections, AdEditor, ui)
  layouts/           Layout.astro (cabecera, pie y navegación móvil)
  lib/
    data.ts          Categorías, distritos, fotos y datos de prueba
    store.ts         Estado guardado en localStorage (anuncios, solicitudes, pagos…)
    sim.ts           Simulación de actividad en vivo
    search.ts        Búsqueda y filtros
    format.ts        Precios, fechas, enlaces de WhatsApp
    images.ts        Compresión de fotos en el navegador
    config.ts        Credenciales de prueba y datos del propietario
  pages/             Rutas de Astro
  styles/global.css  Sistema visual
```

---

## 🔜 Próximos pasos

1. **Base de datos real** (Supabase, Firebase o PHP/MySQL): reemplazar las funciones de `src/lib/store.ts` manteniendo su interfaz.
2. **Login seguro** del administrador en el servidor.
3. **Subida de fotos** a un almacenamiento (Supabase Storage, Cloudinary…) en lugar de guardarlas en el navegador.
4. **Notificaciones** automáticas por WhatsApp cuando un anuncio está por vencer.
5. **Publicar** el sitio (Vercel, Netlify o un hosting propio).

---

Hecho en Urubamba, Cusco 🇵🇪
