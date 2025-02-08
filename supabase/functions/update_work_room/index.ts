import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1"; // end of import

console.log("Edge Function 'update_work_room' is running!"); // end of console.log

Deno.serve(async (req) => { // start of Deno.serve
  const supabaseUrl = Deno.env.get("DEV_SUPABASE_URL");
  const supabaseKey = Deno.env.get("DEV_SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) { // check environment variables
    console.error("❌ Missing Supabase environment variables.");
    return new Response(
      JSON.stringify({ error: "Missing Supabase environment variables." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } // end of environment check

  const supabase = createClient(supabaseUrl, supabaseKey); // create Supabase client

  try { // start of try
    // Get raw request body for debugging
    const rawBody = await req.text();
    console.log("📥 Raw request body:", rawBody);

    // Parse JSON body
    let body;
    try { // start of JSON parse try
      body = JSON.parse(rawBody);
    } catch (parseError) { // catch JSON parse error
      console.error("❌ Failed to parse JSON body:", parseError.message);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    } // end of JSON parse try

    // Destructure parameters from the body
    const { p_work_room_id, p_title, p_description } = body;
    // Validate required parameters
    if (!p_work_room_id) {
      console.error("❌ Missing required parameter: p_work_room_id");
      return new Response(
        JSON.stringify({ error: "Missing required parameter: p_work_room_id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (p_title === undefined && p_description === undefined) {
      console.error("❌ No update data provided: at least one of p_title or p_description must be provided.");
      return new Response(
        JSON.stringify({ error: "No update data provided: at least one of p_title or p_description must be provided." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log("🔍 Parsed request data:", { p_work_room_id, p_title, p_description });

    // 구성할 업데이트 데이터 객체
    const updateData: Record<string, unknown> = {};
    if (p_title !== undefined && p_title !== null) updateData.title = p_title;
    if (p_description !== undefined && p_description !== null) updateData.description = p_description;

    // Update the work_rooms table
    const { data, error } = await supabase
      .from("work_rooms")
      .update(updateData)
      .eq("id", p_work_room_id)
      .select("*");

    if (error) {
      console.error("❌ Error updating work room:", error.message);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    } // end of update error check

    console.log("✅ Work room updated successfully:", data);

    return new Response(JSON.stringify({ work_room: data }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) { // end of try
    console.error("❌ Unexpected error:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  } // end of catch
}); // end of Deno.serve
