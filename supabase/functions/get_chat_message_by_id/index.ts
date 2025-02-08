import { createClient } from "https://esm.sh/@supabase/supabase-js";

Deno.serve(async (req) => {
  console.log("Request received:", req);

  try {
    // 요청 JSON body에서 message_id 추출
    const { message_id } = await req.json();

    // message_id가 없으면 오류 응답
    if (!message_id) {
      return new Response(
        JSON.stringify({ error: "Missing message_id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Supabase 환경 변수 가져오기
    const supabaseUrl = Deno.env.get("DEV_SUPABASE_URL");
    const supabaseKey = Deno.env.get("DEV_SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Supabase 클라이언트 생성 (Authorization 헤더는 요청 헤더에서 전달)
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });

    // chat_messages 테이블에서 직접 쿼리 (message_id에 해당하는 행 조회)
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("id", message_id);

    if (error) {
      console.error("Error querying chat_messages:", error.message);
      return new Response(
        JSON.stringify({ error: "Error querying chat_messages", details: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 결과가 없으면 404 응답
    if (!data || data.length === 0) {
      console.log("Message not found for message_id:", message_id);
      return new Response(
        JSON.stringify({ error: "Message not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 조회된 메시지 데이터 중 첫 번째 행 반환
    console.log("Message data:", data[0]);
    return new Response(
      JSON.stringify(data[0]),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error processing request:", err.message);
    return new Response(
      JSON.stringify({ error: "Invalid request", details: err.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});
