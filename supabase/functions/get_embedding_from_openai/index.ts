import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("Edge Function 'get_embedding_from_openai' is running!");

// OpenAI API 설정
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY"); // ✅ 환경 변수에서 OpenAI API 키 가져오기
const OPENAI_EMBEDDING_URL = "https://api.openai.com/v1/embeddings";

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("DEV_SUPABASE_URL");
    const supabaseKey = Deno.env.get("DEV_SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey || !OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing required environment variables" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'text' parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating embedding for text (length: ${text.length} chars)...`);

    // OpenAI API를 사용하여 임베딩 벡터 생성
    const embeddingResponse = await fetch(OPENAI_EMBEDDING_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input: text,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error("Embedding API Error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate embedding" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const embeddingResult = await embeddingResponse.json();
    const embeddingVector = embeddingResult.data[0].embedding;

    console.log(`✅ Embedding generated successfully!`);

    return new Response(
      JSON.stringify({ embedding: embeddingVector }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
