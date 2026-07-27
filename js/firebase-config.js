// ============================================================
//  CONFIGURACIÓN DE FIREBASE
//  Reemplaza los valores de abajo con los de TU proyecto.
//  Los obtienes en: Firebase Console > Configuración del proyecto
//  > Tus apps > (ícono </>) > SDK setup and configuration > Config
// ============================================================
// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration

const firebaseConfig = {

  apiKey: "AIzaSyCHWMBoXmBOPyBgWaqiwXXIgWTz0R9TkQQ",

  authDomain: "jems-pizzeria.firebaseapp.com",

  projectId: "jems-pizzeria",

  storageBucket: "jems-pizzeria.firebasestorage.app",

  messagingSenderId: "895963593681",

  appId: "1:895963593681:web:cb151cff888c4a29febef0"

};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
