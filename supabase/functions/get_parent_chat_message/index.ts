import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("Edge Function 'get_parent_chat_message' is running!");

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
    console.error("❌ Missing message_id parameter.");
    return new Response(
      JSON.stringify({ error: "Missing message_id parameter." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`🔵 Fetching parent chat message for message_id: ${message_id}`);

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("id", message_id)
      .single();

    if (error) {
      console.error("❌ Error fetching parent chat message:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Successfully retrieved parent chat message.");
    return new Response(JSON.stringify(data), {
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
