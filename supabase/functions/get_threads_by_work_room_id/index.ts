import { createClient } from "https://esm.sh/@supabase/supabase-js";

Deno.serve(async (req) => {
  console.log("Request received:", req);

  try {
    // Log the request method and headers
    console.log("Request method:", req.method);
    console.log("Request headers:", JSON.stringify(Object.fromEntries(req.headers)));

    // Parse the JSON body
    const { work_room_id } = await req.json();

    // Log the request body
    console.log("Request body:", { work_room_id });

    // Validate input
    if (!work_room_id) {
      console.error("Missing work_room_id in the request.");
      return new Response(
        JSON.stringify({ error: "Missing work_room_id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with DEV-prefixed environment variables
    const supabase = createClient(
      Deno.env.get("DEV_SUPABASE_URL")!,
      Deno.env.get("DEV_SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // Call the RPC function to fetch threads
    const { data, error } = await supabase.rpc("get_threads_by_work_room", {
      work_room_id,
    });

    // Handle RPC errors
    if (error) {
      console.error("Error fetching threads:", error.message);
      return new Response(
        JSON.stringify({ error: "Error fetching threads", details: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle empty data
    if (!data || data.length === 0) {
      console.log("No threads found for the given work_room_id.");
      return new Response(
        JSON.stringify({ threads: [] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log the successful response
    console.log("Threads data:", data);

    // Return the threads data
    return new Response(
      JSON.stringify({ threads: data }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing the request:", error.message);
    return new Response(
      JSON.stringify({ error: "Invalid request", details: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});
