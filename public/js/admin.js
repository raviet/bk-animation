import { doc, onSnapshot, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { PLACES, HORAIRES, JOURS, slotId, db } from './config.js';

let state = { jour: "Samedi", slots: {}, showResetConfirm: false };

const ref = doc(db, "semaine", "courante");
onSnapshot(ref, snap => {
  state.slots = snap.exists() ? (snap.data() || {}) : {};
  render();
}, err => {
  document.getElementById("app").innerHTML =
    `<div class="error-msg">Erreur de connexion : ${err.message}</div>`;
});

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function initials(prenom, nom) {
  return ((prenom?.[0] || "") + (nom?.[0] || "")).toUpperCase();
}

function totalResas() {
  return Object.values(state.slots).reduce((sum, arr) => sum + (arr?.length || 0), 0);
}

async function resetAll() {
  await setDoc(ref, {});
  state.showResetConfirm = false;
  render();
}

function render() {
  const el = document.getElementById("app");
  const total = totalResas();
  document.getElementById("total-badge").textContent = `${total} réservation${total > 1 ? "s" : ""}`;

  const slotsHTML = HORAIRES.map((h, i) => {
    const id = slotId(state.jour, i);
    const resas = state.slots[id] || [];
    const nb = resas.length;
    const countCls = nb === 0 ? "count-empty" : nb >= PLACES ? "count-full" : "count-ok";
    const countLabel = nb === 0 ? "Vide" : `${nb} / ${PLACES}`;

    const resaItems = resas.length > 0
      ? resas.map(r => `
        <div class="resa-item">
          <div class="resa-avatar">${initials(r.prenom, r.nom)}</div>
          <span class="resa-name">${r.prenom} ${r.nom}</span>
          <span class="resa-time">${r.ts ? formatTime(r.ts) : ""}</span>
        </div>`).join("")
      : `<div class="empty-slot">Aucune réservation</div>`;

    return `
      <div class="slot-row">
        <div class="slot-header">
          <span class="slot-time">${h}</span>
          <span class="slot-count ${countCls}">${countLabel}</span>
        </div>
        <div class="slot-body">
          <div class="resa-list">${resaItems}</div>
        </div>
      </div>`;
  }).join("");

  const confirmHTML = state.showResetConfirm ? `
    <div class="confirm-overlay" id="overlay">
      <div class="confirm-box">
        <h3>Remettre à zéro ?</h3>
        <p>Toutes les réservations (samedi et dimanche) seront supprimées définitivement.</p>
        <div class="confirm-actions">
          <button class="btn-cancel-c" id="btn-cancel-reset">Annuler</button>
          <button class="btn-danger" id="btn-confirm-reset">Supprimer</button>
        </div>
      </div>
    </div>` : "";

  el.innerHTML = `
    <p class="section-title">Choisissez un jour</p>
    <div class="day-tabs">
      ${JOURS.map(j => `<div class="day-tab${state.jour===j?' active':''}" data-jour="${j}">${j}</div>`).join("")}
    </div>
    <p class="section-title">Créneaux – ${state.jour}</p>
    <div class="planning">${slotsHTML}</div>
    <button class="btn-reset" id="btn-reset">Remettre à zéro toutes les réservations</button>
    ${confirmHTML}
  `;

  el.querySelectorAll(".day-tab").forEach(t => {
    t.onclick = () => { state.jour = t.dataset.jour; render(); };
  });

  document.getElementById("btn-reset").onclick = () => {
    state.showResetConfirm = true; render();
  };

  if (state.showResetConfirm) {
    document.getElementById("btn-cancel-reset").onclick = () => {
      state.showResetConfirm = false; render();
    };
    document.getElementById("btn-confirm-reset").onclick = resetAll;
    document.getElementById("overlay").onclick = e => {
      if (e.target.id === "overlay") { state.showResetConfirm = false; render(); }
    };
  }
}
