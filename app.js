/**
 * FireFit — Sportzaal Reservaties
 * app.js
 *
 * Features:
 *  - Vaste tijdslots per dag
 *  - Maximum 3 reservaties per tijdslot
 *  - Eigen reservaties annuleren
 *  - Kalender toont bezetting per slot
 *  - Grafische FireFit naam-popup
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
// NAAM POPUP — DYNAMISCH OPBOUWEN
// ══════════════════════════════════════════════════════════════════════════════

function maakNaamPopup() {

  // Voorkom dubbele popup
  if (document.getElementById("firefitNaamModal")) {
    return;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // CSS
  // ────────────────────────────────────────────────────────────────────────────

  const style = document.createElement("style");

  style.id = "firefitNaamModalStyle";

  style.textContent = `

    /* ═══════════════════════════════════════════════════════════════════════
       FIREFIT NAAM POPUP
       ═══════════════════════════════════════════════════════════════════ */

    #firefitNaamModal {
      position: fixed;
      inset: 0;
      z-index: 10000;

      display: none;
      align-items: center;
      justify-content: center;

      padding: 20px;

      font-family: "Inter", sans-serif;
    }


    #firefitNaamModal.actief {
      display: flex;
    }


    /* ─────────────────────────────────────────────────────────────────────
       ACHTERGROND
       ───────────────────────────────────────────────────────────────────── */

    #firefitNaamModal .ff-naam-backdrop {
      position: absolute;
      inset: 0;

      background:
        radial-gradient(
          circle at 50% 30%,
          rgba(193, 18, 31, 0.18),
          transparent 45%
        ),
        rgba(7, 8, 14, 0.88);

      backdrop-filter: blur(9px);
      -webkit-backdrop-filter: blur(9px);

      animation: ffNaamFadeIn .25s ease-out;
    }


    /* ─────────────────────────────────────────────────────────────────────
       KAART
       ───────────────────────────────────────────────────────────────────── */

    #firefitNaamModal .ff-naam-card {
      position: relative;
      z-index: 1;

      width: min(430px, 100%);

      overflow: hidden;

      background:
        linear-gradient(
          145deg,
          #20202d 0%,
          #171721 52%,
          #101018 100%
        );

      border: 1px solid rgba(255,255,255,.09);

      border-radius: 24px;

      box-shadow:
        0 30px 80px rgba(0,0,0,.60),
        0 0 45px rgba(193,18,31,.12);

      animation:
        ffNaamCardIn
        .38s
        cubic-bezier(.16,1,.3,1);
    }


    /* Rode lijn bovenaan */

    #firefitNaamModal .ff-naam-card::before {
      content: "";

      position: absolute;
      top: 0;
      left: 0;
      right: 0;

      height: 4px;

      background:
        linear-gradient(
          90deg,
          #8f0e18,
          #c1121f,
          #ef233c,
          #c1121f,
          #8f0e18
        );
    }


    /* ─────────────────────────────────────────────────────────────────────
       DECORATIEVE GLOW
       ───────────────────────────────────────────────────────────────────── */

    #firefitNaamModal .ff-naam-glow {
      position: absolute;

      width: 230px;
      height: 230px;

      top: -120px;
      right: -80px;

      border-radius: 50%;

      background: rgba(193,18,31,.12);

      filter: blur(40px);

      pointer-events: none;
    }


    /* ─────────────────────────────────────────────────────────────────────
       ICOON
       ───────────────────────────────────────────────────────────────────── */

    #firefitNaamModal .ff-naam-icon {
      position: relative;

      width: 76px;
      height: 76px;

      margin: 34px auto 18px;

      display: flex;
      align-items: center;
      justify-content: center;

      border-radius: 22px;

      background:
        linear-gradient(
          145deg,
          #d51625,
          #960d17
        );

      color: white;

      font-size: 30px;

      box-shadow:
        0 12px 30px rgba(193,18,31,.32),
        inset 0 1px 0 rgba(255,255,255,.18);

      transform: rotate(-2deg);
    }


    #firefitNaamModal .ff-naam-icon i {
      transform: rotate(2deg);
    }


    /* ─────────────────────────────────────────────────────────────────────
       CONTENT
       ───────────────────────────────────────────────────────────────────── */

    #firefitNaamModal .ff-naam-content {
      position: relative;

      padding: 0 34px 28px;

      text-align: center;
    }


    #firefitNaamModal .ff-naam-eyebrow {
      display: flex;
      align-items: center;
      justify-content: center;

      gap: 7px;

      margin-bottom: 8px;

      color: #ef233c;

      font-family: "Barlow Condensed", sans-serif;

      font-size: .75rem;
      font-weight: 700;

      letter-spacing: .18em;
    }


    #firefitNaamModal .ff-naam-eyebrow i {
      font-size: .7rem;
    }


    #firefitNaamModal .ff-naam-title {
      margin: 0;

      color: #fff;

      font-family: "Barlow Condensed", sans-serif;

      font-size: 2.3rem;
      font-weight: 800;

      line-height: 1;

      letter-spacing: -.02em;
    }


    #firefitNaamModal .ff-naam-text {
      margin: 17px 0 5px;

      color: #e8e8ed;

      font-size: 1rem;
      font-weight: 600;
    }


    #firefitNaamModal .ff-naam-subtext {
      max-width: 330px;

      margin: 0 auto 22px;

      color: #8f8f9e;

      font-size: .82rem;

      line-height: 1.5;
    }


    /* ─────────────────────────────────────────────────────────────────────
       INPUT
       ───────────────────────────────────────────────────────────────────── */

    #firefitNaamModal .ff-naam-input {
      position: relative;

      display: flex;
      align-items: center;

      width: 100%;

      background: #0d0d14;

      border: 1px solid rgba(255,255,255,.10);

      border-radius: 13px;

      transition:
        border-color .2s ease,
        box-shadow .2s ease,
        background .2s ease;
    }


    #firefitNaamModal .ff-naam-input:focus-within {
      background: #101019;

      border-color: rgba(193,18,31,.8);

      box-shadow:
        0 0 0 3px rgba(193,18,31,.12),
        0 8px 25px rgba(0,0,0,.22);
    }


    #firefitNaamModal .ff-naam-input i {
      margin-left: 17px;

      color: #777785;

      font-size: .95rem;

      transition: color .2s ease;
    }


    #firefitNaamModal .ff-naam-input:focus-within i {
      color: #ef233c;
    }


    #firefitNaamModal #firefitNaamInput {
      width: 100%;

      padding: 15px 16px 15px 12px;

      border: 0;
      outline: 0;

      background: transparent;

      color: #fff;

      font-family: "Inter", sans-serif;

      font-size: .95rem;
      font-weight: 500;
    }


    #firefitNaamModal #firefitNaamInput::placeholder {
      color: #5f5f6c;
    }


    /* ─────────────────────────────────────────────────────────────────────
       KNOP
       ───────────────────────────────────────────────────────────────────── */

    #firefitNaamModal .ff-naam-actions {
      margin-top: 14px;
    }


    #firefitNaamModal .ff-naam-button {
      width: 100%;

      display: flex;
      align-items: center;
      justify-content: center;

      gap: 9px;

      padding: 14px 18px;

      border: 0;

      border-radius: 13px;

      background:
        linear-gradient(
          135deg,
          #c1121f,
          #a30f1a
        );

      color: white;

      font-family: "Inter", sans-serif;

      font-size: .9rem;
      font-weight: 700;

      cursor: pointer;

      box-shadow:
        0 8px 22px rgba(193,18,31,.28),
        inset 0 1px 0 rgba(255,255,255,.14);

      transition:
        transform .15s ease,
        box-shadow .15s ease,
        filter .15s ease;
    }


    #firefitNaamModal .ff-naam-button:hover {
      filter: brightness(1.1);

      transform: translateY(-1px);

      box-shadow:
        0 11px 28px rgba(193,18,31,.38),
        inset 0 1px 0 rgba(255,255,255,.14);
    }


    #firefitNaamModal .ff-naam-button:active {
      transform: translateY(1px);
    }


    /* ─────────────────────────────────────────────────────────────────────
       FOOTER
       ───────────────────────────────────────────────────────────────────── */

    #firefitNaamModal .ff-naam-footer {
      display: flex;
      align-items: center;
      justify-content: center;

      gap: 7px;

      padding: 13px;

      border-top: 1px solid rgba(255,255,255,.06);

      background: rgba(0,0,0,.13);

      color: #60606d;

      font-family: "Barlow Condensed", sans-serif;

      font-size: .72rem;
      font-weight: 600;

      letter-spacing: .08em;

      text-transform: uppercase;
    }


    #firefitNaamModal .ff-naam-footer i {
      color: #c1121f;

      font-size: .65rem;
    }


    /* ─────────────────────────────────────────────────────────────────────
       FOUT / SHAKE
       ───────────────────────────────────────────────────────────────────── */

    #firefitNaamModal .ff-naam-input.ff-error {
      border-color: #c1121f !important;

      box-shadow:
        0 0 0 3px rgba(193,18,31,.14),
        0 0 20px rgba(193,18,31,.12) !important;

      animation:
        ffNaamShake
        .35s
        ease;
    }


    /* ─────────────────────────────────────────────────────────────────────
       ANIMATIES
       ───────────────────────────────────────────────────────────────────── */

    @keyframes ffNaamFadeIn {

      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }

    }


    @keyframes ffNaamCardIn {

      from {
        opacity: 0;

        transform:
          translateY(20px)
          scale(.96);
      }

      to {
        opacity: 1;

        transform:
          translateY(0)
          scale(1);
      }

    }


    @keyframes ffNaamShake {

      0%,100% {
        transform: translateX(0);
      }

      20% {
        transform: translateX(-6px);
      }

      40% {
        transform: translateX(6px);
      }

      60% {
        transform: translateX(-4px);
      }

      80% {
        transform: translateX(4px);
      }

    }


    /* ─────────────────────────────────────────────────────────────────────
       MOBIEL
       ───────────────────────────────────────────────────────────────────── */

    @media (max-width: 480px) {

      #firefitNaamModal {
        padding: 15px;
      }

      #firefitNaamModal .ff-naam-card {
        border-radius: 21px;
      }

      #firefitNaamModal .ff-naam-icon {
        width: 68px;
        height: 68px;

        margin-top: 29px;

        border-radius: 20px;

        font-size: 27px;
      }

      #firefitNaamModal .ff-naam-content {
        padding: 0 22px 23px;
      }

      #firefitNaamModal .ff-naam-title {
        font-size: 2rem;
      }

    }

  `;

  document.head.appendChild(style);


  // ────────────────────────────────────────────────────────────────────────────
  // HTML
  // ────────────────────────────────────────────────────────────────────────────

  const modal = document.createElement("div");

  modal.id = "firefitNaamModal";

  modal.innerHTML = `

    <div class="ff-naam-backdrop"></div>

    <div
      class="ff-naam-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="firefitNaamTitel"
    >

      <div class="ff-naam-glow"></div>

      <div class="ff-naam-icon">
        <i class="fa-solid fa-user-helmet-safety"></i>
      </div>

      <div class="ff-naam-content">

        <div class="ff-naam-eyebrow">
          <i class="fa-solid fa-fire-flame-curved"></i>
          FIREFIT
        </div>

        <h2
          class="ff-naam-title"
          id="firefitNaamTitel"
        >
          Welkom bij FireFit
        </h2>

        <p class="ff-naam-text">
          Hoe mogen we je noemen?
        </p>

        <p class="ff-naam-subtext">
          Vul je naam in zodat je reservaties
          duidelijk herkenbaar zijn.
        </p>

        <div class="ff-naam-input">

          <i class="fa-solid fa-user"></i>

          <input
            type="text"
            id="firefitNaamInput"
            placeholder="Jouw naam"
            maxlength="40"
            autocomplete="name"
            spellcheck="false"
          >

        </div>

        <div class="ff-naam-actions">

          <button
            type="button"
            class="ff-naam-button"
            id="firefitNaamOpslaan"
          >
            <i class="fa-solid fa-check"></i>
            <span>Doorgaan</span>
          </button>

        </div>

      </div>

      <div class="ff-naam-footer">

        <i class="fa-solid fa-dumbbell"></i>

        <span>
          Sport • Team • FireFit
        </span>

      </div>

    </div>
  `;

  document.body.appendChild(modal);
}


// Maak popup
maakNaamPopup();


// ══════════════════════════════════════════════════════════════════════════════
// NAAM BEHEREN
// ══════════════════════════════════════════════════════════════════════════════

let naam = (localStorage.getItem("naam") || "").trim();

const userNaamElement =
  document.getElementById("userNaam");

const btnWijzigNaam =
  document.getElementById("btnWijzigNaam");

const naamModal =
  document.getElementById("firefitNaamModal");

const naamInput =
  document.getElementById("firefitNaamInput");

const btnNaamOpslaan =
  document.getElementById("firefitNaamOpslaan");


// ─────────────────────────────────────────────────────────────────────────────
// Naam opslaan
// ─────────────────────────────────────────────────────────────────────────────

function slaNaamOp(nieuweNaam) {

  nieuweNaam = nieuweNaam.trim();

  if (!nieuweNaam) {
    return false;
  }

  naam = nieuweNaam;

  localStorage.setItem(
    "naam",
    naam
  );

  if (userNaamElement) {
    userNaamElement.textContent = naam;
  }

  return true;
}


// ─────────────────────────────────────────────────────────────────────────────
// Popup openen
// ─────────────────────────────────────────────────────────────────────────────

function openNaamPopup(wijzigen = false) {

  const titel =
    document.getElementById(
      "firefitNaamTitel"
    );

  const tekst =
    naamModal.querySelector(
      ".ff-naam-text"
    );

  const subtekst =
    naamModal.querySelector(
      ".ff-naam-subtext"
    );

  const buttonTekst =
    naamModal.querySelector(
      ".ff-naam-button span"
    );


  if (wijzigen) {

    titel.textContent =
      "Naam wijzigen";

    tekst.textContent =
      "Hoe mogen we je voortaan noemen?";

    subtekst.textContent =
      "Je nieuwe naam wordt gebruikt bij je reservaties.";

    buttonTekst.textContent =
      "Naam opslaan";

    naamInput.value = naam;

  } else {

    titel.textContent =
      "Welkom bij FireFit";

    tekst.textContent =
      "Hoe mogen we je noemen?";

    subtekst.textContent =
      "Vul je naam in zodat je reservaties duidelijk herkenbaar zijn.";

    buttonTekst.textContent =
      "Doorgaan";

    naamInput.value = "";

  }


  naamModal.classList.add("actief");

  document.body.style.overflow = "hidden";


  // Focus op input
  setTimeout(() => {

    naamInput.focus();

    if (wijzigen && naamInput.value) {
      naamInput.select();
    }

  }, 120);

}


// ─────────────────────────────────────────────────────────────────────────────
// Popup sluiten
// ─────────────────────────────────────────────────────────────────────────────

function sluitNaamPopup() {

  // Wanneer er nog geen naam is,
  // mag de popup niet gesloten worden.
  if (!naam) {
    return;
  }

  naamModal.classList.remove("actief");

  document.body.style.overflow = "";

}


// ─────────────────────────────────────────────────────────────────────────────
// Fout tonen
// ─────────────────────────────────────────────────────────────────────────────

function toonNaamFout() {

  const inputWrapper =
    naamInput.closest(".ff-naam-input");

  inputWrapper.classList.remove("ff-error");

  // Forceer herstart animatie
  void inputWrapper.offsetWidth;

  inputWrapper.classList.add("ff-error");

  naamInput.focus();

}


// ─────────────────────────────────────────────────────────────────────────────
// Naam bevestigen
// ─────────────────────────────────────────────────────────────────────────────

function bevestigNaam() {

  const nieuweNaam =
    naamInput.value.trim();


  if (!nieuweNaam) {

    toonNaamFout();

    return;

  }


  const oudeNaam = naam;


  slaNaamOp(nieuweNaam);


  sluitNaamPopup();


  if (
    oudeNaam &&
    oudeNaam !== naam
  ) {

    toonToast(
      "Naam gewijzigd naar " + naam,
      "info"
    );

  }

}


// ─────────────────────────────────────────────────────────────────────────────
// Opslaan-knop
// ─────────────────────────────────────────────────────────────────────────────

btnNaamOpslaan.addEventListener(
  "click",
  bevestigNaam
);


// ─────────────────────────────────────────────────────────────────────────────
// Enter / Escape
// ─────────────────────────────────────────────────────────────────────────────

naamInput.addEventListener(
  "keydown",
  (event) => {

    if (event.key === "Enter") {

      event.preventDefault();

      bevestigNaam();

    }


    if (event.key === "Escape") {

      if (naam) {
        sluitNaamPopup();
      }

    }

  }
);


// ─────────────────────────────────────────────────────────────────────────────
// Klik op achtergrond
// ─────────────────────────────────────────────────────────────────────────────

naamModal
  .querySelector(".ff-naam-backdrop")
  .addEventListener(
    "click",
    () => {

      // Bij bestaande naam mag popup gesloten worden
      if (naam) {
        sluitNaamPopup();
      }

    }
  );


// ─────────────────────────────────────────────────────────────────────────────
// Naam wijzigen
// ─────────────────────────────────────────────────────────────────────────────

btnWijzigNaam.addEventListener(
  "click",
  () => {

    openNaamPopup(true);

  }
);


// ─────────────────────────────────────────────────────────────────────────────
// Eerste keer
// ─────────────────────────────────────────────────────────────────────────────

if (!naam) {

  setTimeout(() => {

    openNaamPopup(false);

  }, 250);

} else {

  userNaamElement.textContent = naam;

}


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

  const snap =
    await getDocs(
      collection(
        db,
        "reservaties"
      )
    );


  snap.forEach((item) => {

    const r = item.data();

    alleReservaties.push({

      id: item.id,

      naam: r.naam,

      datum: r.datum,

      uur: r.uur,

    });

  });

}


// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function reservatiesInSlot(
  datum,
  uur
) {

  return alleReservaties.filter(
    (r) =>
      r.datum === datum &&
      r.uur === uur
  );

}


function eigenReservatieInSlot(
  datum,
  uur
) {

  return alleReservaties.find(
    (r) =>
      r.datum === datum &&
      r.uur === uur &&
      r.naam === naam
  );

}


function isVerleden(datumStr) {

  const vandaag = new Date();

  vandaag.setHours(
    0,
    0,
    0,
    0
  );


  return new Date(
    datumStr + "T00:00:00"
  ) < vandaag;

}


function formatDatum(datumStr) {

  return new Date(
    datumStr + "T12:00:00"
  ).toLocaleDateString(
    "nl-BE",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    }
  );

}


// ══════════════════════════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════════════════════════

let toastTimer = null;


function toonToast(
  bericht,
  type = "success"
) {

  const t =
    document.getElementById("toast");


  t.textContent = bericht;


  t.className =
    `toast toast-${type} zichtbaar`;


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () =>
        t.classList.remove(
          "zichtbaar"
        ),
      3200
    );

}


// ══════════════════════════════════════════════════════════════════════════════
// KALENDER
// ══════════════════════════════════════════════════════════════════════════════

function bouwCalendarEvents() {

  const groepen = {};


  alleReservaties.forEach((r) => {

    if (!groepen[r.datum]) {
      groepen[r.datum] = {};
    }


    if (!groepen[r.datum][r.uur]) {
      groepen[r.datum][r.uur] = [];
    }


    groepen[r.datum][r.uur].push(r);

  });


  const events = [];


  Object.entries(
    groepen
  ).forEach(
    ([datum, uren]) => {

      Object.entries(
        uren
      ).forEach(
        ([uur, lijst]) => {

          const isEigen =
            lijst.some(
              (r) =>
                r.naam === naam
            );


          events.push({

            id:
              `ev_${datum}_${uur}`,

            title:
              `${uur.slice(0, 5)} · ${lijst.length}/${MAX_PER_SLOT}`,

            start:
              `${datum}T${uur}`,

            backgroundColor:
              isEigen
                ? "#c1121f"
                : "#2d2d42",

            borderColor:
              isEigen
                ? "#e01020"
                : "#42425a",

            textColor:
              isEigen
                ? "#fff"
                : "#9ca3af",

            extendedProps: {
              datum,
              uur,
              count: lijst.length,
              isEigen,
            },

          });

        }
      );

    }
  );


  return events;

}


function updateCalendarEvents() {

  if (!calendar) {
    return;
  }


  calendar
    .getEvents()
    .forEach(
      (e) =>
        e.remove()
    );


  bouwCalendarEvents()
    .forEach(
      (e) =>
        calendar.addEvent(e)
    );

}


async function initialiseerCalendar() {

  await laadReservaties();


  calendar =
    new FullCalendar.Calendar(
      document.getElementById("calendar"),
      {

        initialView:
          "dayGridMonth",

        locale:
          "nl",

        selectable:
          true,

        height:
          "auto",


        headerToolbar: {

          left:
            "prev",

          center:
            "title",

          right:
            "next today",

        },


        buttonText: {

          today:
            "Vandaag",

        },


        dateClick(info) {

          openModal(
            info.dateStr
          );

        },


        eventClick(info) {

          const datum =
            info.event.extendedProps.datum ||
            info.event.startStr.split("T")[0];


          openModal(datum);

        },


        events:
          bouwCalendarEvents(),


        dayCellDidMount(info) {

          const ds =
            info.date
              .toISOString()
              .split("T")[0];


          const dagRes =
            alleReservaties.filter(
              (r) =>
                r.datum === ds
            );


          if (
            dagRes.some(
              (r) =>
                r.naam === naam
            )
          ) {

            info.el.classList.add(
              "dag-eigen-indicator"
            );

          }

        },

      }
    );


  calendar.render();

}


// ══════════════════════════════════════════════════════════════════════════════
// RESERVATIE MODAL
// ══════════════════════════════════════════════════════════════════════════════

function openModal(datum) {

  if (isVerleden(datum)) {

    toonToast(
      "Reserveren in het verleden is niet mogelijk.",
      "fout"
    );

    return;

  }


  actieveDatum = datum;


  document
    .getElementById(
      "modalDatumLabel"
    )
    .textContent =
      formatDatum(datum);


  document
    .getElementById("modal")
    .classList.add("zichtbaar");


  renderSlots(datum);

}


function sluitModal() {

  document
    .getElementById("modal")
    .classList.remove("zichtbaar");


  actieveDatum = null;

}


// Sluit-knoppen

document
  .getElementById("btnSluit")
  .addEventListener(
    "click",
    sluitModal
  );


document
  .getElementById("btnSluiten")
  .addEventListener(
    "click",
    sluitModal
  );


document
  .getElementById("modalBackdrop")
  .addEventListener(
    "click",
    sluitModal
  );


document.addEventListener(
  "keydown",
  (e) => {

    // Naam-popup heeft voorrang
    if (
      e.key === "Escape" &&
      naamModal.classList.contains("actief")
    ) {

      if (naam) {
        sluitNaamPopup();
      }

      return;

    }


    if (e.key === "Escape") {
      sluitModal();
    }

  }
);


// Expose voor eventuele inline gebruik

window.sluitPopup =
  sluitModal;


// ══════════════════════════════════════════════════════════════════════════════
// SLOTS RENDEREN
// ══════════════════════════════════════════════════════════════════════════════

function renderSlots(datum) {

  const grid =
    document.getElementById(
      "slotsGrid"
    );


  grid.innerHTML = "";


  TIJDSLOTS.forEach(
    (slot) => {

      const bezet =
        reservatiesInSlot(
          datum,
          slot.uur
        );


      const eigenRes =
        eigenReservatieInSlot(
          datum,
          slot.uur
        );


      const aantalBezet =
        bezet.length;


      const vol =
        aantalBezet >= MAX_PER_SLOT &&
        !eigenRes;


      const isEigen =
        !!eigenRes;


      // ────────────────────────────────────────────────────────────────────
      // CARD
      // ────────────────────────────────────────────────────────────────────

      const card =
        document.createElement(
          "div"
        );


      card.className = [
        "slot-card",

        vol
          ? "slot-vol"
          : "",

        isEigen
          ? "slot-eigen"
          : "",

      ]
        .filter(Boolean)
        .join(" ");


      // ────────────────────────────────────────────────────────────────────
      // VLAMMEN
      // ────────────────────────────────────────────────────────────────────

      const vlammenHTML =
        Array.from(
          {
            length:
              MAX_PER_SLOT
          },
          (_, i) =>
            `<i class="fa-solid fa-fire slot-vlam ${
              i < aantalBezet
                ? "vlam-aan"
                : "vlam-uit"
            }"></i>`
        ).join("");


      // ────────────────────────────────────────────────────────────────────
      // BADGE
      // ────────────────────────────────────────────────────────────────────

      let badgeHTML;


      if (isEigen) {

        badgeHTML =
          `<span class="slot-badge badge-eigen">
            <i class="fa-solid fa-check"></i>
            Jouw reservatie
          </span>`;

      }

      else if (vol) {

        badgeHTML =
          `<span class="slot-badge badge-vol">
            <i class="fa-solid fa-lock"></i>
            Vol
          </span>`;

      }

      else {

        const vrij =
          MAX_PER_SLOT -
          aantalBezet;


        badgeHTML =
          `<span class="slot-badge badge-vrij">
            ${vrij}
            plek${vrij === 1 ? "" : "ken"} vrij
          </span>`;

      }


      // ────────────────────────────────────────────────────────────────────
      // DEELNEMERS
      // ────────────────────────────────────────────────────────────────────

      let deelnemersHTML =
        "";


      if (bezet.length > 0) {

        const chips =
          bezet
            .map(
              (r) => {

                const isZelf =
                  r.naam === naam;


                return `
                  <span class="deelnemer-chip${
                    isZelf
                      ? " chip-eigen"
                      : ""
                  }">

                    <i class="fa-solid fa-user-helmet-safety"></i>

                    ${r.naam}

                  </span>
                `;

              }
            )
            .join("");


        deelnemersHTML =
          `<div class="slot-deelnemers">
            ${chips}
          </div>`;

      }


      // ────────────────────────────────────────────────────────────────────
      // ACTIEKNOP
      // ────────────────────────────────────────────────────────────────────

      let actieHTML;


      if (isEigen) {

        actieHTML =
          `<button
            class="btn-annuleer js-annuleer"
            data-id="${eigenRes.id}"
          >
            <i class="fa-solid fa-xmark"></i>
            Annuleer
          </button>`;

      }

      else if (vol) {

        actieHTML =
          `<button
            class="btn-reserveer"
            disabled
          >
            <i class="fa-solid fa-ban"></i>
            Vol
          </button>`;

      }

      else {

        actieHTML =
          `<button
            class="btn-reserveer js-reserveer"
            data-datum="${datum}"
            data-uur="${slot.uur}"
          >
            <i class="fa-solid fa-fire"></i>
            Reserveer
          </button>`;

      }


      // ────────────────────────────────────────────────────────────────────
      // CARD HTML
      // ────────────────────────────────────────────────────────────────────

      card.innerHTML = `

        <div class="slot-info">

          <div class="slot-tijd">
            ${slot.label}
          </div>

          <div class="slot-status">
            ${badgeHTML}
          </div>

          ${deelnemersHTML}

        </div>


        <div class="slot-vlammen">
          ${vlammenHTML}
        </div>


        <div class="slot-actie">
          ${actieHTML}
        </div>

      `;


      // ────────────────────────────────────────────────────────────────────
      // RESERVEREN
      // ────────────────────────────────────────────────────────────────────

      const btnRes =
        card.querySelector(
          ".js-reserveer"
        );


      if (btnRes) {

        btnRes.addEventListener(
          "click",
          () =>
            voerReservatieUit(
              datum,
              slot.uur,
              btnRes
            )
        );

      }


      // ────────────────────────────────────────────────────────────────────
      // ANNULEREN
      // ────────────────────────────────────────────────────────────────────

      const btnAnn =
        card.querySelector(
          ".js-annuleer"
        );


      if (btnAnn) {

        btnAnn.addEventListener(
          "click",
          () =>
            voerAnnuleringUit(
              eigenRes.id,
              datum
            )
        );

      }


      grid.appendChild(card);

    }
  );

}


// ══════════════════════════════════════════════════════════════════════════════
// RESERVEREN
// ══════════════════════════════════════════════════════════════════════════════

async function voerReservatieUit(
  datum,
  uur,
  knop
) {

  // Hercheck slot-bezetting
  await laadReservaties();


  const bezet =
    reservatiesInSlot(
      datum,
      uur
    );


  if (
    bezet.length >=
    MAX_PER_SLOT
  ) {

    toonToast(
      "Dit tijdslot is ondertussen vol geworden.",
      "fout"
    );


    renderSlots(datum);

    return;

  }


  if (
    eigenReservatieInSlot(
      datum,
      uur
    )
  ) {

    toonToast(
      "Je hebt dit tijdslot al gereserveerd.",
      "info"
    );


    renderSlots(datum);

    return;

  }


  knop.disabled = true;


  knop.innerHTML =
    `<i class="fa-solid fa-spinner fa-spin"></i>
     Even geduld…`;


  try {

    await addDoc(
      collection(
        db,
        "reservaties"
      ),
      {
        naam,
        datum,
        uur,
      }
    );


    await laadReservaties();


    renderSlots(datum);

    updateCalendarEvents();


    toonToast(
      "Reservatie geplaatst! 🔥"
    );

  }

  catch (err) {

    console.error(
      "Reservatie mislukt:",
      err
    );


    toonToast(
      "Reservatie mislukt. Probeer opnieuw.",
      "fout"
    );


    knop.disabled = false;


    knop.innerHTML =
      `<i class="fa-solid fa-fire"></i>
       Reserveer`;

  }

}


// ══════════════════════════════════════════════════════════════════════════════
// ANNULEREN
// ══════════════════════════════════════════════════════════════════════════════

async function voerAnnuleringUit(
  reservatieId,
  datum
) {

  if (
    !confirm(
      "Wil je jouw reservatie annuleren?"
    )
  ) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        db,
        "reservaties",
        reservatieId
      )
    );


    await laadReservaties();


    renderSlots(datum);

    updateCalendarEvents();


    toonToast(
      "Reservatie geannuleerd."
    );

  }

  catch (err) {

    console.error(
      "Annulering mislukt:",
      err
    );


    toonToast(
      "Annulering mislukt. Probeer opnieuw.",
      "fout"
    );

  }

}


// ══════════════════════════════════════════════════════════════════════════════
// OPSTARTEN
// ══════════════════════════════════════════════════════════════════════════════

initialiseerCalendar();
