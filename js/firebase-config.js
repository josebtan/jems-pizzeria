// ============================================================
//  CONFIGURACIÓN DE FIREBASE — proyecto: jems-pizzeria
// ============================================================

export const firebaseConfig = {
  apiKey: "AIzaSyCHWMBoXmBOPyBgWaqiwXXIgWTz0R9TkQQ",
  authDomain: "jems-pizzeria.firebaseapp.com",
  projectId: "jems-pizzeria",
  storageBucket: "jems-pizzeria.firebasestorage.app",
  messagingSenderId: "895963593681",
  appId: "1:895963593681:web:cb151cff888c4a29febef0"
};

// true mientras no hayas pegado tu configuración real
export const isConfigured = !firebaseConfig.apiKey.startsWith("PEGA_AQUI");
