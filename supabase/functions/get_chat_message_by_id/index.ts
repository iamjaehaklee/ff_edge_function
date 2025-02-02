import { createClient } from "https://esm.sh/@supabase/supabase-js";

Deno.serve(async (req) => {
  console.log("Request received:", req);

  try {
    // Parse JSON body to get message_id
    const { message_id } = await req.json();

    // Validate input
    if (!message_id) {
      return new Response(
        JSON.stringify({ error: "Missing message_id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("DEV_SUPABASE_URL")!,
      Deno.env.get("DEV_SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // Call the RPC function to fetch the chat message
    const { data, error } = await supabase.rpc("get_chat_message_by_id", {
      message_id,
    });

    // Handle RPC errors
    if (error) {
      console.error("Error fetching message:", error.message);
      return new Response(
        JSON.stringify({ error: "Error fetching message", details: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle missing data
    if (!data || data.length === 0) {
      console.log("Message not found for message_id:", message_id);
      return new Response(
        JSON.stringify({ error: "Message not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return the message data
    console.log("Message data:", data);
    return new Response(
      JSON.stringify(data[0]), // Return the first (and only) message
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing request:", error.message);
    return new Response(
      JSON.stringify({ error: "Invalid request", details: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});
