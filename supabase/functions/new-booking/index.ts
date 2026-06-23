// ============================================================
// IBSS Holiday Bookings — Edge Function: new-booking
// Deploy:  supabase functions deploy new-booking --no-verify-jwt
// Secrets needed (set via: supabase secrets set KEY=value):
//   SUPABASE_URL              (auto-provided by platform)
//   SUPABASE_SERVICE_ROLE_KEY (auto-provided by platform)
//   CLICKSEND_USERNAME        your ClickSend username
//   CLICKSEND_API_KEY         your ClickSend API key
//   NOTIFY_PHONE              your mobile, e.164 e.g. +61412345678
//   FROM_SMS                  sender id/number shown to parents (optional)
//   SITE_URL                  e.g. https://holidays.ibssqld.com.au
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sendSMS(to: string, body: string, from?: string) {
  const user = Deno.env.get("CLICKSEND_USERNAME")!;
  const key = Deno.env.get("CLICKSEND_API_KEY")!;
  const auth = "Basic " + btoa(`${user}:${key}`);
  const msg: Record<string, unknown> = { to, body };
  if (from) msg.from = from;
  const res = await fetch("https://rest.clicksend.com/v3/sms/send", {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [msg] }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error("ClickSend error: " + JSON.stringify(json));
  return json;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405, headers: cors });

  try {
    const { program, child_name, parent_name, phone, email, days, day_titles,
            day_details, pickup_time, dropoff_time, return_token } = await req.json();

    // --- basic validation ---
    if (!child_name || !parent_name || !phone || !email || !Array.isArray(days) || days.length === 0) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const record = {
      program: program || "2026-winter",
      child_name, parent_name, phone, email, days, day_titles,
      day_details: day_details || null,
      pickup_time: pickup_time || null,
      dropoff_time: dropoff_time || null,
    };

    let bookingToken: string;

    if (return_token) {
      // magic-link return: update the existing booking
      const { data, error } = await supabase
        .from("bookings")
        .update({ ...record, status: "pending" })
        .eq("token", return_token)
        .select("token")
        .single();
      if (error) throw error;
      bookingToken = data.token;
    } else {
      const { data, error } = await supabase
        .from("bookings")
        .insert(record)
        .select("token")
        .single();
      if (error) throw error;
      bookingToken = data.token;
    }

    const titles = (day_titles && day_titles.length ? day_titles : days).join(", ");

    // --- 1) notify Ninja ---
    const notifyPhone = Deno.env.get("NOTIFY_PHONE");
    if (notifyPhone) {
      await sendSMS(
        notifyPhone,
        `IBSS booking: ${child_name} (parent ${parent_name}, ${phone}) booked: ${titles}.`,
        Deno.env.get("FROM_SMS") || undefined,
      );
    }

    // --- 2) magic link + confirmation to parent ---
    const site = Deno.env.get("SITE_URL");
    if (site) {
      const link = `${site}?b=${bookingToken}`;
      await sendSMS(
        phone,
        `Thanks ${parent_name}! ${child_name} is booked for: ${titles}. To view or change your booking later, open: ${link}`,
        Deno.env.get("FROM_SMS") || undefined,
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
