import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("Edge Function 'get_annotation_treads_by_annotation_id' is running!");

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
    const rawBody = await req.text();
    console.log("Raw request body:", rawBody);

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("Failed to parse JSON body:", parseError.message);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { annotation_id } = body;
    if (!annotation_id) {
      console.error("Missing required parameter: annotation_id");
      return new Response(
        JSON.stringify({ error: "Missing required parameter: annotation_id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Parsed request data:", { annotation_id });

    // created_at 기준 내림차순(최신순) 정렬
    const { data, error } = await supabase
      .from("annotation_threads")
      .select("*")
      .eq("annotation_id", annotation_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching annotation threads:", error);
      return new Response(
        JSON.stringify({ error: error.message, details: error.details, hint: error.hint }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Annotation threads fetched successfully:", data);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
