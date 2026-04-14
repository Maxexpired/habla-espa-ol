import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    // MercadoPago sends different notification types
    if (body.type === "payment" || body.action === "payment.updated" || body.action === "payment.created") {
      const paymentId = body.data?.id;
      if (!paymentId) {
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch payment details from MercadoPago
      const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        },
      });

      const payment = await paymentRes.json();
      console.log("Payment details:", JSON.stringify(payment));

      if (!paymentRes.ok) {
        throw new Error(`Failed to fetch payment: ${JSON.stringify(payment)}`);
      }

      const orderId = payment.external_reference;
      if (!orderId) {
        console.log("No external_reference found in payment");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Map MercadoPago status to our status
      let orderStatus = "pending";
      if (payment.status === "approved") {
        orderStatus = "completed";
      } else if (payment.status === "rejected" || payment.status === "cancelled") {
        orderStatus = "failed";
      } else if (payment.status === "in_process" || payment.status === "pending") {
        orderStatus = "pending";
      }

      // Update order
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: orderStatus,
          mercadopago_payment_id: String(paymentId),
          mercadopago_status: payment.status,
        })
        .eq("id", orderId);

      if (updateError) {
        console.error("Error updating order:", updateError);
        throw new Error(`Failed to update order: ${updateError.message}`);
      }

      // If payment approved, enroll user in course
      if (orderStatus === "completed") {
        const { data: order } = await supabase
          .from("orders")
          .select("user_id, course_id")
          .eq("id", orderId)
          .single();

        if (order) {
          // Check if already enrolled
          const { data: existing } = await supabase
            .from("enrollments")
            .select("id")
            .eq("user_id", order.user_id)
            .eq("course_id", order.course_id)
            .maybeSingle();

          if (!existing) {
            await supabase.from("enrollments").insert({
              user_id: order.user_id,
              course_id: order.course_id,
              status: "active",
            });
          }
        }
      }

      console.log(`Order ${orderId} updated to ${orderStatus}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
