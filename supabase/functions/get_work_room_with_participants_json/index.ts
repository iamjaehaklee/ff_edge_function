import { serve } from "https://deno.land/x/sift@0.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

Deno.serve(async (req) => {
  console.log("Request received:", req);

  try {
    // 요청에서 JSON 데이터 추출
    const { p_work_room_id } = await req.json();

    // p_work_room_id 확인
    if (!p_work_room_id) {
      return new Response(
        JSON.stringify({ error: "Missing p_work_room_id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Supabase 클라이언트 초기화
    const supabase = createClient(
      Deno.env.get("DEV_SUPABASE_URL")!,
      Deno.env.get("DEV_SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Supabase RPC 호출 (get_work_room_with_participants_json)
    const { data, error } = await supabase.rpc("get_work_room_with_participants_json", {
      p_work_room_id, // Stored Procedure의 매개변수로 전달
    });

    if (error) {
      console.error("Error fetching data:", error.message);
      return new Response(
        JSON.stringify({ error: "Error fetching data", details: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 성공적으로 데이터 반환
    return new Response(
      JSON.stringify({ work_room_with_participants: data }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Invalid request:", error.message);
    return new Response(
      JSON.stringify({ error: "Invalid request", details: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});
