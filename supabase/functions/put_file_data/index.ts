import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("Edge Function 'put_file_data' is running!");

Deno.serve(async (req) => {
  // 환경 변수 가져오기
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
    // 요청 본문 읽기 및 JSON 파싱
    const rawBody = await req.text();
    console.log("Raw request body:", rawBody);

    let body;
    try {
      body = JSON.parse(rawBody);
      console.log("Parsed JSON body:", body);
    } catch (parseError) {
      console.error("Failed to parse JSON body:", parseError.message);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 필요한 필드 추출
    const { 
      uploader_id,         // 파일 업로드 시 클라이언트가 전달하는 uploader_id (파일 업로드시, 메시지 첨부용 파일이 아니면 반드시 전달)
      storage_key,         // 예: "work_room_id/타임스탬프가_붙은_파일명"
      file_name,           // 원본 파일명 (클라이언트가 전달)
      file_type,           // MIME 타입 (예: "image/jpeg", "application/pdf" 등)
      work_room_id,        // 파일이 속한 작업방 id
      description,         // 파일 설명 (옵션)
      chat_message_id      // 챗 메시지 첨부용 파일인 경우, 이미 생성된 챗 메시지 id (옵션)
    } = body;

    if (!uploader_id || !storage_key || !file_name || !file_type || !work_room_id) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // files 테이블에 데이터 삽입
    const { data, error } = await supabase
      .from("files")
      .insert([
        {
          storage_key: storage_key,
          file_name: file_name,
          file_type: file_type,
          uploader_id: uploader_id,
          work_room_id: work_room_id,
          description: description || null,
          chat_message_id: chat_message_id || null,
          uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error("Error inserting file data:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("File data inserted successfully:", data);
    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
