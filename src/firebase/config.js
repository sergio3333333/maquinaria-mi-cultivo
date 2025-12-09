// Import Firebase core modules
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // Realtime Database

const firebaseConfig = {
  apiKey: "AIzaSyAqBNIrbizz50ltkdHyQqd7V4G0Nc9r1ow",
  authDomain: "maquinaria-mi-cultivo-bec00.firebaseapp.com",
  projectId: "maquinaria-mi-cultivo-bec00",
  storageBucket: "maquinaria-mi-cultivo-bec00.firebasestorage.app",
  messagingSenderId: "1073659069298",
  appId: "1:1073659069298:web:e3586e18e8aeace36cd3eb",
  measurementId: "G-X9Z8N11121",
  databaseURL: "https://maquinaria-mi-cultivo-bec00-default-rtdb.firebaseio.com"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar AUTH
export const auth = getAuth(app);

// Exportar DATABASE
export const db = getDatabase(app);

