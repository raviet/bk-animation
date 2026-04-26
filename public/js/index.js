import { doc, onSnapshot, runTransaction } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { PLACES, HORAIRES, JOURS, slotId, db } from './config.js';

let state = { jour: "Samedi", selected: null, prenom: "", nom: "", confirmed: false, slots: {} };
let unsubscribe = null;

function ecouter() {
  if (unsubscribe) unsubscribe();
  const ref = doc(db, "semaine", "courante");
  unsubscribe = onSnapshot(ref, snap => {
    state.slots = snap.exists() ? (snap.data() || {}) : {};
    render();
  }, err => {
    document.getElementById("app").innerHTML =
      `<div class="error-msg">Erreur de connexion : ${err.message}</div>`;
  });
}

async function confirmer() {
  const id = slotId(state.jour, state.selected);
  const ref = doc(db, "semaine", "courante");
  try {
    await runTransaction(db, async tx => {
      const snap = await tx.get(ref);
      const data = snap.exists() ? snap.data() : {};
      const resa = data[id] || [];
      if (resa.length >= PLACES) throw new Error("Ce créneau vient d'être complet.");
      resa.push({ prenom: state.prenom, nom: state.nom, ts: Date.now() });
      tx.set(ref, { ...data, [id]: resa }, { merge: true });
    });
    state.confirmed = true;
    render();
  } catch(e) {
    alert("Impossible de réserver : " + e.message);
  }
}

function render() {
  const el = document.getElementById("app");

  if (state.confirmed) {
    el.innerHTML = `
      <div class="success">
        <div class="success-icon">✓</div>
        <h2>Réservation confirmée !</h2>
        <p>À tout à l'heure chez<br>Burger King Émerainville</p>
        <div class="recap">
          <div class="recap-row"><span class="recap-label">Prénom</span><span class="recap-value">${state.prenom}</span></div>
          <div class="recap-row"><span class="recap-label">Nom</span><span class="recap-value">${state.nom}</span></div>
          <div class="recap-row"><span class="recap-label">Jour</span><span class="recap-value">${state.jour}</span></div>
          <div class="recap-row"><span class="recap-label">Créneau</span><span class="recap-value">${HORAIRES[state.selected]}</span></div>
        </div>
        <button class="btn-back" id="btn-reset">Nouvelle réservation</button>
      </div>`;
    document.getElementById("btn-reset").onclick = () => {
      state = { ...state, selected: null, prenom: "", nom: "", confirmed: false };
      render();
    };
    return;
  }

  const slotsHTML = HORAIRES.map((h, i) => {
    const id = slotId(state.jour, i);
    const nb = (state.slots[id] || []).length;
    const full = nb >= PLACES;
    const sel = state.selected === i;
    const dispo = PLACES - nb;
    const cls = "slot" + (full ? " full" : "") + (sel ? " selected" : "");
    const badge = full
      ? `<span class="slot-badge badge-full">Complet</span>`
      : sel ? `<span class="slot-badge badge-sel">Sélectionné</span>`
      : `<span class="slot-badge badge-ok">${dispo} place${dispo > 1 ? "s" : ""}</span>`;
    return `<div class="${cls}" data-idx="${i}" data-full="${full}">${
      `<div class="slot-time">${h}</div>${badge}`}</div>`;
  }).join("");

  const showForm = state.selected !== null;
  const canConfirm = showForm && state.prenom.trim() && state.nom.trim();

  el.innerHTML = `
    <p class="section-title">Choisissez un jour</p>
    <div class="day-tabs">
      ${JOURS.map(j => `<div class="day-tab${state.jour===j?' active':''}" data-jour="${j}">${j}</div>`).join("")}
    </div>
    <p class="section-title">Créneaux disponibles</p>
    <div class="slots">${slotsHTML}</div>
    ${showForm ? `
    <div class="form-card">
      <p class="section-title" style="margin-bottom:12px">Vos informations</p>
      <div class="form-row">
        <label class="form-label">Prénom</label>
        <input class="form-input" id="inp-prenom" type="text" placeholder="Marie" value="${state.prenom}" autocomplete="given-name" />
      </div>
      <div class="form-row">
        <label class="form-label">Nom</label>
        <input class="form-input" id="inp-nom" type="text" placeholder="Dupont" value="${state.nom}" autocomplete="family-name" />
      </div>
    </div>
    <button class="btn-confirm" id="btn-confirm" ${canConfirm ? "" : "disabled"}>Confirmer la réservation</button>
    ` : ""}
  `;

  el.querySelectorAll(".day-tab").forEach(t => {
    t.onclick = () => { state.jour = t.dataset.jour; state.selected = null; render(); };
  });
  el.querySelectorAll(".slot").forEach(s => {
    s.onclick = () => {
      if (s.dataset.full === "true") return;
      state.selected = parseInt(s.dataset.idx);
      render();
    };
  });
  if (showForm) {
    const updateBtn = () => {
      const ok = state.prenom.trim() && state.nom.trim();
      const btn = document.getElementById("btn-confirm");
      btn.disabled = !ok;
      btn.onclick = ok ? confirmer : null;
    };
    document.getElementById("inp-prenom").oninput = e => { state.prenom = e.target.value; updateBtn(); };
    document.getElementById("inp-nom").oninput = e => { state.nom = e.target.value; updateBtn(); };
    if (canConfirm) document.getElementById("btn-confirm").onclick = confirmer;
  }
}

ecouter();
