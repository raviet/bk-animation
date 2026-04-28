import { doc, onSnapshot, runTransaction } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { PLACES, HORAIRES, JOURS, slotId, db } from './config.js';

let state = { jour: "Samedi", selected: null, prenom: "", nom: "", nb_enfants: 1, confirmed: false, slots: {} };
let unsubscribe = null;

function totalEnfants(resa) {
  return (resa || []).reduce((s, r) => s + (r.nb_enfants || 1), 0);
}

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
      const pris = totalEnfants(resa);
      if (pris + state.nb_enfants > PLACES) throw new Error(`Plus assez de places. Il reste ${PLACES - pris} enfant(s).`);
      resa.push({ prenom: state.prenom, nom: state.nom, nb_enfants: state.nb_enfants, ts: Date.now() });
      tx.set(ref, { ...data, [id]: resa }, { merge: true });
    });
    state.confirmed = true;
    render();
  } catch(e) {
    alert("Impossible de réserver : " + e.message);
  }
}

function renderSlotsSection(jour) {
  return HORAIRES.map((h, i) => {
    const id = slotId(jour, i);
    const nb = totalEnfants(state.slots[id]);
    const full = nb >= PLACES;
    const sel = state.selected === i && state.jour === jour;
    const dispo = PLACES - nb;
    const cls = "slot" + (full ? " full" : "") + (sel ? " selected" : "");
    const badge = full
      ? `<span class="slot-badge badge-full">Complet</span>`
      : sel ? `<span class="slot-badge badge-sel">Sélectionné</span>`
      : `<span class="slot-badge badge-ok">${dispo} place${dispo > 1 ? "s" : ""}</span>`;
    return `<div class="${cls}" data-idx="${i}" data-jour="${jour}" data-full="${full}" data-dispo="${dispo}">
      <div class="slot-time">${h}</div>${badge}
    </div>`;
  }).join("");
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
          <div class="recap-row"><span class="recap-label">Enfants</span><span class="recap-value">${state.nb_enfants}</span></div>
          <div class="recap-row"><span class="recap-label">Jour</span><span class="recap-value">${state.jour}</span></div>
          <div class="recap-row"><span class="recap-label">Créneau</span><span class="recap-value">${HORAIRES[state.selected]}</span></div>
        </div>
        <button class="btn-back" id="btn-reset">Nouvelle réservation</button>
      </div>`;
    document.getElementById("btn-reset").onclick = () => {
      state = { ...state, selected: null, prenom: "", nom: "", nb_enfants: 1, confirmed: false };
      render();
    };
    return;
  }

  const showForm = state.selected !== null;
  const id = showForm ? slotId(state.jour, state.selected) : null;
  const dispo = id ? PLACES - totalEnfants(state.slots[id]) : PLACES;
  const canConfirm = showForm && state.prenom.trim() && state.nom.trim() && state.nb_enfants >= 1 && state.nb_enfants <= dispo;

  el.innerHTML = `
    <div class="days-grid">
      ${JOURS.map(j => `
        <div class="day-col">
          <div class="day-col-title">${j}</div>
          <div class="slots slots-col">${renderSlotsSection(j)}</div>
        </div>
      `).join("")}
    </div>
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
      <div class="form-row">
        <label class="form-label">Nombre d'enfants (max ${dispo})</label>
        <input class="form-input" id="inp-enfants" type="number" min="1" max="${dispo}" value="${state.nb_enfants}" />
      </div>
    </div>
    <button class="btn-confirm" id="btn-confirm" ${canConfirm ? "" : "disabled"}>Confirmer la réservation</button>
    ` : ""}
  `;

  el.querySelectorAll(".slot").forEach(s => {
    s.onclick = () => {
      if (s.dataset.full === "true") return;
      state.jour = s.dataset.jour;
      state.selected = parseInt(s.dataset.idx);
      state.nb_enfants = Math.min(state.nb_enfants, parseInt(s.dataset.dispo));
      render();
    };
  });

  if (showForm) {
    const updateBtn = () => {
      const ok = state.prenom.trim() && state.nom.trim() && state.nb_enfants >= 1 && state.nb_enfants <= dispo;
      const btn = document.getElementById("btn-confirm");
      btn.disabled = !ok;
      btn.onclick = ok ? confirmer : null;
    };
    document.getElementById("inp-prenom").oninput = e => { state.prenom = e.target.value; updateBtn(); };
    document.getElementById("inp-nom").oninput = e => { state.nom = e.target.value; updateBtn(); };
    document.getElementById("inp-enfants").oninput = e => {
      state.nb_enfants = Math.max(1, Math.min(parseInt(e.target.value) || 1, dispo));
      updateBtn();
    };
    if (canConfirm) document.getElementById("btn-confirm").onclick = confirmer;
  }
}

ecouter();
