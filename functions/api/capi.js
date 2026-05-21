// ─────────────────────────────────────────────────────────────────
//  Meta Conversions API (CAPI) — Cloudflare Pages Function
//  Ruta automática: POST /api/capi
//
//  Variables de entorno en Cloudflare Pages → Settings → Env variables:
//
//  REQUERIDA:
//    CAPI_ACCESS_TOKEN  →  token de acceso de Conversions API
//    (Meta Events Manager → tu Pixel → Configuración → Generar token)
//
//  PARA PRUEBAS (desactívala cuando lances campañas reales):
//    CAPI_TEST_CODE     →  código de evento de prueba
//    (Meta Events Manager → tu Pixel → Actividad de prueba → Código de prueba)
//    Ejemplo: TEST12345
//    Con este código activo puedes ver los eventos en tiempo real
//    en la pestaña "Actividad de prueba" de Meta Events Manager.
// ─────────────────────────────────────────────────────────────────

const PIXEL_ID  = '1603617100707157';
const GRAPH_URL = 'https://graph.facebook.com/v19.0/' + PIXEL_ID + '/events';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json' }, CORS),
  });
}

// Preflight CORS
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

// Recibe el evento desde el navegador y lo reenvía a Meta CAPI
export async function onRequestPost(context) {
  var request = context.request;
  var env     = context.env;

  var ACCESS_TOKEN = env.CAPI_ACCESS_TOKEN;
  var TEST_CODE    = env.CAPI_TEST_CODE || '';
  var IS_TEST      = !!TEST_CODE;

  if (!ACCESS_TOKEN) {
    console.error('[CAPI] ❌ CAPI_ACCESS_TOKEN no configurado en Cloudflare Pages');
    return json({ error: 'CAPI_ACCESS_TOKEN no configurado' }, 500);
  }

  var body;
  try { body = await request.json(); }
  catch (e) { return json({ error: 'JSON inválido' }, 400); }

  var event_name       = body.event_name;
  var event_id         = body.event_id;
  var event_source_url = body.event_source_url || '';
  var fbp              = body.fbp  || '';
  var fbc              = body.fbc  || '';
  var custom_data      = body.custom_data || null;

  if (!event_name) return json({ error: 'event_name es requerido' }, 400);

  // CF-Connecting-IP es la IP real del visitante (exclusivo de Cloudflare)
  var ip        = request.headers.get('CF-Connecting-IP')
               || request.headers.get('X-Forwarded-For') || '';
  var userAgent = request.headers.get('User-Agent') || '';

  var userData = {
    client_ip_address: ip,
    client_user_agent: userAgent,
  };
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  var event = {
    event_name:       event_name,
    event_time:       Math.floor(Date.now() / 1000),
    event_id:         event_id || (event_name + '_' + Date.now()),
    event_source_url: event_source_url,
    action_source:    'website',
    user_data:        userData,
  };
  if (custom_data) event.custom_data = custom_data;

  var payload = { data: [event] };

  // Modo de prueba activo — los eventos aparecen en "Actividad de prueba" de Meta
  if (IS_TEST) {
    payload.test_event_code = TEST_CODE;
    console.log('[CAPI] 🧪 MODO PRUEBA activo (' + TEST_CODE + ') — evento: ' + event_name + ' | id: ' + event.event_id);
  } else {
    console.log('[CAPI] 🚀 PRODUCCIÓN — evento: ' + event_name + ' | id: ' + event.event_id);
  }

  try {
    var response = await fetch(GRAPH_URL + '?access_token=' + ACCESS_TOKEN, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    var result = await response.json();

    if (!response.ok) {
      console.error('[CAPI] ❌ Error Meta API:', JSON.stringify(result));
      return json({ error: 'Meta API error', detail: result }, 502);
    }

    console.log('[CAPI] ✅ Enviado correctamente — events_received:', result.events_received || 0);
    return json({
      ok:              true,
      test_mode:       IS_TEST,
      test_code:       IS_TEST ? TEST_CODE : null,
      event_name:      event_name,
      events_received: result.events_received || 0,
    });

  } catch (err) {
    console.error('[CAPI] ❌ Error de red:', err.message);
    return json({ error: err.message }, 500);
  }
}
