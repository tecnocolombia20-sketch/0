/* ═══════════════════════════════════════════════════════════════
   META PIXEL + CONVERSIONS API (CAPI) — TV Stick Colombia
   Configurado para: VENTAS → Sitio web → InitiateCheckout
   
   Eventos:
     PageView         → Solo navegador (estándar de Meta)
     ViewContent      → Pixel + CAPI (sin value, solo informativo)
     InitiateCheckout → Pixel + CAPI (1 vez por sesión, con value)
   ═══════════════════════════════════════════════════════════════ */

var PIXEL_ID = '1541165377405964';
var WA_NUMBER = '573125057113';
var WA_BASE_MSG = 'Hola quiero comprar el TV Stick';

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

/* ── Construir link de WhatsApp ── */
function buildWhatsAppURL() {
  return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(WA_BASE_MSG);
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

/* ── GALLERY — selección manual ── */
var galleryImages = [
  'https://res.cloudinary.com/dsh0z1w5j/image/upload/v1780258888/file_0000000042ac720e8c00cef23016eed1_i2vzrr.png',
  'https://res.cloudinary.com/dsh0z1w5j/image/upload/v1779143770/IMG_20260518_172557_ktrojo.png',
  'https://res.cloudinary.com/dsh0z1w5j/image/upload/v1779842807/photo_2026-03-10_14-39-55_osyonj.jpg',
  'https://res.cloudinary.com/dsh0z1w5j/image/upload/v1779143770/IMG_20260518_172331_qc7oyn.png',
  'https://res.cloudinary.com/dsh0z1w5j/image/upload/v1779144794/IMG_20260518_172846_s9chpm.png'
  'https://res.cloudinary.com/dsh0z1w5j/image/upload/v1779143770/IMG_20260518_165727_h9ku0l.png'
];

function selectImg(index) {
  var mainImg = document.getElementById('mainImg');
  mainImg.src = galleryImages[index];

  var thumbs = document.querySelectorAll('.thumb');
  for (var i = 0; i < thumbs.length; i++) {
    thumbs[i].classList.remove('active');
  }
  thumbs[index].classList.add('active');
}
