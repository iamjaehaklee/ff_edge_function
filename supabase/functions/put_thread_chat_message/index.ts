import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("Edge Function 'put_thread_chat_message' is running!");

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
    // Parse the raw request body
    const rawBody = await req.text();
    console.log("Raw request body:", rawBody);

    // Parse the JSON body
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (error) {
      console.error("Failed to parse JSON body:", error.message);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Destructure the required parameters
    const {
      work_room_id,
      sender_id,
      content,
      parent_message_id,
      message_type = "text",
    } = body;

    // Validate required parameters
    if (!work_room_id || !sender_id || !content || !parent_message_id) {
      console.error("Missing required parameters:", {
        work_room_id,
        sender_id,
        content,
        parent_message_id,
      });
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Parsed request data:", {
      work_room_id,
      sender_id,
      content,
      parent_message_id,
      message_type,
    });

    // Insert the thread message into the database
    const { data, error } = await supabase
      .from("chat_messages")
      .insert([
        {
          work_room_id,
          sender_id,
          content,
          parent_message_id,
          message_type,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Error inserting thread message:", error);
      return new Response(
        JSON.stringify({
          error: error.message,
          details: error.details,
          hint: error.hint,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Thread message inserted successfully:", data);
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
