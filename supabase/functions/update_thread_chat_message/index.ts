import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("Edge Function 'update_thread_chat_message' is running!");

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
  const { message_id, new_content } = await req.json();

  if (!message_id || !new_content) {
    console.error("❌ Missing required parameters.");
    return new Response(
      JSON.stringify({ error: "Missing required parameters (message_id, new_content)" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`🔵 Updating thread chat message ID: ${message_id}`);

    const { error } = await supabase
      .from("chat_messages")
      .update({ content: new_content, updated_at: new Date().toISOString() })
      .eq("id", message_id);

    if (error) {
      console.error("❌ Error updating thread chat message:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    console.log("✅ Successfully updated thread chat message.");
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
