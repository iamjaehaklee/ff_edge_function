import { serve } from "https://deno.land/x/sift@0.6.0/mod.ts";
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


    // Supabase RPC 호출 (get_work_room_details_json)
    const { data, error } = await supabase.rpc("get_work_room_details_json", {
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
      JSON.stringify({ work_room_details : data }),
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
 {
  "work_room_details": {
    "work_room": {
      "id": "21cd71b0-b033-4d2a-b2a7-e45ad7ada332",
      "name": "IP Dispute Room",
      "description": "Workspace for preparing case submissions and discussing arguments.",
      "created_at": "2025-01-24T03:16:13.087878+00:00",
      "updated_at": "2025-01-24T03:16:13.088032+00:00"
    },
    "participants": [
      {
        "id": "78542a40-626e-47ea-83a8-7bd3025739ee",
        "user_id": "ee6bd55d-8d0c-4636-9a4d-d7fd236df08b",
        "is_admin": true,
        "joined_at": "2020-04-04T23:50:33+00:00",
        "last_seen": "2023-12-03T14:44:18+00:00"
      },
      {
        "id": "cb4a44d2-f63b-4ccd-9266-5d01d335e81e",
        "user_id": "083dc4c6-7d47-404f-96b8-da0ebbb1028a",
        "is_admin": false,
        "joined_at": "2021-08-01T14:30:30+00:00",
        "last_seen": "2020-12-04T21:04:24+00:00"
      },
      {
        "id": "7d9365e5-f948-42a4-948e-ec6b54695c74",
        "user_id": "ee6bd55d-8d0c-4636-9a4d-d7fd236df08b",
        "is_admin": false,
        "joined_at": "2020-11-10T22:50:30+00:00",
        "last_seen": "2022-06-16T08:37:54+00:00"
      }
    ],
    "parties": []
  }
}


*/ 