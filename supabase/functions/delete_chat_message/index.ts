import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("Edge Function 'delete_chat_message' is running!");

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
  const { message_id } = await req.json();

  if (!message_id) {
    console.error("❌ Missing required parameter (message_id).");
    return new Response(
      JSON.stringify({ error: "Missing required parameter (message_id)." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`🔵 Deleting chat message ID: ${message_id}`);

    // First, check if the message exists
    const { data: existingMessage, error: fetchError } = await supabase
      .from("chat_messages")
      .select("id")
      .eq("id", message_id)
      .single();

    if (fetchError || !existingMessage) {
      console.error("❌ Message not found or already deleted.");
      return new Response(
        JSON.stringify({ error: "Message not found or already deleted." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Delete the message permanently
    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("id", message_id);

    if (error) {
      console.error("❌ Error deleting chat message:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Successfully deleted chat message.");
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
