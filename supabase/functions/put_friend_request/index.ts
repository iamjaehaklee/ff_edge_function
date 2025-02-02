import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("Edge Function 'put_friend_request' is running!");

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
    const { requester_id, recipient_email } = body;

    // Validate required parameters
    if (!requester_id || !recipient_email) {
      console.error("❌ Missing required parameters:", { requester_id, recipient_email });
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("🔍 Parsed request data:", { requester_id, recipient_email });

    // Call the Supabase RPC function
    const { data, error } = await supabase.rpc("put_friend_request", {
      requester_id,
      recipient_email,
    });

    if (error) {
      console.error("❌ Error inserting friend request:", error);
      return new Response(
        JSON.stringify({ error: error.message, details: error.details, hint: error.hint }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("✅ Friend request inserted successfully:", data);

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
    const email_type = data.recipient_id ? "friend_request" : "invitation";

    // Call `send_friend_request_email` Edge Function
    const emailPayload = {
      recipient_email,
      requester_name,
      email_type,
    };

    console.log("📤 Calling `send_friend_request_email` Edge Function with:", emailPayload);

    const emailResponse = await fetch(
      `${supabaseUrl}/functions/v1/send_friend_request_email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`, // ✅ Authorization 헤더 추가
        },        body: JSON.stringify(emailPayload),
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
