import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("Edge Function 'put_annotation_thread' is running!");

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("DEV_SUPABASE_URL");
  const supabaseKey = Deno.env.get("DEV_SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables");
    return new Response(JSON.stringify({ error: "Missing Supabase environment variables" }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const rawBody = await req.text();
    console.log("Raw request body:", rawBody);

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("Failed to parse JSON body:", parseError.message);
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // Destructure parameters for creating a new annotation thread
    const {
      content,
      annotation_id,
      created_by,
      created_at,
      updated_at
    } = body;

    if (!content || !annotation_id || !created_by) {
      console.error("Missing required parameters:", { content, annotation_id, created_by });
      return new Response(JSON.stringify({ error: "Missing required parameters: content, annotation_id, created_by" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    console.log("Parsed request data:", { content, annotation_id, created_by, created_at, updated_at });

    const { data, error } = await supabase
      .from("annotation_threads")
      .insert({
        content,
        annotation_id,
        created_by,
        created_at: created_at || new Date().toISOString(),
        updated_at: updated_at || new Date().toISOString(),
      });

    if (error) {
      console.error("Error inserting annotation thread:", error);
      return new Response(JSON.stringify({ error: error.message, details: error.details, hint: error.hint }), { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    console.log("Annotation thread inserted successfully:", data);
    return new Response(JSON.stringify(data), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (error) {
    console.error("Unexpected error:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
});
