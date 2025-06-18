// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD9g01xF-4WhmyRTsoK9XNOpf1ZFPYx934",
  authDomain: "cocina713-797f1.firebaseapp.com",
  projectId: "cocina713-797f1",
  storageBucket: "cocina713-797f1.firebasestorage.app",
  messagingSenderId: "856635530867",
  appId: "1:856635530867:web:769068d2d419e20b67d406",
  measurementId: "G-F2Z663QXLP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);