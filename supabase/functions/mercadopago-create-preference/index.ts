import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://deno.land/x/cors@v1.2.1/mod.ts";

const _corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: _corsHeaders });
  }

  try {
    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ..._corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ..._corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { course_id, amount, title } = await req.json();

    if (!course_id || !amount || !title) {
      return new Response(JSON.stringify({ error: "Missing required fields: course_id, amount, title" }), {
        status: 400,
        headers: { ..._corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        course_id,
        amount,
        status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    // Create MercadoPago preference
    const preferenceRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [
          {
            title,
            quantity: 1,
            unit_price: Number(amount),
            currency_id: "ARS",
          },
        ],
        external_reference: order.id,
        back_urls: {
          success: `${req.headers.get("origin")}/cursos?payment=success&order=${order.id}`,
          failure: `${req.headers.get("origin")}/cursos?payment=failure&order=${order.id}`,
          pending: `${req.headers.get("origin")}/cursos?payment=pending&order=${order.id}`,
        },
        auto_return: "approved",
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      }),
    });

    const preference = await preferenceRes.json();

    if (!preferenceRes.ok) {
      throw new Error(`MercadoPago error: ${JSON.stringify(preference)}`);
    }

    // Update order with preference id
    await supabase
      .from("orders")
      .update({ mercadopago_preference_id: preference.id })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({
        init_point: preference.init_point,
        order_id: order.id,
        preference_id: preference.id,
      }),
      { headers: { ..._corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating preference:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ..._corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
