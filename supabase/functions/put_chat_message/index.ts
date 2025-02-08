import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("Edge Function 'put_chat_message' is running!");

Deno.serve(async (req) => {
  console.log("-------------------------------------------------");
  console.log("[Edge Function] Received a new request.");
  console.log("[Edge Function] Request Method:", req.method);
  console.log("[Edge Function] Request URL:", req.url);
  for (const [key, value] of req.headers.entries()) {
    console.log(`  ${key}: ${value}`);
  }

  const supabaseUrl = Deno.env.get("DEV_SUPABASE_URL");
  const supabaseKey = Deno.env.get("DEV_SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    console.error("[Edge Function] Missing Supabase environment variables.");
    return new Response(
      JSON.stringify({ error: "Missing Supabase environment variables" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const contentType = req.headers.get("content-type") || "";
    console.log("[Edge Function] Content-Type:", contentType);

    let parsedData = {};
    if (contentType.includes("multipart/form-data")) {
      console.log("[Edge Function] Detected multipart/form-data. Parsing using req.formData()...");
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        parsedData[key] = value;
        console.log(`[Edge Function] Form field: ${key} = ${value}`);
      }
    } else {
      console.log("[Edge Function] Assuming JSON body.");
      const rawBody = await req.text();
      console.log("[Edge Function] Raw request body:", rawBody);
      try {
        parsedData = JSON.parse(rawBody);
        console.log("[Edge Function] JSON parsed successfully:", parsedData);
      } catch (parseError) {
        console.error("[Edge Function] Failed to parse JSON body:", parseError.message);
        return new Response(
          JSON.stringify({ error: "Invalid JSON body" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Destructure parameters from parsedData
    const { 
      work_room_id, 
      sender_id, 
      content, 
      message_type = "text",
      attachment_file_storage_key,
      attachment_file_type
    } = parsedData;

    console.log("[Edge Function] Received parameters:", { 
      work_room_id, 
      sender_id, 
      content, 
      message_type, 
      attachment_file_storage_key,
      attachment_file_type
    });

    if (!work_room_id || !sender_id) {
      console.error("[Edge Function] Missing required parameters:", { work_room_id, sender_id });
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (message_type === "text" && (!content || content.trim() === "")) {
      console.error("[Edge Function] Missing content for text message");
      return new Response(
        JSON.stringify({ error: "Missing content for text message" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if ((message_type === "file" || message_type === "image") && (!content || content.trim() === "") && !attachment_file_storage_key) {
      console.error("[Edge Function] Missing content and attachment for file/image message");
      return new Response(
        JSON.stringify({ error: "Missing content and attachment for file/image message" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 첨부파일이 있으면 has_attachments를 true로, 없으면 false로 설정
    const insertData = {
      work_room_id,
      sender_id,
      content,
      message_type,
      has_attachments: attachment_file_storage_key ? true : false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (attachment_file_storage_key) {
      insertData["attachment_file_storage_key"] = attachment_file_storage_key;
      console.log("[Edge Function] Added attachment_file_storage_key:", attachment_file_storage_key);
    }
    if (attachment_file_type) {
      insertData["attachment_file_type"] = attachment_file_type;
      console.log("[Edge Function] Added attachment_file_type:", attachment_file_type);
    }

    console.log("[Edge Function] Inserting message into 'chat_messages' table with data:", insertData);
    const { data, error } = await supabase
      .from("chat_messages")
      .insert([ insertData ])
      .select();

    if (error) {
      console.error("[Edge Function] Error inserting message:", error);
      return new Response(
        JSON.stringify({ error: error.message, details: error.details, hint: error.hint }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("[Edge Function] Message inserted successfully:", data);
    console.log("-------------------------------------------------");
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[Edge Function] Unexpected error:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
