import { createClient } from "https://esm.sh/@supabase/supabase-js";




Deno.serve(async (req) => {
  console.log("Request received:", req);

  try {
    // 요청에서 JSON 데이터 추출
    const { p_user_id } = await req.json();

    // user_id 확인
    if (!p_user_id) {
      return new Response(
        JSON.stringify({ error: "Missing p_user_id" }),
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


    // Supabase RPC 호출 (get_work_rooms_by_user_id)
    const { data, error } = await supabase.rpc("get_work_rooms_by_user_id", {
      p_user_id, // Stored Procedure의 매개변수로 전달
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
      JSON.stringify({ work_rooms: data }),
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
[
  {
    "work_room_id": "11111111-1111-1111-1111-111111111111",
    "description": "A room dedicated to reviewing legal contracts and documents.",
    "participants": [
      {
        "user_id": "01ba12d0-da6a-45e0-8535-6d2e49a4f96e",
        "is_admin": true,
        "username": "user_006",
        "profile_picture_url": "https://example.com/profiles/6.png",
        "is_lawyer": true
      },
      {
        "user_id": "02cd34f1-eb7b-56g3-9647-7e8f12g7h8ij",
        "is_admin": false,
        "username": "user_007",
        "profile_picture_url": "https://example.com/profiles/7.png",
        "is_lawyer": false
      }
    ]
  }
]

*/ 