import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("Edge Function 'delete_annotation_thread' is running!");

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

    const { id } = body;
    if (!id) {
      console.error("Missing required parameter: id");
      return new Response(JSON.stringify({ error: "Missing required parameter: id" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    console.log("Parsed request data:", { id });

    const { data, error } = await supabase
      .from("annotation_threads")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting annotation thread:", error);
      return new Response(JSON.stringify({ error: error.message, details: error.details, hint: error.hint }), { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    console.log("Annotation thread deleted successfully:", data);
    return new Response(JSON.stringify({ message: "Annotation thread deleted successfully", data }), { 
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
