import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("Edge Function 'put_workroom_request' is running!");

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("DEV_SUPABASE_URL");
  const supabaseKey = Deno.env.get("DEV_SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase environment variables.");
    return new Response(
      JSON.stringify({ error: "Missing Supabase environment variables." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get raw request body for debugging
    const rawBody = await req.text();
    console.log("📥 Raw request body:", rawBody);

    // Parse JSON body
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("❌ Failed to parse JSON body:", parseError.message);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Destructure parameters from the body
    const { requester_id, recipient_email, work_room_id } = body;

    // Validate required parameters
    if (!requester_id || !recipient_email || !work_room_id) {
      console.error("❌ Missing required parameters:", { requester_id, recipient_email, work_room_id });
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("🔍 Parsed request data:", { requester_id, recipient_email, work_room_id });

    // Call the Supabase RPC function
    const { data, error } = await supabase.rpc("put_workroom_request", {
      requester_id,
      recipient_email,
      work_room_id,
    });

    if (error) {
      console.error("❌ Error inserting workroom request:", error);
      return new Response(
        JSON.stringify({ error: error.message, details: error.details, hint: error.hint }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("✅ Workroom request inserted successfully:", data);

    // Retrieve requester name
    const { data: requesterData, error: requesterError } = await supabase
      .from("users")
      .select("username")
      .eq("id", requester_id)
      .single();

    if (requesterError || !requesterData) {
      console.error("❌ Failed to fetch requester info:", requesterError?.message);
      return new Response(
        JSON.stringify({ error: "Failed to retrieve requester info" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const requester_name = requesterData.username;


    // Determine email type
    const email_type = data.recipient_id ? "workroom_request" : "invitation";


    // Retrieve work_room title, description, created_at
    const { data: workroomData, error: workroomError } = await supabase
      .from("work_rooms")
      .select("title, description, created_at")
      .eq("id", work_room_id)
      .single();

      if (workroomError || !workroomData) {
        console.error("❌ Failed to fetch workroom info:", workroomError?.message);
        return new Response(
          JSON.stringify({ error: "Failed to retrieve workroom info" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    
    // Prepare email payload for the Edge Function including work_room title, description, created_at
    const emailPayload = {
      recipient_email,
      requester_name,
      email_type,
      work_room_id: work_room_id,
      work_room_title: workroomData.title,
      work_room_description: workroomData.description,
      work_room_created_at: workroomData.created_at,
    };

    console.log("📤 Calling `send_workroom_request_email` Edge Function with:", emailPayload);

    const emailResponse = await fetch(
      `${supabaseUrl}/functions/v1/send_workroom_request_email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`, // ✅ Authorization 헤더 추가
        },
        body: JSON.stringify(emailPayload),
      }
    );

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("❌ Email function call failed:", errorText);
      return new Response(
        JSON.stringify({ error: `Failed to send email: ${errorText}` }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("✅ Email function executed successfully.");

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Unexpected error:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
