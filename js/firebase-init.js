import { firebaseConfig, isConfigured } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, getDocs, getDoc, addDoc, setDoc,
  updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export let db = null;
export let auth = null;
export let ready = Promise.resolve(false);
export let connError = null;

const connDot = () => document.getElementById("conn-dot");
const connLabel = () => document.getElementById("conn-label");

function showConnError(msg){
  connError = msg;
  console.error("[Firebase] " + msg);
  if (connLabel()) connLabel().textContent = "Error de conexión";
  const warn = document.getElementById("config-warning");
  const boot = document.getElementById("boot-screen");
  if (boot) boot.classList.add("hidden");
  if (warn) {
    document.getElementById("warn-title").textContent = "No se pudo conectar con Firebase";
    document.getElementById("warn-body").textContent = msg;
    warn.classList.remove("hidden");
  }
  const app = document.getElementById("app");
  if (app) app.classList.remove("hidden");
}

if (isConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    try {
      // Cache local persistente: la app puede leer datos ya vistos aunque
      // se quede sin señal, y sincroniza solo cuando vuelve la conexión.
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      });
    } catch (persistErr) {
      // Si falla (navegador viejo, modo incógnito, etc.) seguimos sin cache offline.
      console.warn("[Firebase] Cache offline no disponible:", persistErr.message);
      db = initializeFirestore(app, {});
    }
    auth = getAuth(app);

    ready = new Promise((resolve) => {
      let settled = false;
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        showConnError(
          "La autenticación anónima está tardando demasiado. Revisa en Firebase Console → Authentication → Sign-in method que el proveedor 'Anonymous' esté HABILITADO."
        );
        resolve(false);
      }, 9000);

      onAuthStateChanged(auth, (user) => {
        if (user && !settled) {
          settled = true;
          clearTimeout(timeout);
          if (connDot()) connDot().classList.add("ok");
          if (connLabel()) connLabel().textContent = "Conectado";
          resolve(true);
        }
      });
      signInAnonymously(auth).catch((err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        let msg = "Error de autenticación (" + err.code + "). ";
        if (err.code === "auth/operation-not-allowed") {
          msg += "Habilita el proveedor 'Anonymous' en Firebase Console → Authentication → Sign-in method.";
        } else if (err.code === "auth/configuration-not-found") {
          msg += "Ve a Firebase Console → Authentication → Comenzar (Get started), y luego habilita 'Anonymous'.";
        } else {
          msg += err.message;
        }
        showConnError(msg);
        resolve(false);
      });
    });
  } catch (err) {
    showConnError("Error al inicializar Firebase: " + err.message + ". Revisa que js/firebase-config.js tenga los valores correctos (sin comillas de más ni comas faltantes).");
    ready = Promise.resolve(false);
  }
} else {
  ready = Promise.resolve(false);
}

export {
  collection, doc, getDocs, getDoc, addDoc, setDoc,
  updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, increment
};
export { isConfigured };
