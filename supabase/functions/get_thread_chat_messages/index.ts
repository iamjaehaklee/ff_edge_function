import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("Edge Function 'get_thread_chat_messages' is running!");

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
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const parentMessageId = searchParams.get("parent_message_id");

    if (!parentMessageId) {
      console.error("Missing 'parent_message_id' parameter");
      return new Response(
        JSON.stringify({ error: "Missing 'parent_message_id' parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching thread messages for parent_message_id: ${parentMessageId}`);

    // Fetch messages from the database
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("parent_message_id", parentMessageId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching thread messages:", error);
      return new Response(
        JSON.stringify({ error: error.message, details: error.details, hint: error.hint }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Thread messages fetched successfully:", data);
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
