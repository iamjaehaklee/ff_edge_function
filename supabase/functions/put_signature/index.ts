import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("Edge Function 'put_signature' is running!");

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
    // 요청 바디 로깅 (디버깅용)
    const rawBody = await req.text();
    console.log("Raw request body:", rawBody);

    // JSON 파싱
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

    // 필요한 파라미터 추출
    const { p_user_id, p_work_room_id, p_image_file_storage_key } = body;

    // 필수 값 검증
    if (!p_user_id || !p_work_room_id || !p_image_file_storage_key) {
      console.error("Missing required parameters:", {
        p_user_id,
        p_work_room_id,
        p_image_file_storage_key,
      });
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 요청 데이터 로깅
    console.log("Parsed request data:", {
      p_user_id,
      p_work_room_id,
      p_image_file_storage_key,
    });

    // Supabase RPC 함수 호출
    const { data, error } = await supabase.rpc("put_signature", {
      p_user_id: p_user_id,
      p_work_room_id: p_work_room_id,
      p_image_file_storage_key: p_image_file_storage_key,
    });

    if (error) {
      console.error("Error calling RPC 'put_signature':", error);
      return new Response(
        JSON.stringify({ error: error.message, details: error.details, hint: error.hint }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("Signature stored successfully via RPC:", data);
    return new Response(JSON.stringify({ message: "Signature stored successfully", data }), {
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
