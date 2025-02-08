import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const { work_room_id } = await req.json();

    if (!work_room_id) {
      return new Response(JSON.stringify({ error: "Work room ID is required" }), { status: 400 });
    }

    console.log(`Fetching work room requests for work_room_id: ${work_room_id}`);

    const supabase = createClient(
      Deno.env.get("DEV_SUPABASE_URL")!,
      Deno.env.get("DEV_SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data, error } = await supabase
      .from("work_room_requests")
      .select("*")
      .eq("work_room_id", work_room_id)
      .order("sent_at", { ascending: false });

    if (error) {
      console.error("Error fetching work room requests:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
