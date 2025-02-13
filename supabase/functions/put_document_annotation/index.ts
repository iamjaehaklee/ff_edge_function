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
      parent_file_storage_key, // 기존 file_id 대신 storage_key 사용
      work_room_id,
      page_number,
      area_left,
      area_top,
      area_width,
      area_height,
      content,
      annotation_type = "manual",
      image_file_storage_key = null,
      is_ocr = false,
      ocr_text = null,
      created_by,
    } = body;

    // Validate required parameters
    if (
      !parent_file_storage_key ||
      page_number === undefined ||
      area_left === undefined ||
      area_top === undefined ||
      area_width === undefined ||
      area_height === undefined ||
      !content ||
      !created_by
    ) {
      console.error("Missing required parameters:", {
        document_id,
        parent_file_storage_key,
        page_number,
        area_left,
        area_top,
        area_width,
        area_height,
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
      area_left,
      area_top,
      area_width,
      area_height,
      content,
      annotation_type,
      image_file_storage_key,
      is_ocr,
      ocr_text,
      created_by,
    });

    // Insert a new row into the document_annotations table
    const { data, error } = await supabase
      .from("document_annotations")
      .insert({
        document_id,
        parent_file_storage_key,
        work_room_id,
        page_number,
        area_left: area_left,  // 변경된 컬럼명: area_left
        area_top: area_top,
        area_width: area_width,
        area_height: area_height,
        content,
        annotation_type,
        image_file_storage_key,
        is_ocr,
        ocr_text,
        created_by,
      });

    if (error) {
      console.error("Error inserting document annotation:", error);
      return new Response(
        JSON.stringify({ error: error.message, details: error.details, hint: error.hint }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("Annotation inserted successfully:", data);
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
