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

    const paymentId = String(notification.data.id);
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
    console.log("Payment ID:", paymentId);

    const orderNumber = paymentData.external_reference;
    const paymentStatus = paymentData.status;
    const paymentStatusDetail = paymentData.status_detail;
    const paymentMethod = paymentData.payment_method_id;

    if (!orderNumber) {
      console.error("No order number in payment external_reference");
      return new Response(
        JSON.stringify({ error: "No order number found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (bookingError || !booking) {
      console.error("Booking not found for order number:", orderNumber);
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const bookingId = booking.id;
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
        console.log("Updating existing order:", existingOrder.id);
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
        console.error("WARNING: Order not found for booking:", bookingId, "- Order should have been created when booking was created!");
      }

      const reservationDate = new Date(booking.date);
      const dateFormatted = reservationDate.toLocaleDateString('es-UY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      try {
        const emailPayload = {
          template_name: "agenda_confirmation",
          recipient_email: booking.customer_email,
          order_id: booking.id.toString(),
          wait_for_invoice: true,
          data: {
            client_name: booking.customer_name,
            order_number: orderNumber,
            service_name: booking.service_name,
            provider_name: booking.partner_name,
            reservation_date: dateFormatted,
            reservation_time: booking.time,
            pet_name: booking.pet_name
          }
        };

        console.log("Sending confirmation email to:", booking.customer_email);

        const emailResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-email`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload),
          }
        );

        if (emailResponse.ok) {
          console.log("Confirmation email sent successfully");
        } else {
          const errorData = await emailResponse.json();
          console.error("Failed to send confirmation email:", errorData);
        }
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
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

    console.log(`Booking ${bookingId} (Order: ${orderNumber}) updated. Status: ${bookingStatus}, Payment: ${bookingPaymentStatus}`);

    return new Response(
      JSON.stringify({ ok: true, orderNumber, bookingId, status: bookingStatus }),
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
