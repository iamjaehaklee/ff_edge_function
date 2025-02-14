import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("Edge Function 'extract_hwp_text' is running!");

// ✅ 환경 변수에서 OpenAI 임베딩 함수 URL 및 Supabase Service Role Key 가져오기
const EMBEDDING_FUNCTION_URL = Deno.env.get("EMBEDDING_FUNCTION_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

/** HWP 텍스트 추출 요청을 위한 인터페이스 */
interface HwpExtractRequest {
  file_table_id: string;
  work_room_id: string;
  storage_key: string;
}

/** Supabase Storage에서 HWP 파일 다운로드 */
async function downloadHwpFile(storageKey: string): Promise<Uint8Array> {
  const supabaseUrl = Deno.env.get("DEV_SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const url = `${supabaseUrl}/storage/v1/object/public/work_room_files/${storageKey}`;
  console.log(`Downloading HWP file from: ${url}`);

  const response = await fetch(url, {
    headers: { "Authorization": `Bearer ${supabaseKey}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to download HWP file: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/** OpenAI를 사용하여 텍스트 임베딩 생성 */
async function getEmbeddingFromOpenAI(text: string): Promise<number[]> {
  if (!EMBEDDING_FUNCTION_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing embedding function URL or Supabase Service Role Key in environment variables.");
  }

  const response = await fetch(EMBEDDING_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, // ✅ Service Role Key 사용
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate embedding: ${await response.text()}`);
  }

  const result = await response.json();
  return result.embedding;
}

/** HWP 파일에서 요소 유형 감지 + 텍스트 추출 */
async function extractTextFromHwp(hwpBuffer: Uint8Array): Promise<{ index: number | null; textType: string; text: string }[]> {
  try {
    const hwp = await hwpjs.load(hwpBuffer);
    const extractedElements: { index: number | null; textType: string; text: string }[] = [];

    let elementIndex = 0; // ✅ 문서 내 요소 순서

    hwp.sections.forEach((section: any) => {
      section.paragraphs.forEach((paragraph: any) => {
        const text = paragraph.text.trim();
        if (text.length > 0) {
          let textType = "paragraph"; // 기본값: 본문 텍스트

          // ✅ 요소 유형 감지
          if (paragraph.style) {
            if (paragraph.style.bold || paragraph.style.fontSize > 12) {
              textType = "title"; // 제목
            } else if (paragraph.style.list) {
              textType = "list"; // 목록
            }
          }

          if (paragraph.table) {
            textType = "table"; // 표
          }

          // ✅ text_index는 문서 내 요소의 순서를 저장하지만, 필요 없을 경우 null 허용
          const textIndex = textType === "other" ? null : elementIndex++;
          extractedElements.push({
            index: textIndex,
            textType,
            text,
          });
        }
      });
    });

    return extractedElements;
  } catch (error) {
    console.error("Error extracting text from HWP:", error);
    throw new Error("Failed to extract text from HWP file.");
  }
}

/** Supabase에 추출한 HWP 텍스트 및 임베딩 저장 */
async function saveExtractedText(
  request: HwpExtractRequest,
  extractedElements: { index: number | null; textType: string; text: string }[]
) {
  const supabaseUrl = Deno.env.get("DEV_SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, supabaseKey);

  const entries = await Promise.all(
    extractedElements.map(async (element) => {
      const embeddingVector = await getEmbeddingFromOpenAI(element.text); // ✅ OpenAI 임베딩 Edge Function 호출
      return {
        file_table_id: request.file_table_id,
        work_room_id: request.work_room_id,
        storage_key: request.storage_key,
        text_index: element.index,
        text_type: element.textType,
        text_content: element.text,
        embedding: embeddingVector, // ✅ 임베딩 저장
        created_at: new Date().toISOString(),
      };
    })
  );

  const { error } = await supabase.from("hwp_text").insert(entries);
  if (error) throw new Error(`Failed to save extracted text: ${error.message}`);

  // ✅ `is_text_extracted` 값을 true로 업데이트
  const { error: updateError } = await supabase
    .from("files")
    .update({ is_text_extracted: true })
    .eq("id", request.file_table_id);

  if (updateError) throw new Error(`Failed to update is_text_extracted: ${updateError.message}`);
}

/** HWP 텍스트 추출 실행 */
async function extractHwpText(event: HwpExtractRequest) {
  console.log("Processing HWP file:", event);

  // ✅ HWP 파일 다운로드
  const hwpBuffer = await downloadHwpFile(event.storage_key);

  // ✅ HWP 파일에서 텍스트 추출 (라이브러리 활용)
  const extractedElements = await extractTextFromHwp(hwpBuffer);

  // ✅ 데이터베이스에 저장 및 `is_text_extracted` 업데이트
  await saveExtractedText(event, extractedElements);

  console.log("HWP text extraction and embedding completed:", event.file_table_id);
}

/** Deno.serve를 사용한 HTTP 핸들러 */
Deno.serve(async (req) => {
  try {
    const event: HwpExtractRequest = await req.json();
    if (!event.file_table_id || !event.work_room_id || !event.storage_key) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), { status: 400 });
    }
    await extractHwpText(event);
    return new Response(JSON.stringify({ message: "HWP text extraction and embedding started" }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
