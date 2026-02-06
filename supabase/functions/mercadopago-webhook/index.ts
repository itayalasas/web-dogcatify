import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MercadoPagoNotification {
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: string;
  user_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    const notification: MercadoPagoNotification = await req.json();

    console.log("Received Mercado Pago notification:", notification);

    if (notification.type !== "payment") {
      console.log("Ignoring non-payment notification");
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: configData } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'mercadopago_config')
      .maybeSingle();

    if (!configData) {
      console.error("Mercado Pago config not found");
      return new Response(JSON.stringify({ error: "Config not found" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpConfig = configData.value;
    const accessToken = mpConfig.access_token;

    const paymentId = notification.data.id;
    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!paymentResponse.ok) {
      console.error("Failed to fetch payment details from Mercado Pago");
      return new Response(
        JSON.stringify({ error: "Failed to fetch payment" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const paymentData = await paymentResponse.json();
    console.log("Payment data:", paymentData);

    const bookingId = paymentData.external_reference;
    const paymentStatus = paymentData.status;
    const paymentStatusDetail = paymentData.status_detail;
    const paymentMethod = paymentData.payment_method_id;

    if (!bookingId) {
      console.error("No booking ID in payment external_reference");
      return new Response(
        JSON.stringify({ error: "No booking ID found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      console.error("Booking not found:", bookingId);
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let bookingStatus = booking.status;
    let bookingPaymentStatus = paymentStatus;

    if (paymentStatus === "approved") {
      bookingStatus = "confirmed";
      bookingPaymentStatus = "approved";

      await supabase
        .from("bookings")
        .update({
          status: bookingStatus,
          payment_status: bookingPaymentStatus,
          payment_method: paymentMethod,
          payment_confirmed_at: new Date().toISOString(),
          payment_id: paymentId,
          payment_data: paymentData,
        })
        .eq("id", bookingId);

      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (existingOrder) {
        await supabase
          .from("orders")
          .update({
            status: "confirmed",
            payment_status: "approved",
            payment_method: paymentMethod,
            payment_id: paymentId,
            payment_data: paymentData,
            payment_status_detail: paymentStatusDetail,
            updated_at: new Date().toISOString(),
          })
          .eq("booking_id", bookingId);
      }
    } else if (paymentStatus === "rejected" || paymentStatus === "cancelled") {
      bookingStatus = "cancelled";
      bookingPaymentStatus = paymentStatus;

      await supabase
        .from("bookings")
        .update({
          status: bookingStatus,
          payment_status: bookingPaymentStatus,
          payment_method: paymentMethod,
          payment_id: paymentId,
          payment_data: paymentData,
        })
        .eq("id", bookingId);

      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (existingOrder) {
        await supabase
          .from("orders")
          .update({
            status: "cancelled",
            payment_status: paymentStatus,
            payment_method: paymentMethod,
            payment_id: paymentId,
            payment_data: paymentData,
            payment_status_detail: paymentStatusDetail,
            updated_at: new Date().toISOString(),
          })
          .eq("booking_id", bookingId);
      }
    } else {
      await supabase
        .from("bookings")
        .update({
          payment_status: paymentStatus,
          payment_method: paymentMethod,
          payment_id: paymentId,
          payment_data: paymentData,
        })
        .eq("id", bookingId);

      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (existingOrder) {
        await supabase
          .from("orders")
          .update({
            payment_status: paymentStatus,
            payment_method: paymentMethod,
            payment_id: paymentId,
            payment_data: paymentData,
            payment_status_detail: paymentStatusDetail,
            updated_at: new Date().toISOString(),
          })
          .eq("booking_id", bookingId);
      }
    }

    console.log(`Booking ${bookingId} updated. Status: ${bookingStatus}, Payment: ${bookingPaymentStatus}`);

    return new Response(
      JSON.stringify({ ok: true, bookingId, status: bookingStatus }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
