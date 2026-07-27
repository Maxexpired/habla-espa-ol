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
    // ⚠️ CREDENCIALES DE PRUEBA (SANDBOX WEBPAY PLUS)
    // Se usan SOLO si no hay variables de entorno configuradas.
    // Reemplazar en producción configurando en Supabase Edge Function Secrets:
    //   TRANSBANK_COMMERCE_CODE, TRANSBANK_API_KEY, TRANSBANK_ENVIRONMENT=production
    // La aplicación cambiará a producción automáticamente sin tocar el código.
    const TBK_INTEGRATION_COMMERCE_CODE = '597055555532';
    const TBK_INTEGRATION_API_KEY = '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C';

    const environment = Deno.env.get('TRANSBANK_ENVIRONMENT') ?? 'integration';
    const commerceCode = Deno.env.get('TRANSBANK_COMMERCE_CODE')
      ?? (environment === 'integration' ? TBK_INTEGRATION_COMMERCE_CODE : undefined);
    const apiKey = Deno.env.get('TRANSBANK_API_KEY')
      ?? (environment === 'integration' ? TBK_INTEGRATION_API_KEY : undefined);

    if (environment !== 'integration' && environment !== 'production') {
      return json({ error: 'TRANSBANK_ENVIRONMENT inválido.' }, 503);
    }
    if (!commerceCode || !apiKey) {
      return json({ error: 'Integración de pagos no configurada.' }, 503);
    }

    const body = await req.json().catch(() => ({}));
    const tokenWs = body?.token_ws;
    if (typeof tokenWs !== 'string' || tokenWs.length < 10) return json({ error: 'token_ws inválido.' }, 400);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: purchase, error: purErr } = await admin
      .from('purchases').select('*').eq('transaction_token', tokenWs).maybeSingle();
    if (purErr || !purchase) return json({ error: 'Compra no encontrada para este token.' }, 404);

    // Idempotencia: si ya está aprobada, devolver el resultado sin modificar nada
    if (purchase.payment_status === 'approved') {
      return json({
        status: 'approved', already_confirmed: true,
        course_id: purchase.course_id, buy_order: purchase.buy_order,
        amount: purchase.amount, authorization_code: purchase.authorization_code,
        transaction_date: purchase.transaction_date, approved_at: purchase.approved_at,
      });
    }
    if (['rejected', 'cancelled', 'failed'].includes(purchase.payment_status)) {
      return json({
        status: purchase.payment_status, already_confirmed: true,
        course_id: purchase.course_id, buy_order: purchase.buy_order,
      });
    }

    const baseUrl = TBK_ENDPOINTS[environment as 'integration' | 'production'];
    const tbkUrl = `${baseUrl}/rswebpaytransaction/api/webpay/v1.2/transactions/${tokenWs}`;

    const tbkRes = await fetch(tbkUrl, {
      method: 'PUT',
      headers: {
        'Tbk-Api-Key-Id': commerceCode,
        'Tbk-Api-Key-Secret': apiKey,
        'Content-Type': 'application/json',
      },
    });
    const tbkJson = await tbkRes.json().catch(() => ({}));

    await admin.from('payment_logs').insert({
      purchase_id: purchase.id,
      event: 'confirm_transaction',
      request_payload: { token_ws: tokenWs },
      response_payload: tbkJson,
      status_code: tbkRes.status,
      error_message: tbkRes.ok ? null : `Transbank respondió ${tbkRes.status}`,
    });

    if (!tbkRes.ok) {
      await admin.from('purchases').update({ payment_status: 'failed' }).eq('id', purchase.id);
      return json({ error: 'Transbank falló al confirmar la transacción.', details: tbkJson }, 502);
    }

    // Validación estricta contra la compra original
    const mismatches: string[] = [];
    if (tbkJson.buy_order !== purchase.buy_order) mismatches.push('buy_order');
    if (tbkJson.session_id !== purchase.session_id) mismatches.push('session_id');
    if (Number(tbkJson.amount) !== Number(purchase.amount)) mismatches.push('amount');

    const authorized = tbkJson.response_code === 0 && tbkJson.status === 'AUTHORIZED';

    if (mismatches.length > 0) {
      await admin.from('payment_logs').insert({
        purchase_id: purchase.id,
        event: 'validation_mismatch',
        request_payload: { expected: { buy_order: purchase.buy_order, session_id: purchase.session_id, amount: purchase.amount } },
        response_payload: tbkJson,
        error_message: `Mismatches: ${mismatches.join(', ')}`,
      });
      await admin.from('purchases').update({
        payment_status: 'rejected',
        response_code: tbkJson.response_code ?? null,
        transaction_date: tbkJson.transaction_date ?? null,
      }).eq('id', purchase.id);
      return json({ status: 'rejected', reason: 'validation_mismatch', mismatches }, 200);
    }

    const newStatus = authorized ? 'approved' : 'rejected';
    const update: Record<string, unknown> = {
      payment_status: newStatus,
      authorization_code: tbkJson.authorization_code ?? null,
      payment_type: tbkJson.payment_type_code ?? null,
      installments: tbkJson.installments_number ?? null,
      response_code: tbkJson.response_code ?? null,
      transaction_date: tbkJson.transaction_date ?? null,
    };
    if (authorized) update.approved_at = new Date().toISOString();

    const { error: updErr } = await admin.from('purchases').update(update).eq('id', purchase.id);
    if (updErr) {
      console.error('purchase update failed', updErr);
      return json({ error: 'No se pudo actualizar la compra.' }, 500);
    }

    if (authorized) {
      // Activar/crear inscripción de forma idempotente
      const { data: existing } = await admin
        .from('enrollments').select('id, status').eq('user_id', purchase.user_id).eq('course_id', purchase.course_id).maybeSingle();
      if (existing) {
        if (existing.status !== 'active') {
          await admin.from('enrollments').update({ status: 'active' }).eq('id', existing.id);
        }
      } else {
        await admin.from('enrollments').insert({
          user_id: purchase.user_id, course_id: purchase.course_id, status: 'active',
        });
      }
      await admin.from('payment_logs').insert({
        purchase_id: purchase.id, event: 'enrollment_activated',
        response_payload: { user_id: purchase.user_id, course_id: purchase.course_id },
      });
    }

    return json({
      status: newStatus,
      course_id: purchase.course_id,
      buy_order: purchase.buy_order,
      amount: purchase.amount,
      authorization_code: update.authorization_code,
      payment_type: update.payment_type,
      installments: update.installments,
      transaction_date: update.transaction_date,
      response_code: update.response_code,
    });
  } catch (e: any) {
    console.error('confirm-webpay-transaction error', e);
    return json({ error: e?.message ?? 'Error interno.' }, 500);
  }
});
