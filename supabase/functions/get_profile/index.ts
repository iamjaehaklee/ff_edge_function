 import { createClient } from "https://esm.sh/@supabase/supabase-js";




Deno.serve(async (req) => {
  console.log("Request received:", req);

  try {
    // 요청에서 JSON 데이터 추출
    const { user_id_param } = await req.json();

    // user_id 확인
    if (!user_id_param) {
      return new Response(
        JSON.stringify({ error: "Missing user_id_param" }),
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


    // Supabase RPC 호출 (get_profile)
    const { data, error } = await supabase.rpc("get_profile", {
      user_id_param, // Stored Procedure의 매개변수로 전달
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
      JSON.stringify({ profile : data }),
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
  "profile": {
    "user": {
      "id": "6d0790c3-a6d6-4739-881a-b0c428bcd6e0",
      "username": "n844tphb",
      "email": "n844tphb@email.com",
      "is_lawyer": false,
      "profile_picture_url": "Sample text 736",
      "bio": "Sample text 463",
      "country": "Japan",
      "status": "inactive",
      "created_at": "2022-12-03T02:48:50+00:00",
      "updated_at": "2023-02-11T18:17:03+00:00"
    },
    "lawyer_profile": null,
    "lawyer_licenses": null
  }
}

{
  "profile": {
    "user": {
      "id": "01ba12d0-da6a-45e0-8535-6d2e49a4f96e",
      "username": "user_006",
      "email": "user006@example.com",
      "is_lawyer": true,
      "profile_picture_url": "https://example.com/profiles/6.png",
      "bio": "Hello, I am user 006!",
      "country": "South Korea",
      "status": "offline",
      "created_at": "2025-01-21T07:34:22.62714+00:00",
      "updated_at": "2025-01-21T07:34:22.62714+00:00"
    },
    "lawyer_profile": {
      "lawyer_profile_id": "01ba12d0-da6a-45e0-8535-6d2e49a4f96e",
      "practice_areas": null,
      "education": null,
      "law_firm": "Firm A",
      "biography": "Experienced corporate lawyer",
      "certifications": null,
      "languages": null,
      "is_verified": true
    },
    "lawyer_licenses": [
      {
        "license_id": "aca7865a-8915-4f26-ab84-73745bce3446",
        "license_country": "USA",
        "license_state": "California",
        "license_year": 2020,
        "license_title": "Senior Lawyer",
        "created_at": "2023-01-01T10:00:00+00:00",
        "updated_at": "2023-01-10T15:00:00+00:00"
      }
    ]
  }
}

*/ 