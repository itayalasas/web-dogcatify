import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PaymentLinkRequest {
  bookingId: string;
  amount: number;
  description: string;
  customerEmail: string;
  customerName: string;
}

interface MercadoPagoConfig {
  access_token: string;
  public_key: string;
  email: string;
  account_id: number;
  is_connected: boolean;
  is_test_mode: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { bookingId, amount, description, customerEmail, customerName }: PaymentLinkRequest = await req.json();

    if (!bookingId || !amount || !customerEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    const { data: configData, error: configError } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'mercadopago_config')
      .maybeSingle();

    if (configError || !configData) {
      console.error("Error fetching Mercado Pago config:", configError);
      return new Response(
        JSON.stringify({ error: "Mercado Pago not configured in system settings" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const mpConfig = configData.value as MercadoPagoConfig;

    if (!mpConfig.is_connected || !mpConfig.access_token) {
      return new Response(
        JSON.stringify({ error: "Mercado Pago not connected" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const mercadoPagoAccessToken = mpConfig.access_token;
    const backUrl = `${supabaseUrl}/functions/v1/mercadopago-webhook`;

    const preference = {
      items: [
        {
          title: description,
          quantity: 1,
          unit_price: amount,
        },
      ],
      payer: {
        email: customerEmail,
        name: customerName,
      },
      back_urls: {
        success: `${supabaseUrl}/booking-success`,
        failure: `${supabaseUrl}/booking-failure`,
        pending: `${supabaseUrl}/booking-pending`,
      },
      auto_return: "approved",
      notification_url: backUrl,
      external_reference: bookingId,
      statement_descriptor: "DogCatify",
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mercadoPagoAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Mercado Pago API error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create payment preference", details: error }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        preferenceId: data.id,
        initPoint: data.init_point,
        sandboxInitPoint: data.sandbox_init_point,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error creating payment link:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
