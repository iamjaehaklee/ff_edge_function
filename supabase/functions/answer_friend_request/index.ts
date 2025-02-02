import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("Edge Function 'answer_friend_request' is running!");

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
      .from("friend_requests")
      .update({ status: action, responded_at: new Date().toISOString() })
      .eq("id", request_id)
      .eq("recipient_id", recipient_id)
      .select();

    if (error) {
      console.error("❌ Error updating friend request:", error);
      return new Response(
        JSON.stringify({ error: error.message, details: error.details }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "accepted") {
      const friendEntry = {
        user_id1: data[0].requester_id,
        user_id2: recipient_id,
        established_at: new Date().toISOString(),
      };
      
      const { error: friendError } = await supabase
        .from("friends")
        .insert(friendEntry);

      if (friendError) {
        console.error("❌ Error adding to friends table:", friendError);
        return new Response(
          JSON.stringify({ error: friendError.message, details: friendError.details }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    console.log("✅ Friend request successfully processed.");
    return new Response(JSON.stringify({ message: "Friend request processed successfully." }), {
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
