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

// AGREGA TODAS LAS FOTOS QUE QUIERAS AQUÍ. SIN LÍMITE.
const galleryImages = [
  { src: "https://res.cloudinary.com/dsh0z1w5j/image/upload/v1780285157/file_0000000042ac720e8c00cef23016eed1_1_h0zpoj.png", alt: "Imagen 1" },
  { src: "https://res.cloudinary.com/dsh0z1w5j/image/upload/v1779143770/IMG_20260518_172557_ktrojo.png", alt: "Imagen 2" },
  { src: "https://res.cloudinary.com/dsh0z1w5j/image/upload/v1779143770/IMG_20260518_172331_qc7oyn.png", alt: "Imagen 3" },
  { src: "https://res.cloudinary.com/dsh0z1w5j/image/upload/v1779144794/IMG_20260518_172846_s9chpm.png", alt: "Imagen 4" },
  { src: "https://res.cloudinary.com/dsh0z1w5j/image/upload/v1779143770/IMG_20260518_165727_h9ku0l.png", alt: "Imagen 5" }
  // Para agregar más, solo copia una línea y pega la URL nueva abajo
];

function renderGallery() {
  const mainImg = document.getElementById('mainImg');
  const thumbsContainer = document.getElementById('galleryThumbs');
  
  if (!mainImg || !thumbsContainer) return;
  
  // Imagen principal inicial (la primera del array)
  mainImg.src = galleryImages[0].src;
  mainImg.alt = galleryImages[0].alt;
  
  // Generar miniaturas automáticamente
  thumbsContainer.innerHTML = galleryImages.map((img, index) => `
    <button class="thumb ${index === 0 ? 'active' : ''}" onclick="selectImg(${index})">
      <img src="${img.src}" alt="${img.alt}" />
    </button>
  `).join('');
}

function selectImg(index) {
  const mainImg = document.getElementById('mainImg');
  const thumbs = document.querySelectorAll('.gallery-thumbs .thumb');
  
  if (!mainImg || !galleryImages[index]) return;
  
  mainImg.src = galleryImages[index].src;
  mainImg.alt = galleryImages[index].alt;
  
  thumbs.forEach(t => t.classList.remove('active'));
  if (thumbs[index]) thumbs[index].classList.add('active');
}

// Inicializar galería al cargar la página
document.addEventListener('DOMContentLoaded', renderGallery);
