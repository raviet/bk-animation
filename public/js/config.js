import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getAuth, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyBG377KlyGO543RYR5YZQY9necmjrUmEVE",
  authDomain: "bkanimationemerainville.firebaseapp.com",
  projectId: "bkanimationemerainville",
  storageBucket: "bkanimationemerainville.firebasestorage.app",
  messagingSenderId: "312167238846",
  appId: "1:312167238846:web:b79492e2092bb21866a2ef"
};

export const PLACES = 10;
export const HORAIRES = [
  "14h00 – 15h00", "15h00 – 16h00",
  "16h00 – 17h00","17h00 - 18h00"
];
export const JOURS = ["Samedi","Dimanche"];
export function slotId(jour, idx) { return `${jour}-${idx}`; }

const fbApp = initializeApp(firebaseConfig);
export const db = getFirestore(fbApp);
export const auth = getAuth(fbApp);
export const IS_DEV = location.hostname === "localhost" || location.hostname === "127.0.0.1";

if (IS_DEV) {
  connectFirestoreEmulator(db, "localhost", 8080);
  connectAuthEmulator(auth, "http://localhost:9099");
}
