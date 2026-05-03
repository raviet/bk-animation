const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

const ADMINS = [
  "thibaudravier@gmail.com",
  "mariemstoyan@gmail.com",
];

function checkAdmin(auth) {
  if (!auth || !ADMINS.includes(auth.token.email)) {
    throw new HttpsError("permission-denied", "Accès refusé.");
  }
}

exports.supprimerResa = onCall(async ({ data, auth }) => {
  checkAdmin(auth);
  const { id, ts } = data;
  if (!id || !ts) throw new HttpsError("invalid-argument", "id et ts requis.");

  const ref = db.collection("semaine").doc("courante");
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const slots = snap.exists ? snap.data() : {};
    const resas = (slots[id] || []).filter((r) => r.ts !== ts);
    tx.update(ref, { [id]: resas });
  });
  return { ok: true };
});

exports.modifierResa = onCall(async ({ data, auth }) => {
  checkAdmin(auth);
  const { id, ts, prenom, nom, nb_enfants } = data;
  if (!id || !ts || !prenom || !nom || !nb_enfants) {
    throw new HttpsError("invalid-argument", "Données manquantes.");
  }
  const ref = db.collection("semaine").doc("courante");
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const slots = snap.exists ? snap.data() : {};
    const resas = (slots[id] || []).map((r) =>
      r.ts === ts ? { ...r, prenom, nom, nb_enfants } : r
    );
    tx.update(ref, { [id]: resas });
  });
  return { ok: true };
});

exports.resetAll = onCall(async ({ auth }) => {
  checkAdmin(auth);
  await db.collection("semaine").doc("courante").set({});
  return { ok: true };
});
