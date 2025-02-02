import { createClient } from "https://esm.sh/@supabase/supabase-js";


Deno.serve(async (req) => {
  console.log("Request received:", req);

  try {
    // 요청에서 JSON 데이터 추출
    const { work_room_id } = await req.json();

    // work_room_id 확인
    if (!work_room_id) {
      return new Response(
        JSON.stringify({ error: "Missing work_room_id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // console.log("DEV_SUPABASE_URL:", Deno.env.get("DEV_SUPABASE_URL"));
    // console.log("DEV_SUPABASE_ANON_KEY:", Deno.env.get("DEV_SUPABASE_ANON_KEY"));

    const supabase = createClient(
      Deno.env.get("DEV_SUPABASE_URL")!,
      Deno.env.get("DEV_SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }

    );


    // Supabase RPC 호출 (get_files_by_work_room_id)
    const { data, error } = await supabase.rpc("get_files_by_work_room_id", {
      work_room_id, // Stored Procedure의 매개변수로 전달
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
      JSON.stringify({ files: data }),
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

/*
 

*/ 