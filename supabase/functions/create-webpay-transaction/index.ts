import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const TBK_ENDPOINTS = {
  integration: 'https://webpay3gint.transbank.cl',
  production: 'https://webpay3g.transbank.cl',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const commerceCode = Deno.env.get('TRANSBANK_COMMERCE_CODE');
    const apiKey = Deno.env.get('TRANSBANK_API_KEY');
    const environment = Deno.env.get('TRANSBANK_ENVIRONMENT');

    if (!commerceCode || !apiKey || !environment) {
      return json({
        error: 'Integración de pagos no configurada. Faltan las variables TRANSBANK_COMMERCE_CODE, TRANSBANK_API_KEY y/o TRANSBANK_ENVIRONMENT.',
      }, 503);
    }
    if (environment !== 'integration' && environment !== 'production') {
      return json({ error: 'TRANSBANK_ENVIRONMENT debe ser "integration" o "production".' }, 503);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'No autenticado.' }, 401);
    }
    const jwt = authHeader.slice(7);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: 'Sesión inválida.' }, 401);
    const user = userData.user;
    if (!user.email_confirmed_at) return json({ error: 'Debes verificar tu correo antes de comprar.' }, 403);

    const body = await req.json().catch(() => ({}));
    const courseId = body?.courseId;
    const returnUrl = body?.returnUrl;
    if (typeof courseId !== 'string' || courseId.length < 10) return json({ error: 'courseId inválido.' }, 400);
    if (typeof returnUrl !== 'string' || !returnUrl.startsWith('http')) return json({ error: 'returnUrl inválido.' }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: course, error: courseErr } = await admin
      .from('courses').select('id, title, price, currency, published').eq('id', courseId).maybeSingle();
    if (courseErr || !course) return json({ error: 'Curso no encontrado.' }, 404);
    if (!course.published) return json({ error: 'Este curso no está disponible.' }, 400);
    const amount = Math.round(Number(course.price));
    if (!amount || amount <= 0) return json({ error: 'Este curso no tiene un precio configurado.' }, 400);

    const { data: prev } = await admin
      .from('purchases').select('id').eq('user_id', user.id).eq('course_id', courseId).eq('payment_status', 'approved').maybeSingle();
    if (prev) return json({ error: 'Ya compraste este curso.' }, 409);

    const { data: enrolled } = await admin
      .from('enrollments').select('id').eq('user_id', user.id).eq('course_id', courseId).eq('status', 'active').maybeSingle();
    if (enrolled) return json({ error: 'Ya tienes acceso a este curso.' }, 409);

    const ts = Date.now().toString(36);
    const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    const buyOrder = `SRN-${ts}-${rand}`.slice(0, 26);
    const sessionId = `s-${user.id.slice(0, 8)}-${ts}`.slice(0, 61);

    const { data: purchase, error: insErr } = await admin.from('purchases').insert({
      user_id: user.id, course_id: courseId, amount, currency: course.currency || 'CLP',
      buy_order: buyOrder, session_id: sessionId, payment_status: 'pending',
    }).select().single();
    if (insErr || !purchase) {
      console.error('purchase insert failed', insErr);
      return json({ error: 'No se pudo iniciar la compra.' }, 500);
    }

    const baseUrl = TBK_ENDPOINTS[environment as 'integration' | 'production'];
    const tbkUrl = `${baseUrl}/rswebpaytransaction/api/webpay/v1.2/transactions`;
    const requestPayload = { buy_order: buyOrder, session_id: sessionId, amount, return_url: returnUrl };

    const tbkRes = await fetch(tbkUrl, {
      method: 'POST',
      headers: {
        'Tbk-Api-Key-Id': commerceCode,
        'Tbk-Api-Key-Secret': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });
    const tbkJson = await tbkRes.json().catch(() => ({}));

    await admin.from('payment_logs').insert({
      purchase_id: purchase.id,
      event: 'create_transaction',
      request_payload: requestPayload,
      response_payload: tbkJson,
      status_code: tbkRes.status,
      error_message: tbkRes.ok ? null : `Transbank respondió ${tbkRes.status}`,
    });

    if (!tbkRes.ok || !tbkJson?.token || !tbkJson?.url) {
      await admin.from('purchases').update({ payment_status: 'failed' }).eq('id', purchase.id);
      return json({ error: 'Transbank rechazó la creación de la transacción.', details: tbkJson }, 502);
    }

    await admin.from('purchases').update({ transaction_token: tbkJson.token }).eq('id', purchase.id);

    return json({ url: tbkJson.url, token: tbkJson.token, buy_order: buyOrder });
  } catch (e: any) {
    console.error('create-webpay-transaction error', e);
    return json({ error: e?.message ?? 'Error interno.' }, 500);
  }
});
