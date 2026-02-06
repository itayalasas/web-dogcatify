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
      } else {
        console.log("Creating new order for booking:", bookingId);

        const { data: partnerData } = await supabase
          .from("partners")
          .select("commission_percentage")
          .eq("id", booking.partner_id)
          .maybeSingle();

        const IVA_RATE = 22;
        const commissionPercentage = partnerData?.commission_percentage || 5;
        const commissionAmount = (booking.total_amount * commissionPercentage) / 100;
        const partnerAmount = booking.total_amount - commissionAmount;
        const ivaAmount = (booking.total_amount * IVA_RATE) / 100;

        const partnerBreakdown = {
          iva_rate: IVA_RATE,
          partners: {
            [booking.partner_id]: {
              items: [
                {
                  id: booking.service_id || booking.id,
                  name: booking.service_name || "Servicio",
                  price: booking.total_amount,
                  total: booking.total_amount,
                  quantity: 1,
                  subtotal: booking.total_amount,
                  iva_amount: ivaAmount,
                },
              ],
              subtotal: booking.total_amount,
              partner_id: booking.partner_id,
              partner_name: booking.partner_name || "Partner",
            },
          },
          iva_amount: ivaAmount,
          iva_included: false,
          shipping_cost: 0,
          total_partners: 1,
          commission_split: commissionAmount,
        };

        const { data: newOrder, error: orderError } = await supabase.from("orders").insert({
          partner_id: booking.partner_id,
          customer_id: booking.customer_id,
          booking_id: booking.id,
          order_type: "service_booking",
          service_id: booking.service_id,
          pet_id: booking.pet_id,
          status: "confirmed",
          total_amount: booking.total_amount,
          subtotal: booking.total_amount,
          iva_rate: IVA_RATE,
          iva_amount: ivaAmount,
          iva_included_in_price: false,
          shipping_cost: 0,
          commission_amount: commissionAmount,
          partner_amount: partnerAmount,
          partner_breakdown: partnerBreakdown,
          partner_name: booking.partner_name,
          service_name: booking.service_name,
          pet_name: booking.pet_name,
          customer_name: booking.customer_name,
          customer_email: booking.customer_email,
          customer_phone: booking.customer_phone,
          appointment_date: booking.date,
          appointment_time: booking.time,
          payment_method: paymentMethod,
          payment_status: "approved",
          payment_preference_id: booking.payment_preference_id || null,
          payment_id: paymentId,
          payment_data: paymentData,
          payment_status_detail: paymentStatusDetail,
          booking_notes: booking.notes || null,
          items: [
            {
              id: booking.service_id || booking.id,
              name: booking.service_name || "Servicio",
              price: booking.total_amount,
              quantity: 1,
            },
          ],
        }).select();

        if (orderError) {
          console.error("Error creating order:", orderError);
        } else {
          console.log("Order created successfully:", newOrder);
        }
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
