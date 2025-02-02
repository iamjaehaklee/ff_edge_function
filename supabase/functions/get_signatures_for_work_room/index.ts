import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("Edge Function 'get_signatures_for_work_room' is running!");

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
    const { p_work_room_id } = body;

    // 필수 값 검증
    if (!p_work_room_id) {
      console.error("Missing required parameter: p_work_room_id");
      return new Response(
        JSON.stringify({ error: "Missing required parameter: p_work_room_id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 요청 데이터 로깅
    console.log("Parsed request data:", { p_work_room_id });

    // Supabase RPC 함수 호출
    const { data, error } = await supabase.rpc("get_signatures_for_work_room", {
      p_work_room_id: p_work_room_id,
    });

    if (error) {
      console.error("Error calling RPC 'get_signatures_for_work_room':", error);
      return new Response(
        JSON.stringify({ error: error.message, details: error.details, hint: error.hint }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("Participants and signatures fetched successfully:", data);
    return new Response(JSON.stringify({ message: "Data fetched successfully", data }), {
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
