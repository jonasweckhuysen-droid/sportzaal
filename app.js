/**
 * FireFit — Sportzaal Reservaties
 * app.js
 *
 * Features:
 *  - Vaste tijdslots per dag
 *  - Maximum 3 reservaties per tijdslot
 *  - Eigen reservaties annuleren
 *  - Kalender toont bezetting per slot
 */

import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURATIE
// ══════════════════════════════════════════════════════════════════════════════

/** Tijdslots die beschikbaar zijn per dag (blokken van 1 uur) */
const TIJDSLOTS = [
  { label: "06:00 – 07:00", uur: "06:00" },
  { label: "07:00 – 08:00", uur: "07:00" },
  { label: "08:00 – 09:00", uur: "08:00" },
  { label: "09:00 – 10:00", uur: "09:00" },
  { label: "10:00 – 11:00", uur: "10:00" },
  { label: "11:00 – 12:00", uur: "11:00" },
  { label: "12:00 – 13:00", uur: "12:00" },
  { label: "13:00 – 14:00", uur: "13:00" },
  { label: "14:00 – 15:00", uur: "14:00" },
  { label: "15:00 – 16:00", uur: "15:00" },
  { label: "16:00 – 17:00", uur: "16:00" },
  { label: "17:00 – 18:00", uur: "17:00" },
  { label: "18:00 – 19:00", uur: "18:00" },
  { label: "19:00 – 20:00", uur: "19:00" },
  { label: "20:00 – 21:00", uur: "20:00" },
  { label: "21:00 – 22:00", uur: "21:00" },
];

const MAX_PER_SLOT = 3;

// ══════════════════════════════════════════════════════════════════════════════
// NAAM BEHEREN
// ══════════════════════════════════════════════════════════════════════════════

let naam = localStorage.getItem("naam");

if (!naam) {
  naam = prompt("Wat is jouw naam?") || "Onbekend";
  localStorage.setItem("naam", naam.trim());
}

naam = naam.trim();
document.getElementById("userNaam").textContent = naam;

document.getElementById("btnWijzigNaam").addEventListener("click", () => {
  const nieuw = prompt("Naam wijzigen:", naam);
  if (nieuw && nieuw.trim()) {
    naam = nieuw.trim();
    localStorage.setItem("naam", naam);
    document.getElementById("userNaam").textContent = naam;
    toonToast("Naam gewijzigd naar " + naam, "info");
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════════════════════════

/** @type {Array<{id: string, naam: string, datum: string, uur: string}>} */
let alleReservaties = [];

/** @type {FullCalendar.Calendar} */
let calendar;

/** Datum dat momenteel open staat in de modal */
let actieveDatum = null;

// ══════════════════════════════════════════════════════════════════════════════
// FIRESTORE
// ══════════════════════════════════════════════════════════════════════════════

async function laadReservaties() {
  alleReservaties = [];
  const snap = await getDocs(collection(db, "reservaties"));
  snap.forEach((item) => {
    const r = item.data();
    alleReservaties.push({
      id:    item.id,
      naam:  r.naam,
      datum: r.datum,
      uur:   r.uur,
    });
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function reservatiesInSlot(datum, uur) {
  return alleReservaties.filter((r) => r.datum === datum && r.uur === uur);
}

function eigenReservatieInSlot(datum, uur) {
  return alleReservaties.find(
    (r) => r.datum === datum && r.uur === uur && r.naam === naam
  );
}

function isVerleden(datumStr) {
  const vandaag = new Date();
  vandaag.setHours(0, 0, 0, 0);
  return new Date(datumStr + "T00:00:00") < vandaag;
}

function formatDatum(datumStr) {
  return new Date(datumStr + "T12:00:00").toLocaleDateString("nl-BE", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════════════════════════

let toastTimer = null;

function toonToast(bericht, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = bericht;
  t.className = `toast toast-${type} zichtbaar`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("zichtbaar"), 3200);
}

// ══════════════════════════════════════════════════════════════════════════════
// KALENDER
// ══════════════════════════════════════════════════════════════════════════════

function bouwCalendarEvents() {
  // Groepeer per datum → uur
  const groepen = {};
  alleReservaties.forEach((r) => {
    if (!groepen[r.datum])       groepen[r.datum] = {};
    if (!groepen[r.datum][r.uur]) groepen[r.datum][r.uur] = [];
    groepen[r.datum][r.uur].push(r);
  });

  const events = [];
  Object.entries(groepen).forEach(([datum, uren]) => {
    Object.entries(uren).forEach(([uur, lijst]) => {
      const isEigen = lijst.some((r) => r.naam === naam);
      events.push({
        id:              `ev_${datum}_${uur}`,
        title:           `${uur.slice(0, 5)} · ${lijst.length}/${MAX_PER_SLOT}`,
        start:           `${datum}T${uur}`,
        backgroundColor: isEigen ? "#c1121f" : "#2d2d42",
        borderColor:     isEigen ? "#e01020" : "#42425a",
        textColor:       isEigen ? "#fff"    : "#9ca3af",
        extendedProps:   { datum, uur, count: lijst.length, isEigen },
      });
    });
  });
  return events;
}

function updateCalendarEvents() {
  if (!calendar) return;
  calendar.getEvents().forEach((e) => e.remove());
  bouwCalendarEvents().forEach((e) => calendar.addEvent(e));
}

async function initialiseerCalendar() {
  await laadReservaties();

  calendar = new FullCalendar.Calendar(document.getElementById("calendar"), {
    initialView: "dayGridMonth",
    locale:      "nl",
    selectable:  true,
    height:      "auto",

    headerToolbar: {
      left:   "prev",
      center: "title",
      right:  "next today",
    },

    buttonText: {
      today: "Vandaag",
    },

    dateClick(info) {
      openModal(info.dateStr);
    },

    eventClick(info) {
      const datum = info.event.extendedProps.datum
        || info.event.startStr.split("T")[0];
      openModal(datum);
    },

    events: bouwCalendarEvents(),

    // Voeg klasse toe aan dag-cel als er eigen reservatie is
    dayCellDidMount(info) {
      const ds = info.date.toISOString().split("T")[0];
      const dagRes = alleReservaties.filter((r) => r.datum === ds);
      if (dagRes.some((r) => r.naam === naam)) {
        info.el.classList.add("dag-eigen-indicator");
      }
    },
  });

  calendar.render();
}

// ══════════════════════════════════════════════════════════════════════════════
// MODAL
// ══════════════════════════════════════════════════════════════════════════════

function openModal(datum) {
  if (isVerleden(datum)) {
    toonToast("Reserveren in het verleden is niet mogelijk.", "fout");
    return;
  }

  actieveDatum = datum;
  document.getElementById("modalDatumLabel").textContent = formatDatum(datum);
  document.getElementById("modal").classList.add("zichtbaar");
  renderSlots(datum);
}

function sluitModal() {
  document.getElementById("modal").classList.remove("zichtbaar");
  actieveDatum = null;
}

// Sluit-knoppen
document.getElementById("btnSluit").addEventListener("click", sluitModal);
document.getElementById("btnSluiten").addEventListener("click", sluitModal);
document.getElementById("modalBackdrop").addEventListener("click", sluitModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") sluitModal();
});

// Expose voor eventuele inline gebruik (achterwaartse compat.)
window.sluitPopup = sluitModal;

// ══════════════════════════════════════════════════════════════════════════════
// SLOTS RENDEREN
// ══════════════════════════════════════════════════════════════════════════════

function renderSlots(datum) {
  const grid = document.getElementById("slotsGrid");
  grid.innerHTML = "";

  TIJDSLOTS.forEach((slot) => {
    const bezet    = reservatiesInSlot(datum, slot.uur);
    const eigenRes = eigenReservatieInSlot(datum, slot.uur);
    const aantalBezet = bezet.length;
    const vol      = aantalBezet >= MAX_PER_SLOT && !eigenRes;
    const isEigen  = !!eigenRes;

    // ── Card ────────────────────────────────────────────────────────────────
    const card = document.createElement("div");
    card.className = [
      "slot-card",
      vol     ? "slot-vol"  : "",
      isEigen ? "slot-eigen": "",
    ].filter(Boolean).join(" ");

    // ── Vlammen (capaciteit) ─────────────────────────────────────────────────
    const vlammenHTML = Array.from({ length: MAX_PER_SLOT }, (_, i) =>
      `<i class="fa-solid fa-fire slot-vlam ${i < aantalBezet ? "vlam-aan" : "vlam-uit"}"></i>`
    ).join("");

    // ── Badge ────────────────────────────────────────────────────────────────
    let badgeHTML;
    if (isEigen) {
      badgeHTML = `<span class="slot-badge badge-eigen"><i class="fa-solid fa-check"></i> Jouw reservatie</span>`;
    } else if (vol) {
      badgeHTML = `<span class="slot-badge badge-vol"><i class="fa-solid fa-lock"></i> Vol</span>`;
    } else {
      const vrij = MAX_PER_SLOT - aantalBezet;
      badgeHTML = `<span class="slot-badge badge-vrij">${vrij} plek${vrij === 1 ? "" : "ken"} vrij</span>`;
    }

    // ── Deelnemers ───────────────────────────────────────────────────────────
    let deelnemersHTML = "";
    if (bezet.length > 0) {
      const chips = bezet.map((r) => {
        const isZelf = r.naam === naam;
        return `<span class="deelnemer-chip${isZelf ? " chip-eigen" : ""}">
          <i class="fa-solid fa-user-helmet-safety"></i> ${r.naam}
        </span>`;
      }).join("");
      deelnemersHTML = `<div class="slot-deelnemers">${chips}</div>`;
    }

    // ── Actieknop ────────────────────────────────────────────────────────────
    let actieHTML;
    if (isEigen) {
      actieHTML = `<button class="btn-annuleer js-annuleer" data-id="${eigenRes.id}">
        <i class="fa-solid fa-xmark"></i> Annuleer
      </button>`;
    } else if (vol) {
      actieHTML = `<button class="btn-reserveer" disabled>
        <i class="fa-solid fa-ban"></i> Vol
      </button>`;
    } else {
      actieHTML = `<button class="btn-reserveer js-reserveer" data-datum="${datum}" data-uur="${slot.uur}">
        <i class="fa-solid fa-fire"></i> Reserveer
      </button>`;
    }

    card.innerHTML = `
      <div class="slot-info">
        <div class="slot-tijd">${slot.label}</div>
        <div class="slot-status">${badgeHTML}</div>
        ${deelnemersHTML}
      </div>
      <div class="slot-vlammen">${vlammenHTML}</div>
      <div class="slot-actie">${actieHTML}</div>
    `;

    // ── Event listeners ──────────────────────────────────────────────────────
    const btnRes = card.querySelector(".js-reserveer");
    if (btnRes) {
      btnRes.addEventListener("click", () =>
        voerReservatieUit(datum, slot.uur, btnRes)
      );
    }

    const btnAnn = card.querySelector(".js-annuleer");
    if (btnAnn) {
      btnAnn.addEventListener("click", () =>
        voerAnnuleringUit(eigenRes.id, datum)
      );
    }

    grid.appendChild(card);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// RESERVEREN
// ══════════════════════════════════════════════════════════════════════════════

async function voerReservatieUit(datum, uur, knop) {
  // Hercheck slot-bezetting (concurrent updates)
  await laadReservaties();
  const bezet = reservatiesInSlot(datum, uur);

  if (bezet.length >= MAX_PER_SLOT) {
    toonToast("Dit tijdslot is ondertussen vol geworden.", "fout");
    renderSlots(datum);
    return;
  }

  if (eigenReservatieInSlot(datum, uur)) {
    toonToast("Je hebt dit tijdslot al gereserveerd.", "info");
    renderSlots(datum);
    return;
  }

  knop.disabled = true;
  knop.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Even geduld…`;

  try {
    await addDoc(collection(db, "reservaties"), { naam, datum, uur });
    await laadReservaties();
    renderSlots(datum);
    updateCalendarEvents();
    toonToast("Reservatie geplaatst! 🔥");
  } catch (err) {
    console.error("Reservatie mislukt:", err);
    toonToast("Reservatie mislukt. Probeer opnieuw.", "fout");
    knop.disabled = false;
    knop.innerHTML = `<i class="fa-solid fa-fire"></i> Reserveer`;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ANNULEREN
// ══════════════════════════════════════════════════════════════════════════════

async function voerAnnuleringUit(reservatieId, datum) {
  if (!confirm("Wil je jouw reservatie annuleren?")) return;

  try {
    await deleteDoc(doc(db, "reservaties", reservatieId));
    await laadReservaties();
    renderSlots(datum);
    updateCalendarEvents();
    toonToast("Reservatie geannuleerd.");
  } catch (err) {
    console.error("Annulering mislukt:", err);
    toonToast("Annulering mislukt. Probeer opnieuw.", "fout");
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// OPSTARTEN
// ══════════════════════════════════════════════════════════════════════════════

initialiseerCalendar();
