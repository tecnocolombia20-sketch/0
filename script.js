/* ═══════════════════════════════════════════════════════════════
   META PIXEL + CONVERSIONS API (CAPI) — TV Stick Colombia
   Configurado para: VENTAS → Sitio web → InitiateCheckout
   
   Eventos:
     PageView         → Solo navegador (estándar de Meta)
     ViewContent      → Pixel + CAPI (sin value, solo informativo)
     InitiateCheckout → Pixel + CAPI (click en WhatsApp)
   ═══════════════════════════════════════════════════════════════ */

var PIXEL_ID = '1541165377405964';
var WA_NUMBER = '573125057113';
var WA_BASE_MSG = 'Hola me interesa el TV Stick 📺';

/* ── Leer cookie por nombre ── */
function getCookie(name) {
  var m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return m ? m[2] : '';
}

/* ── Generar ID único para deduplicación Pixel ↔ CAPI ── */
function genEventID(name) {
  return name + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
}

/* ── Enviar evento al servidor (CAPI) ── */
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
    }).catch(function () {});
  } catch (e) {}
}

/* ── Disparar evento estándar (Pixel + CAPI en paralelo) ── */
function trackEvent(eventName, eventParams, customData) {
  var eventID = genEventID(eventName);

  if (typeof fbq !== 'undefined') {
    fbq('trackSingle', PIXEL_ID, eventName, eventParams || {}, { eventID: eventID });
  }

    sendCAPI(eventName, eventID, customData || eventParams);
}

/* ── Construir link de WhatsApp con UTM tracking ── */
function buildWhatsAppURL() {
  var params = new URLSearchParams(window.location.search);
  var source = params.get('utm_source') || (params.get('fbclid') ? 'facebook' : 'directo');
  var campaign = params.get('utm_campaign') || 'sin-campana';
  var ad = params.get('utm_content') || params.get('utm_ad') || 'sin-anuncio';


  var msg = WA_BASE_MSG;
  msg += ' | Fuente: ' + source;
  msg += ' | Campaña: ' + campaign;
  msg += ' | Anuncio: ' + ad;


  return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
}

/* ── Inicializar todos los links de WhatsApp ── */
(function () {
  var waURL = buildWhatsAppURL();
  var links = document.querySelectorAll('a[href*="wa.me"]');
  for (var i = 0; i < links.length; i++) {
    links[i].href = waURL;
  }
})();

/* ── ViewContent — 1 vez al cargar, Pixel + CAPI, SIN value ── */
trackEvent('ViewContent', {
  content_ids:      ['tvstick-co-001'],
  content_type:     'product',
  content_name:     'TV Stick Colombia',
  content_category: 'Electrónica / Smart TV',
  currency:         'COP',
});

/* ── Botón WhatsApp — INITIATE CHECKOUT (1 vez por sesión) ── */
var _checkoutFired = false;

function trackWA() {
  if (_checkoutFired) return;
  _checkoutFired = true;

  trackEvent('InitiateCheckout', {
    content_ids:  ['tvstick-co-001'],
    content_type: 'product',
    content_name: 'TV Stick Colombia',
    value:        98000,
    currency:     'COP',
    num_items:    1,
  });
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

/* ── COUNTDOWN TIMER (consistente por cookie) ── */
(function () {
  var COOKIE_NAME = 'tvstick_countdown_end';
  var HOURS = 2;
  var el = document.getElementById('countdown');

  var endTime = getCookie(COOKIE_NAME);
  if (!endTime) {
    endTime = Date.now() + HOURS * 60 * 60 * 1000;
    document.cookie = COOKIE_NAME + '=' + endTime + ';path=/;max-age=' + (HOURS * 3600 + 300);
  }
  endTime = parseInt(endTime, 10);

  function fmt(n) { return String(n).padStart(2, '0'); }
  function tick() {
    var diff = Math.max(0, endTime - Date.now());
    var h = Math.floor(diff / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    el.textContent = fmt(h) + ':' + fmt(m) + ':' + fmt(s);
  }
  tick();
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
