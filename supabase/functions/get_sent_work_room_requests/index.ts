import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "User ID is required" }), { status: 400 });
    }

    console.log(`Fetching sent work room requests for user: ${user_id}`);

    const supabase = createClient(
      Deno.env.get("DEV_SUPABASE_URL")!,
      Deno.env.get("DEV_SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data, error } = await supabase
      .from("work_room_requests")
      .select("*")
      .eq("requester_id", user_id)
      .order("sent_at", { ascending: false });

    if (error) {
      console.error("Error fetching sent work room requests:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
