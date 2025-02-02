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


    // Supabase RPC 호출 (get_user_notifications)
    const { data, error } = await supabase.rpc("get_user_notifications", {
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
      JSON.stringify({ notifications: data }),
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
    "id": "f4e87b59-f87f-419a-8dc0-ca4fb15a0d99",
    "user_id": "01ba12d0-da6a-45e0-8535-6d2e49a4f96e",
    "notification_type": "lawyer_verified",
    "related_id": "01ba12d0-da6a-45e0-8535-6d2e49a4f96e",
    "content": "Anna Lee 변호사님, 인증이 완료되었습니다. 이제부터 변호사 회원 기능 사용이 가능합니다.",
    "is_read": false,
    "created_at": "2025-01-21T14:29:53.647007+00:00",
    "updated_at": "2025-01-21T14:29:53.647007+00:00",
    "title": "변호사 인증 완료"
  },
  {
    "id": "33424f92-3279-4d6a-9293-31f671d7f546",
    "user_id": "01ba12d0-da6a-45e0-8535-6d2e49a4f96e",
    "notification_type": "friendship_confirmed",
    "related_id": "3c827940-4a97-4b5e-91f8-4fb9d1f8d710",
    "content": "Ali Khan님과 친구 관계가 성립되었습니다.",
    "is_read": false,
    "created_at": "2025-01-21T14:36:30.864247+00:00",
    "updated_at": "2025-01-21T14:36:30.864247+00:00",
    "title": "친구 관계 성립"
  }
]
  
*/ 