/* ═══════════════════════════════════════════════════════════════
   META PIXEL + CONVERSIONS API (CAPI) — TV Stick Colombia
   Configurado para: VENTAS → Sitio web → Purchase
   
   Eventos:
     PageView    → Solo navegador (estándar de Meta)
     ViewContent → Pixel + CAPI (sin value, solo informativo)
     Purchase    → Pixel + CAPI (1 vez por sesión, con value)
   ═══════════════════════════════════════════════════════════════ */

var PIXEL_ID = '1541165377405964';

/* ── Leer cookie por nombre ── */
function getCookie(name) {
  var m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return m ? m[2] : '';
}

/* ── Generar ID único para deduplicación Pixel ↔ CAPI ── */
function genEventID(name) {
  return name + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
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
    }).catch(function () {});
  } catch (e) {}
}

/* ── Disparar evento estándar (Pixel + CAPI en paralelo) ── */
function trackEvent(eventName, eventParams, customData) {
  var eventID = genEventID(eventName);

  // 1. Browser Pixel
  if (typeof fbq !== 'undefined') {
    fbq('trackSingle', PIXEL_ID, eventName, eventParams || {}, { eventID: eventID });
  }

  // 2. Server CAPI
  sendCAPI(eventName, eventID, customData);
}

/* ── ViewContent — se dispara 1 vez al cargar la página ──
   SIN value — solo Purchase tiene valor monetario.
   Se envía por Pixel + CAPI para señal más fuerte. */
trackEvent('ViewContent', {
  content_ids:      ['tvstick-co-001'],
  content_type:     'product',
  content_name:     'TV Stick Colombia',
  content_category: 'Electrónica / Smart TV',
  currency:         'COP',
});

/* ── Botón WhatsApp — PURCHASE (1 vez por sesión) ──
   Al hacer clic en WhatsApp se dispara Purchase = conversión de venta.
   Protección contra múltiples clics: solo 1 Purchase por sesión.
   Nueva sesión = nueva visita a la landing. */
var _purchaseFired = false;

function trackWA() {
  if (_purchaseFired) return;
  _purchaseFired = true;

  trackEvent('Purchase', {
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
