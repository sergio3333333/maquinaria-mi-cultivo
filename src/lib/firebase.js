// src/lib/firebase.js

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // Realtime Database
import { getFirestore } from "firebase/firestore"; // Firestore (si lo usas)
import { getStorage } from "firebase/storage"; // Storage (si lo usas)

// Configuración que te da Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAqBNIrbizz50ltkdHyQqd7V4G0Nc9r1ow",
  authDomain: "maquinaria-mi-cultivo-bec00.firebaseapp.com",
  projectId: "maquinaria-mi-cultivo-bec00",
  storageBucket: "maquinaria-mi-cultivo-bec00.firebasestorage.app",
  messagingSenderId: "1073659069298",
  appId: "1:1073659069298:web:e3586e18e8aeace36cd3eb",
  measurementId: "G-X9Z8N11121"
};

// Evitar inicializar Firebase dos veces
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Exportar servicios necesarios
export const auth = getAuth(app);
export const db = getDatabase(app);      // Realtime Database
export const firestore = getFirestore(app);
export const storage = getStorage(app);

export default app;

