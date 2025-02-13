import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// 🔒 환경 변수에서 OCR API URL과 Secret Key 가져오기
const CLOVA_OCR_URL = Deno.env.get("CLOVA_INVOKE_URL") ?? "";
const CLOVA_SECRET_KEY = Deno.env.get("CLOVA_SECRET_KEY") ?? "";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      console.error("❌ [Edge Function] 요청 본문에 'image' 필드가 없음.");
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("✅ [Edge Function] OCR 요청 수신. 이미지 데이터 크기:", image.length, "bytes");

    const requestBody = {
      version: "V2", // ✅ 네이버 클로바 OCR에서 요구하는 버전 추가
      requestId: "ocr_request",
      timestamp: Date.now(),
      images: [
        {
          name: "ocr_image", // ✅ name 필드 추가 (네이버 클로바 API 요구사항)
          format: "png",
          data: image,
        },
      ],
    };

    console.log("📤 [Edge Function] 네이버 OCR API에 전송할 요청 본문:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(CLOVA_OCR_URL, {
      method: "POST",
      headers: {
        "X-OCR-SECRET": CLOVA_SECRET_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("❌ [Edge Function] 네이버 OCR API 요청 실패. 상태 코드:", response.status);
      const errorBody = await response.text();
      console.error("📄 응답 본문:", errorBody);
      return new Response(
        JSON.stringify({ error: "OCR API request failed", status: response.status }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const ocrResult = await response.json();
    console.log("✅ [Edge Function] OCR 성공! 결과:", JSON.stringify(ocrResult, null, 2));

    return new Response(JSON.stringify(ocrResult), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ [Edge Function] 예외 발생:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
