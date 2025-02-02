import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("Edge Function 'put_document_annotation' is running!");

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
    // Get raw request body for debugging
    const rawBody = await req.text();
    console.log("Raw request body:", rawBody);

    // Parse JSON body
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

    // Destructure parameters from the body
    const {
      document_id,
      parent_file_storage_key, // 기존 file_id를 storage_key로 변경
      work_room_id,
      page_number,
      x1,
      y1,
      x2,
      y2,
      content,
      annotation_type = "manual",
      image_file_storage_key = null,
      is_ocr = false,
      ocr_text = null,
      created_by,
    } = body;

    // Validate required parameters
    if (
      !parent_file_storage_key || // storage_key 필수 확인
      page_number === undefined ||
      x1 === undefined ||
      y1 === undefined ||
      x2 === undefined ||
      y2 === undefined ||
      !content ||
      !created_by
    ) {
      console.error("Missing required parameters:", {
      
        document_id,
        parent_file_storage_key,
        page_number,
        x1,
        y1,
        x2,
        y2,
        content,
        created_by,
      });
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log parsed data
    console.log("Parsed request data:", {
      document_id,
      parent_file_storage_key,
      work_room_id,
      page_number,
      x1,
      y1,
      x2,
      y2,
      content,
      annotation_type,
      image_file_storage_key,
      is_ocr,
      ocr_text,
      created_by,
    });

    // Call the RPC function
    const { data, error } = await supabase.rpc("upsert_document_annotation", {
      p_document_id: document_id,
      p_parent_file_storage_key: parent_file_storage_key, // storage_key 전달
      p_work_room_id: work_room_id,
      p_page_number: page_number,
      p_x1: x1,
      p_y1: y1,
      p_x2: x2,
      p_y2: y2,
      p_content: content,
      p_annotation_type: annotation_type,
      p_image_file_storage_key: image_file_storage_key,
      p_is_ocr: is_ocr,
      p_ocr_text: ocr_text,
      p_created_by: created_by,
    });

    if (error) {
      console.error("Error calling RPC 'put_document_annotation':", error);
      return new Response(
        JSON.stringify({ error: error.message, details: error.details, hint: error.hint }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("Annotation processed successfully:", data);
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Unexpected error:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
