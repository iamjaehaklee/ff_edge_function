import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("Edge Function 'put_test' is running!");

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("DEV_SUPABASE_URL");
  const supabaseKey = Deno.env.get("DEV_SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables");
    return new Response(JSON.stringify({ error: "Missing Supabase environment variables" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Parse JSON body from request
    const body = await req.json();
    const { content = "text" } = body;

    if (!content) {
      console.error("Missing required parameters:", { content });
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Insert message into the database
    const { data, error } = await supabase
      .from("test")
      .insert([{ content }])
      .select();

    if (error) {
      console.error("Error inserting message:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      return new Response(
        JSON.stringify({
          error: error.message,
          details: error.details,
          hint: error.hint,
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log("Message inserted successfully:", data);
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Unexpected error:", {
      message: error.message,
      stack: error.stack,
    });

    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
