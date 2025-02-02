import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const { requester_id, recipient_email } = await req.json();

    if (!requester_id || !recipient_email) {
      return new Response(JSON.stringify({ error: "Requester ID and recipient email are required" }), { status: 400 });
    }

    console.log(`Checking existing friend request from ${requester_id} to ${recipient_email}`);

    const supabase = createClient(
      Deno.env.get("DEV_SUPABASE_URL")!,
      Deno.env.get("DEV_SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data, error } = await supabase
      .from("friend_requests")
      .select("sent_at")
      .eq("requester_id", requester_id)
      .eq("recipient_email", recipient_email)
      .order("sent_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error checking existing friend request:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ sent_at: data?.sent_at || null }), { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});