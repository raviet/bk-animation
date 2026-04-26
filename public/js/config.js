import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyBG377KlyGO543RYR5YZQY9necmjrUmEVE",
  authDomain: "bkanimationemerainville.firebaseapp.com",
  projectId: "bkanimationemerainville",
  storageBucket: "bkanimationemerainville.firebasestorage.app",
  messagingSenderId: "312167238846",
  appId: "1:312167238846:web:b79492e2092bb21866a2ef"
};

export const PLACES = 4;
export const HORAIRES = [
  "13h00 – 13h30","13h30 – 14h00","14h00 – 14h30","14h30 – 15h00",
  "15h00 – 15h30","15h30 – 16h00","16h00 – 16h30","16h30 – 17h00"
];
export const JOURS = ["Samedi","Dimanche"];
export function slotId(jour, idx) { return `${jour}-${idx}`; }

const fbApp = initializeApp(firebaseConfig);
export const db = getFirestore(fbApp);
