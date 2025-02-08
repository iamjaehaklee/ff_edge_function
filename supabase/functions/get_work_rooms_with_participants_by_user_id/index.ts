import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1"; // end of import

console.log("Edge Function 'get_work_rooms_with_participants_by_user_id' is running!"); // end of console.log

Deno.serve(async (req) => { // start of Deno.serve
  const supabaseUrl = Deno.env.get("DEV_SUPABASE_URL"); // get Supabase URL from env
  const supabaseKey = Deno.env.get("DEV_SUPABASE_SERVICE_ROLE_KEY"); // get Supabase Service Role Key from env

  if (!supabaseUrl || !supabaseKey) { // check environment variables
    console.error("❌ [get_work_rooms_with_participants_by_user_id] Missing Supabase environment variables.");
    return new Response(
      JSON.stringify({ error: "Missing Supabase environment variables." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } // end of environment check

  const supabase = createClient(supabaseUrl, supabaseKey); // create Supabase client

  try { // start of try
    // Get raw request body for debugging
    const rawBody = await req.text();
    console.log("📥 [get_work_rooms_with_participants_by_user_id] Raw request body:", rawBody); // end of raw body log

    // Parse JSON body
    let body;
    try { // start of JSON parse try
      body = JSON.parse(rawBody);
    } catch (parseError) { // catch JSON parse error
      console.error("❌ [get_work_rooms_with_participants_by_user_id] Failed to parse JSON body:", parseError.message);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    } // end of JSON parse try

    // Destructure parameter from the body
    const { p_user_id } = body;
    // Validate required parameter
    if (!p_user_id) {
      console.error("❌ [get_work_rooms_with_participants_by_user_id] Missing required parameter: p_user_id");
      return new Response(
        JSON.stringify({ error: "Missing required parameter: p_user_id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    } // end of parameter validation

    console.log("🔍 [get_work_rooms_with_participants_by_user_id] Parsed request data:", { p_user_id }); // end of parsed data log

    // Call the RPC function instead of directly querying the table.
    const { data, error } = await supabase.rpc("get_work_rooms_with_participants_by_user_id", { p_user_id });
    if (error) { // end of RPC error check
      console.error("❌ [get_work_rooms_with_participants_by_user_id] Error calling RPC function:", error.message);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    } // end of RPC error check

    console.log("✅ [get_work_rooms_with_participants_by_user_id] RPC function returned data:", data); // end of RPC success log

    // If no data is returned, then return an empty array.
    if (!data) {
      console.log("🔴 [get_work_rooms_with_participants_by_user_id] No data returned from RPC for user:", p_user_id);
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Ensure that the final result is an array.
    const result = Array.isArray(data) ? data : [data];
    console.log("✅ [get_work_rooms_with_participants_by_user_id] Final result:", result); // end of final result log

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) { // end of try
    console.error("❌ [get_work_rooms_with_participants_by_user_id] Unexpected error:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  } // end of catch
}); // end of Deno.serve
