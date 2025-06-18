// src/firebase/config.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD9g01xF-4WhmyRTsoK9XNOpf1ZFPYx934",
  authDomain: "cocina713-797f1.firebaseapp.com",
  projectId: "cocina713-797f1",
  storageBucket: "cocina713-797f1.appspot.com", // ← CORREGIDO (.app → .app**spot.com**)
  messagingSenderId: "856635530867",
  appId: "1:856635530867:web:769068d2d419e20b67d406",
  measurementId: "G-F2Z663QXLP"
};

// Inicializa solo aquí
const app = initializeApp(firebaseConfig);

// Exporta los servicios una sola vez
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const storage = getStorage(app);
