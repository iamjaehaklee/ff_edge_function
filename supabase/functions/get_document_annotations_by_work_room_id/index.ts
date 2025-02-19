import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("Edge Function 'get_document_annotations_by_work_room_id' is running!");

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("DEV_SUPABASE_URL");
  const supabaseKey = Deno.env.get("DEV_SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables");
    return new Response(
      JSON.stringify({ error: "Missing Supabase environment variables" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Parse request to extract work_room_id
    const url = new URL(req.url);
    const workRoomId = url.searchParams.get("work_room_id");

    if (!workRoomId) {
      return new Response(
        JSON.stringify({ error: "Missing work_room_id parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call the RPC function
    const { data, error } = await supabase.rpc("get_document_annotations_by_work_room_id", {
      _work_room_id: workRoomId,
    });

    if (error) {
      console.error("Error calling RPC 'get_document_annotations_by_work_room_id':", error);
      return new Response(
        JSON.stringify({ error: error.message, details: error.details, hint: error.hint }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Fetched annotations successfully:", data);
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Unexpected error:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
