import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("Edge Function 'get_file_data_by_storage_key' is running!");

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
  const bucketName = "work_room_files"; // ✅ 버킷명 고정

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

    const { storage_key } = body;

    if (!storage_key) {
      console.error("Missing required parameter: storage_key");
      return new Response(
        JSON.stringify({ error: "Missing required parameter: storage_key" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching file data for:", { bucketName, storage_key });

    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("storage_key", storage_key)
      .maybeSingle(); // ✅ 단일 파일만 조회

    if (error) {
      console.error("Error querying file info:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!data) {
      console.warn("No file found for given storage_key.");
      return new Response(
        JSON.stringify({ error: "File not found." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("File data retrieved:", data);

    return new Response(
      JSON.stringify({ data }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Unexpected error:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
