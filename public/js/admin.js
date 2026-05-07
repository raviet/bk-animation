import { doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js';
import { PLACES, HORAIRES, JOURS, slotId, db, auth, IS_DEV } from './config.js';

const functions = getFunctions();
if (IS_DEV) connectFunctionsEmulator(functions, "localhost", 5001);
const fnSupprimerResa = httpsCallable(functions, 'supprimerResa');
const fnResetAll = httpsCallable(functions, 'resetAll');

const ADMINS = [
  "thibaudravier@gmail.com",
  "mariemstoyan@gmail.com",
];

let state = { slots: {}, showResetConfirm: false };
let unsubscribeFirestore = null;
let pendingError = null;

onAuthStateChanged(auth, user => {
  if (user && ADMINS.includes(user.email)) {
    pendingError = null;
    startAdmin();
  } else if (user) {
    pendingError = "Accès refusé. Ce compte n'est pas autorisé.";
    signOut(auth);
  } else {
    stopAdmin();
    const err = pendingError;
    pendingError = null;
    renderLogin(err);
  }
});

function startAdmin() {
  const ref = doc(db, "semaine", "courante");
  unsubscribeFirestore = onSnapshot(ref, snap => {
    state.slots = snap.exists() ? (snap.data() || {}) : {};
    render();
  }, err => {
    document.getElementById("app").innerHTML =
      `<div class="error-msg">Erreur de connexion : ${err.message}</div>`;
  });
}

function stopAdmin() {
  if (unsubscribeFirestore) {
    unsubscribeFirestore();
    unsubscribeFirestore = null;
  }
}

function renderLogin(errorMsg = null) {
  const badge = document.getElementById("total-badge");
  if (badge) badge.textContent = "";
  renderLogoutBtn(false);

  document.getElementById("app").innerHTML = `
    <div class="login-card">
      <h2 class="login-title">Connexion administrateur</h2>
      <button class="btn-google" id="btn-google">
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Se connecter avec Google
      </button>
      <div class="login-divider"><span>ou</span></div>
      <div class="form-row">
        <label class="form-label">Email</label>
        <input class="form-input" id="login-email" type="email" placeholder="email@exemple.com" autocomplete="email" />
      </div>
      <div class="form-row">
        <label class="form-label">Mot de passe</label>
        <input class="form-input" id="login-password" type="password" placeholder="••••••••" autocomplete="current-password" />
      </div>
      <div id="login-error" class="login-error"${errorMsg ? '' : ' style="display:none"'}>${errorMsg || ''}</div>
      <button class="btn-confirm" id="btn-login">Se connecter</button>
    </div>
  `;

  document.getElementById("btn-google").onclick = async () => {
    const errEl = document.getElementById("login-error");
    errEl.style.display = "none";
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch(e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        errEl.textContent = "Erreur de connexion Google.";
        errEl.style.display = "block";
      }
    }
  };

  const btn = document.getElementById("btn-login");
  const errEl = document.getElementById("login-error");

  const attempt = async () => {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    btn.disabled = true;
    errEl.style.display = "none";
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      errEl.textContent = "Email ou mot de passe incorrect.";
      errEl.style.display = "block";
      btn.disabled = false;
    }
  };

  btn.onclick = attempt;
  document.getElementById("login-password").onkeydown = e => { if (e.key === "Enter") attempt(); };
}

function renderLogoutBtn(show) {
  const header = document.querySelector(".header-inner");
  const existing = document.getElementById("btn-logout");
  if (existing) existing.remove();
  if (!show) return;

  const btn = document.createElement("button");
  btn.id = "btn-logout";
  btn.className = "btn-logout";
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Déconnexion`;
  btn.onclick = () => signOut(auth);
  header.appendChild(btn);
}

async function supprimerResa(id, ts) {
  await fnSupprimerResa({ id, ts });
}

async function modifierResa(id, ts, prenom, nom, nb_enfants) {
  const fnModifierResa = httpsCallable(functions, 'modifierResa');
  await fnModifierResa({ id, ts, prenom, nom, nb_enfants });
}

function showModifierModal(id, ts, r) {
  const autresEnfants = (state.slots[id] || [])
    .filter(x => x.ts !== ts)
    .reduce((s, x) => s + (x.nb_enfants || 1), 0);
  const maxEnfants = PLACES - autresEnfants;

  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";
  overlay.id = "modifier-overlay";
  overlay.innerHTML = `
    <div class="confirm-box">
      <h3>Modifier la réservation</h3>
      <div class="form-row" style="margin-top:12px">
        <label class="form-label">Prénom</label>
        <input class="form-input" id="mod-prenom" type="text" value="${r.prenom}" />
      </div>
      <div class="form-row">
        <label class="form-label">Nom</label>
        <input class="form-input" id="mod-nom" type="text" value="${r.nom}" />
      </div>
      <div class="form-row">
        <label class="form-label">Nombre d'enfants (max ${maxEnfants})</label>
        <input class="form-input" id="mod-enfants" type="number" min="1" max="${maxEnfants}" value="${Math.min(r.nb_enfants || 1, maxEnfants)}" />
      </div>
      <div class="confirm-actions" style="margin-top:16px">
        <button class="btn-cancel-c" id="mod-cancel">Annuler</button>
        <button class="btn-confirm-mod" id="mod-save">Enregistrer</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector("#mod-cancel").onclick = () => overlay.remove();
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  overlay.querySelector("#mod-save").onclick = async () => {
    const prenom = overlay.querySelector("#mod-prenom").value.trim();
    const nom = overlay.querySelector("#mod-nom").value.trim();
    const nb_enfants = Math.min(Math.max(parseInt(overlay.querySelector("#mod-enfants").value) || 1, 1), maxEnfants);
    if (!prenom || !nom) return;
    overlay.remove();
    await modifierResa(id, ts, prenom, nom, nb_enfants);
  };
}

async function resetAll() {
  await fnResetAll();
  state.showResetConfirm = false;
  render();
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

function initials(prenom, nom) {
  return ((prenom?.[0] || "") + (nom?.[0] || "")).toUpperCase();
}

function countEnfants(resa) {
  return (resa || []).reduce((s, r) => s + (r.nb_enfants || 1), 0);
}

function totalEnfants() {
  return Object.values(state.slots).reduce((sum, arr) => sum + countEnfants(arr), 0);
}

function renderDayPlanning(jour) {
  return HORAIRES.map((h, i) => {
    const id = slotId(jour, i);
    const resas = state.slots[id] || [];
    const nb = countEnfants(resas);
    const dispo = PLACES - nb;
    const countCls = "";
    const countLabel = nb === 0
      ? `<span class="count-pill count-empty">Vide</span>`
      : nb >= PLACES
        ? `<span class="count-pill count-full">Complet</span>`
        : `<span class="count-pill count-ok">${dispo} / ${PLACES}</span><span class="slot-count-sep">–</span><span class="count-pill count-full">${nb} / ${PLACES}</span>`;

    const resaItems = resas.length > 0
      ? resas.map(r => `
        <div class="resa-item">
          <div class="resa-info">
            <span class="resa-name">${r.prenom} <span class="resa-nom">${r.nom}</span></span>
            <span class="resa-time">${r.ts ? "Réservé le " + formatTime(r.ts) : ""}</span>
            <div class="resa-actions">
              <button class="btn-modifier" data-id="${id}" data-ts="${r.ts}">Modifier</button>
              <button class="btn-supprimer" data-id="${id}" data-ts="${r.ts}">Supprimer</button>
            </div>
          </div>
          <div class="resa-avatar">
            <span class="avatar-count">${r.nb_enfants || 1}</span>
            <span class="avatar-label">enfant${(r.nb_enfants || 1) > 1 ? "s" : ""}</span>
          </div>
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
}

function render() {
  renderLogoutBtn(true);
  const el = document.getElementById("app");
  const total = totalEnfants();
  document.getElementById("total-badge").textContent = `${total} enfant${total > 1 ? "s" : ""}`;

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
    <div class="admin-days-grid">
      ${JOURS.map(j => `
        <div class="admin-day-col">
          <div class="day-col-title">${j}</div>
          <div class="planning">${renderDayPlanning(j)}</div>
        </div>
      `).join("")}
    </div>
    <button class="btn-reset" id="btn-reset">Remettre à zéro toutes les réservations</button>
    ${confirmHTML}
  `;

  el.querySelectorAll(".btn-modifier").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const ts = Number(btn.dataset.ts);
      const r = (state.slots[id] || []).find(r => r.ts === ts);
      if (r) showModifierModal(id, ts, r);
    };
  });
  el.querySelectorAll(".btn-supprimer").forEach(btn => {
    btn.onclick = () => supprimerResa(btn.dataset.id, Number(btn.dataset.ts));
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
