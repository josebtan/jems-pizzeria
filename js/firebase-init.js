import { firebaseConfig, isConfigured } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, doc, getDocs, getDoc, addDoc, setDoc,
  updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export let db = null;
export let auth = null;
export let ready = Promise.resolve(false);

const connDot = () => document.getElementById("conn-dot");
const connLabel = () => document.getElementById("conn-label");

if (isConfigured) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

  ready = new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        if (connDot()) connDot().classList.add("ok");
        if (connLabel()) connLabel().textContent = "Conectado";
        resolve(true);
      }
    });
    signInAnonymously(auth).catch((err) => {
      console.error("Error de autenticación anónima:", err);
      if (connLabel()) connLabel().textContent = "Error de conexión";
      resolve(false);
    });
  });
} else {
  ready = Promise.resolve(false);
}

export {
  collection, doc, getDocs, getDoc, addDoc, setDoc,
  updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp
};
export { isConfigured };
