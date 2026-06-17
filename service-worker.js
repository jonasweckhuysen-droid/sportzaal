// ══════════════════════════════════════════════════════════════════════════════
// FireFit — Service Worker
//
// Strategie: Network First met Cache Fallback
//  → Altijd verse bestanden ophalen van het netwerk
//  → Cache enkel gebruiken als offline (fallback)
//  → Bij nieuwe deploy: automatisch activeren + oude caches opruimen
// ══════════════════════════════════════════════════════════════════════════════

const CACHE = "firefit-v2"; // ← Verhoog bij elke deploy (v3, v4, ...)

const APP_BESTANDEN = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
];

// ── Installatie ───────────────────────────────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_BESTANDEN))
  );
  // Niet wachten op sluiten van tabs — meteen activeren
  self.skipWaiting();
});

// ── Activatie ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    // Verwijder alle oude caches (andere versienamen)
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Neem meteen controle over alle open tabs — geen herlaad nodig
  self.clients.claim();
});

// ── Fetch: Network First ──────────────────────────────────────────────────────
self.addEventListener("fetch", (e) => {
  // Alleen GET-requests cachen (geen Firebase-calls e.d.)
  if (e.request.method !== "GET") return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Sla de verse versie meteen op in de cache
        const kopie = response.clone();
        caches.open(CACHE).then((cache) => cache.put(e.request, kopie));
        return response;
      })
      .catch(() => {
        // Geen netwerk → geef gecachte versie terug (offline fallback)
        return caches.match(e.request);
      })
  );
});
