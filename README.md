# JEMS Al Carbón — Gestión de Pizzería

App web para gestionar insumos, stock, ventas y recetas de la pizzería JEMS Al Carbón. Los datos se guardan en Firebase (Firestore) y el sitio se publica gratis con GitHub Pages. Diseño 100% responsive: se ve bien en el celular igual que en el computador.

**App en vivo:** https://josebtan.github.io/jems-pizzeria/

## 🔥 Paso a paso: crear tu proyecto de Firebase (gratis)

1. Entra a **https://console.firebase.google.com** con tu cuenta de Google.
2. Clic en **"Agregar proyecto"**. Ponle un nombre, ej: `jems-pizzeria`. Puedes desactivar Google Analytics (no lo necesitas).
3. Cuando el proyecto esté creado, en la página principal del proyecto clic en el ícono **`</>`** ("Web") para registrar una app web.
   - Nombre de la app: `JEMS Web` (no marques "Firebase Hosting", usamos GitHub Pages).
   - Firebase te mostrará un bloque `firebaseConfig = { ... }`. **Cópialo**, lo vas a necesitar en el paso 6.
4. En el menú izquierdo ve a **Compilación (Build) → Firestore Database → Crear base de datos**.
   - Elige el modo **producción**.
   - Elige la ubicación más cercana (ej. `southamerica-east1`).
5. En el menú izquierdo ve a **Compilación (Build) → Authentication → Comenzar (Get started)**.
   - En la pestaña **Sign-in method**, habilita el proveedor **Anónimo (Anonymous)**. Esto permite que la app se conecte sin necesidad de que hagas login manualmente.
6. Ve a **Firestore Database → Reglas (Rules)** y reemplaza el contenido por esto (permite leer/escribir solo a la app ya autenticada de forma anónima, no a cualquiera en internet):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

   Clic en **Publicar**.

7. Abre el archivo [`js/firebase-config.js`](js/firebase-config.js) de este repositorio (puedes editarlo directamente en GitHub, ícono del lápiz) y reemplaza los valores con los que copiaste en el paso 3.
8. Guarda (commit). En 1-2 minutos GitHub Pages se actualiza solo y la app queda funcionando con tu base de datos.

> La primera vez que la app se conecte, va a crear automáticamente los insumos y recetas base tomados de tu Excel (masa + las 4 pizzas), con su stock inicial ya cargado, para que no tengas que capturarlos a mano.

Si algo falla en la conexión (Firestore no creada, Authentication no habilitado, etc.), la app lo detecta sola y te muestra en pantalla exactamente qué falta — no se queda pegada en la carga.

## 📲 Instalarla como app (PWA)

La app funciona como **Progressive Web App**: se puede instalar en el celular o el computador y abre como una app normal, sin la barra del navegador, con ícono propio y con parte de su funcionamiento offline.

**Instalar en Android (Chrome):** entra a la app → menú (⋮) → **"Instalar aplicación"** (o **"Agregar a pantalla de inicio"**).
**Instalar en iPhone (Safari):** entra a la app → botón compartir (□↑) → **"Agregar a pantalla de inicio"**.
**Instalar en computador (Chrome/Edge):** entra a la app → ícono de instalar (⊕) en la barra de direcciones, a la derecha.

Qué hace y qué no hace el modo offline:
- El **"cascarón" de la app** (HTML, CSS, JS, íconos) queda guardado en el dispositivo, así que abre al instante aunque el internet esté lento.
- Los **datos ya vistos** (insumos, recetas, ventas cargadas antes) se guardan en caché local de Firestore, así que se pueden seguir consultando sin señal.
- Para **registrar cosas nuevas** (una venta, una compra) sin internet, la app las deja guardadas localmente y las sube solas apenas vuelve la conexión — pero mientras tanto no se reflejan en el resumen de otro celular hasta que sincronicen.

## 📱 Secciones de la app

- **Ventas**: registra pedidos pendientes o ya entregados. El resumen de arriba se actualiza solo: pizzas vendidas, total vendido, ganancia, plante (fijo para la pizzería) y ganancia real (para los inversores). Al registrar una venta, la app descuenta automáticamente del stock los ingredientes de esa receta (incluida la masa).
- **Insumos**, con dos pestañas internas:
  - **Lista**: el catálogo de insumos — nombre, presentación, precio de compra, y el costo calculado por gramo/ml/unidad. Filtra por Comprados / Por comprar; las filas "por comprar" quedan resaltadas.
  - **Stock**: cuánto tienes disponible de cada insumo ahora mismo, cuánto has comprado en total, cuánto se ha consumido por las ventas, y cuánto dinero llevas gastado. Desde aquí registras cada compra nueva ("+ Compra") y esa cantidad se suma al stock; los insumos en 0 quedan marcados como **Agotado**.
- **Recetas**: la Masa es una receta base que se usa dentro de cada pizza. Cada pizza tiene su lista de ingredientes, su margen, y el costo/precio de venta se recalculan automáticamente si cambias un precio en Insumos.

## 🎨 Diseño e identidad

El diseño sigue la identidad de marca de JEMS (logo, mascota y paleta de colores):

| Color | Uso |
|---|---|
| `#333333` (carbón) | Fondo principal |
| `#C0C0C0` (acero) | Acentos metálicos / texto secundario |
| `#8B5A2B` (madera) | Detalles cálidos |
| `#E85D1A` (fuego) | Color de marca / acciones principales |
| `#F2E9D8` (crema) | Texto y tarjetas claras |
| `#C9A227` (oro) | Cifras destacadas (ganancia real, alertas) |

Tipografías: **Oswald** (títulos, estilo sello/rótulo) + **Work Sans** (texto) + **IBM Plex Mono** (cifras y datos, para que las tablas de precios se lean como un ticket).

La mascota de JEMS aparece en puntos clave para guiar al usuario:
- `assets/mascota-compras.webp` (carrito de mercado) → pestaña **Insumos / Lista**.
- `assets/mascota-calculadora.webp` (calculadora) → pestaña **Insumos / Stock** y sección **Ventas**.

Todo el layout es responsive: en mobile el menú lateral pasa a una barra superior, las tablas hacen scroll horizontal y las tarjetas de recetas se acomodan en una sola columna.

## 🗂 Estructura

```
index.html
manifest.json           ← configuracion de la app instalable (PWA)
sw.js                    ← service worker: cache de archivos para uso offline
css/style.css
js/firebase-config.js   ← aquí pegas tu configuración de Firebase
js/firebase-init.js     ← conexión a Firestore (con cache offline) + login anónimo
js/data.js              ← datos iniciales (semilla) tomados del Excel
js/insumos.js           ← catálogo de insumos + stock/compras
js/recetas.js           ← recetas, costeo y cálculo de ingredientes totales
js/ventas.js            ← ventas, resumen y descuento de stock
js/app.js               ← navegación y arranque
assets/logo.png
assets/icons/           ← íconos de la app instalable en varios tamaños
assets/mascota-compras.webp
assets/mascota-calculadora.webp
```

## ⚠️ Nota sobre el repositorio público

GitHub Pages en el plan gratuito solo publica sitios desde repositorios **públicos**. Como es una app 100% de frontend, el código (HTML/CSS/JS) siempre es visible en el navegador de quien la use — la seguridad real de tus datos la dan las **reglas de Firestore** del paso 6, no la visibilidad del repo.
