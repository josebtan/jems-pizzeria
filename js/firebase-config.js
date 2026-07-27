// ============================================================
//  CONFIGURACIÓN DE FIREBASE
//  Reemplaza los valores de abajo con los de TU proyecto.
//  Los obtienes en: Firebase Console > Configuración del proyecto
//  > Tus apps > (ícono </>) > SDK setup and configuration > Config
// ============================================================

export const firebaseConfig = {
  apiKey: "PEGA_AQUI_TU_API_KEY",
  authDomain: "PEGA_AQUI_TU_PROYECTO.firebaseapp.com",
  projectId: "PEGA_AQUI_TU_PROYECTO_ID",
  storageBucket: "PEGA_AQUI_TU_PROYECTO.appspot.com",
  messagingSenderId: "PEGA_AQUI_TU_SENDER_ID",
  appId: "PEGA_AQUI_TU_APP_ID"
};

// true mientras no hayas pegado tu configuración real
export const isConfigured = !firebaseConfig.apiKey.startsWith("PEGA_AQUI");
