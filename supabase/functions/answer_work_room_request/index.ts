import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("Edge Function 'answer_work_room_request' is running!");

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("DEV_SUPABASE_URL");
  const supabaseKey = Deno.env.get("DEV_SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase environment variables.");
    return new Response(
      JSON.stringify({ error: "Missing Supabase environment variables." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const rawBody = await req.text();
    console.log("📥 Raw request body:", rawBody);

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("❌ Failed to parse JSON body:", parseError.message);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { request_id, recipient_id, action } = body;

    if (!request_id || !recipient_id || !action) {
      console.error("❌ Missing required parameters:", { request_id, recipient_id, action });
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("🔍 Parsed request data:", { request_id, recipient_id, action });

    if (!["accepted", "declined"].includes(action)) {
      console.error("❌ Invalid action provided:", action);
      return new Response(
        JSON.stringify({ error: "Invalid action. Must be 'accepted' or 'declined'." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabase
      .from("work_room_requests")
      .update({ status: action, responded_at: new Date().toISOString() })
      .eq("id", request_id)
      .eq("recipient_id", recipient_id)
      .select();

    if (error) {
      console.error("❌ Error updating work room request:", error);
      return new Response(
        JSON.stringify({ error: error.message, details: error.details }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "accepted") {
      const participantEntry = {
        user_id: recipient_id,
        work_room_id: data[0].work_room_id,
        joined_at: new Date().toISOString(),
      };
      
      const { error: participantError } = await supabase
        .from("work_room_participants")
        .insert(participantEntry);

      if (participantError) {
        console.error("❌ Error adding participant to work room:", participantError);
        return new Response(
          JSON.stringify({ error: participantError.message, details: participantError.details }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    console.log("✅ Work room request successfully processed.");
    return new Response(JSON.stringify({ message: "Work room request processed successfully." }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Unexpected error:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
