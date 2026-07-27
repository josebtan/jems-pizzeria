# JEMS Al Carbón — Gestión de Pizzería

App web para gestionar insumos, ventas y recetas de la pizzería, con datos guardados en Firebase (Firestore) y publicada con GitHub Pages.

## 🔥 Paso a paso: crear tu proyecto de Firebase (gratis)

1. Entra a **https://console.firebase.google.com** con tu cuenta de Google.
2. Clic en **"Agregar proyecto"**. Ponle un nombre, ej: `jems-pizzeria`. Puedes desactivar Google Analytics (no lo necesitas).
3. Cuando el proyecto esté creado, en la página principal del proyecto clic en el ícono **`</>`** ("Web") para registrar una app web.
   - Nombre de la app: `JEMS Web` (no marques "Firebase Hosting", usamos GitHub Pages).
   - Firebase te mostrará un bloque `firebaseConfig = { ... }`. **Cópialo**, lo vas a necesitar en el paso 6.
4. En el menú izquierdo ve a **Compilación (Build) → Firestore Database → Crear base de datos**.
   - Elige el modo **producción**.
   - Elige la ubicación más cercana (ej. `nam5 (us-central)` o `southamerica-east1`).
5. En el menú izquierdo ve a **Compilación (Build) → Authentication → Comenzar (Get started)**.
   - En la pestaña **Sign-in method**, habilita el proveedor **Anónimo (Anonymous)**. Esto permite que la app se conecte sin necesidad de que hagas login manualmente.
6. Ve a **Firestore Database → Reglas (Rules)** y reemplaza el contenido por esto (permite leer/escribir solo a la app autenticada anónimamente, no a cualquiera en internet):

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

7. Abre el archivo [`js/firebase-config.js`](js/firebase-config.js) de este repositorio (puedes editarlo directamente en GitHub, ícono del lápiz) y reemplaza los valores con los que copiaste en el paso 3:

```js
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

8. Guarda (commit). En 1-2 minutos GitHub Pages se actualiza solo y la app queda funcionando con tu base de datos.

> La primera vez que la app se conecte, va a crear automáticamente los insumos y recetas base tomados de tu Excel (masa + las 4 pizzas), para que no tengas que capturarlos a mano.

## 📱 Uso

- **Ventas**: registra pedidos pendientes o ya entregados. El resumen de arriba se actualiza solo: pizzas vendidas, total vendido, ganancia, plante (fijo para la pizzería) y ganancia real (para los inversores).
- **Insumos**: agrega o edita lo que compras. El costo por gramo/ml/unidad se calcula solo (precio ÷ cantidad).
- **Recetas**: la Masa es una receta base que se usa dentro de cada pizza. Cada pizza tiene su lista de ingredientes, su margen, y el costo/precio de venta se recalculan automáticamente si cambias un precio en Insumos.

## 🗂 Estructura

```
index.html
css/style.css
js/firebase-config.js   ← aquí pegas tu configuración de Firebase
js/firebase-init.js     ← conexión a Firestore + login anónimo
js/data.js              ← datos iniciales (semilla) tomados del Excel
js/insumos.js
js/recetas.js
js/ventas.js
js/app.js               ← navegación y arranque
assets/logo.png
```

## ⚠️ Nota sobre el repositorio público

GitHub Pages en el plan gratuito solo publica sitios desde repositorios **públicos**. Como es una app 100% de frontend, el código (HTML/CSS/JS) siempre es visible en el navegador de quien la use — la seguridad real de tus datos la dan las **reglas de Firestore** del paso 6, no la visibilidad del repo.
