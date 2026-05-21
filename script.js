/* ═══════════════════════════════════════════════════════════════
   META PIXEL + CONVERSIONS API (CAPI) — TV Stick Colombia
   Configurado para: VENTAS → Sitio web → Purchase
   
   Cada evento se envía dos veces:
     1. Browser Pixel  → fbq(...)       (lado del cliente)
     2. Server CAPI    → /api/capi      (lado del servidor)
   El mismo eventID en ambos permite que Meta deduplique
   y cuente el evento una sola vez, con señal más fuerte.
   ═══════════════════════════════════════════════════════════════ */

var PIXEL_ID = '1541165377405964';

/* ── Leer cookie por nombre ── */
function getCookie(name) {
  var m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return m ? m[2] : '';
}

/* ── Enviar evento al servidor (CAPI) ──
   Falla silenciosamente — el Pixel del navegador es siempre el primario.
   Si hay bloqueadores de ads, solo el CAPI llega a Meta.          */
function sendCAPI(eventName, eventID, customData) {
  try {
    var payload = {
      event_name:       eventName,
      event_id:         eventID,
      event_source_url: window.location.href,
      fbp:              getCookie('_fbp'),
      fbc:              getCookie('_fbc'),
    };
    if (customData) payload.custom_data = customData;

    fetch('/api/capi', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    }).catch(function () {});   // silencioso si falla
  } catch (e) {}
}

/* ── Disparar un evento estándar (Pixel + CAPI en paralelo) ── */
function fireEvent(eventName, eventParams, customData) {
  var eventID = eventName + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

  // 1. Browser Pixel
  if (typeof fbq !== 'undefined') {
    fbq('trackSingle', PIXEL_ID, eventName, eventParams || {}, { eventID: eventID });
  }

  // 2. Server CAPI
  sendCAPI(eventName, eventID, customData);
}

/* ── Botón WhatsApp — PURCHASE (evento principal de Ventas) ──
   Al hacer clic en WhatsApp se dispara Purchase = conversión de venta.
   Esto permite usar el objetivo Ventas → Sitio web → Purchase en Meta Ads.
   También se envía AddToCart como evento secundario para retargeting. */
function trackWA() {
  var ts = Date.now();

  // Purchase — evento principal de conversión para campaña de Ventas
  var idP = 'Purchase_' + ts;
  var purchaseData = {
    content_ids:  ['tvstick-co-001'],
    content_type: 'product',
    content_name: 'TV Stick Colombia',
    value:        98000,
    currency:     'COP',
    num_items:    1,
  };
  if (typeof fbq !== 'undefined') {
    fbq('trackSingle', PIXEL_ID, 'Purchase', purchaseData, { eventID: idP });
  }
  sendCAPI('Purchase', idP, purchaseData);

  // AddToCart — evento secundario para retargeting
  var idATC = 'AddToCart_' + ts;
  var addToCartData = {
    content_ids:  ['tvstick-co-001'],
    content_type: 'product',
    content_name: 'TV Stick Colombia',
    value:        98000,
    currency:     'COP',
  };
  if (typeof fbq !== 'undefined') {
    fbq('trackSingle', PIXEL_ID, 'AddToCart', addToCartData, { eventID: idATC });
  }
  sendCAPI('AddToCart', idATC, addToCartData);
}

/* ── AÑO EN FOOTER ── */
document.getElementById('year').textContent = new Date().getFullYear();

/* ── NAV SCROLL ── */
window.addEventListener('scroll', function () {
  var nav = document.getElementById('navbar');
  if (window.scrollY > 80) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
}, { passive: true });

/* ── COUNTDOWN TIMER ── */
(function () {
  var h = 2, m = 47, s = 33;
  var el = document.getElementById('countdown');
  function fmt(n) { return String(n).padStart(2, '0'); }
  function tick() {
    s--;
    if (s < 0) { s = 59; m--; }
    if (m < 0) { m = 59; h--; }
    if (h < 0) { h = 0; m = 0; s = 0; }
    el.textContent = fmt(h) + ':' + fmt(m) + ':' + fmt(s);
  }
  setInterval(tick, 1000);
})();

/* ── IMAGE SLIDER ── */
(function () {
  var slides = document.querySelectorAll('.slide-img');
  var dots   = document.querySelectorAll('.dot');
  var current = 0;
  var touchStartX = null;

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  window.goToSlide = goTo;
  setInterval(function () { goTo(current + 1); }, 4000);

  var track = document.getElementById('sliderTrack');
  track.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  track.addEventListener('touchend', function (e) {
    if (touchStartX === null) return;
    var delta = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(delta) < 40) return;
    goTo(delta > 0 ? current + 1 : current - 1);
    touchStartX = null;
  });

  var mouseStartX = null;
  track.addEventListener('mousedown', function (e) { mouseStartX = e.clientX; });
  track.addEventListener('mouseup', function (e) {
    if (mouseStartX === null) return;
    var delta = mouseStartX - e.clientX;
    if (Math.abs(delta) > 40) goTo(delta > 0 ? current + 1 : current - 1);
    mouseStartX = null;
  });
})();

