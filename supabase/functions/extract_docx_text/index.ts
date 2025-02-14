import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import docx4js from "https://esm.sh/docx4js@3.3.0"; // ✅ 최신 버전 사용

console.log("Edge Function 'extract_docx_text' is running!");

/** DOCX 텍스트 추출 요청을 위한 인터페이스 */
interface DocxExtractRequest {
  file_table_id: string;
  work_room_id: string;
  storage_key: string;
}

/** Supabase Storage에서 DOCX 파일 다운로드 */
async function downloadDocxFile(storageKey: string): Promise<Uint8Array> {
  const supabaseUrl = Deno.env.get("DEV_SUPABASE_URL");
  const supabaseKey = Deno.env.get("DEV_SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const url = `${supabaseUrl}/storage/v1/object/public/work_room_files/${storageKey}`;
  console.log(`Downloading DOCX file from: ${url}`);

  const response = await fetch(url, {
    headers: { "Authorization": `Bearer ${supabaseKey}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to download DOCX file: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/** DOCX 파일에서 요소 유형 감지 + 텍스트 추출 */
async function extractTextFromDocx(docxBuffer: Uint8Array): Promise<{ index: number | null; textType: string; text: string }[]> {
  try {
    const doc = await docx4js.load(new Blob([docxBuffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));

    let extractedElements: { index: number | null; textType: string; text: string }[] = [];
    let elementIndex = 0; // ✅ 기본 문서 내 요소 순서

    doc.content().forEach((element: any) => {
      const text = element.text().trim();
      if (text.length > 0) {
        let textType = "other"; // 기본값: 기타

        // ✅ 요소 유형 감지
        if (element.style && element.style.name) {
          const style = element.style.name.toLowerCase();
          if (style.includes("heading")) {
            textType = "title"; // 제목
          } else if (style.includes("list")) {
            textType = "list"; // 목록
          }
        }

        if (element.type === "table") {
          textType = "table"; // 표
        } else if (element.type === "paragraph") {
          textType = "paragraph"; // 본문
        }

        // ✅ `text_index`는 문서 내 요소의 순서를 저장하지만, 필요 없을 경우 null 허용
        const textIndex = textType === "other" ? null : elementIndex++;
        extractedElements.push({
          index: textIndex,
          textType,
          text,
        });
      }
    });

    return extractedElements;
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    throw new Error("Failed to extract text from DOCX file.");
  }
}

/** Supabase에 요소별 DOCX 텍스트 저장 및 `files.is_text_extracted` 업데이트 */
async function saveExtractedText(request: DocxExtractRequest, extractedElements: { index: number | null; textType: string; text: string }[]) {
  const supabaseUrl = Deno.env.get("DEV_SUPABASE_URL");
  const supabaseKey = Deno.env.get("DEV_SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, supabaseKey);

  const entries = extractedElements.map((element) => ({
    file_table_id: request.file_table_id,
    work_room_id: request.work_room_id,
    storage_key: request.storage_key,
    text_index: element.index, // ✅ 문서 내 순서 (nullable)
    text_type: element.textType, // ✅ 요소 유형 저장
    text_content: element.text,
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("docx_text").insert(entries);
  if (error) throw new Error(`Failed to save extracted text: ${error.message}`);

  // ✅ `is_text_extracted` 값을 true로 업데이트
  const { error: updateError } = await supabase
    .from("files")
    .update({ is_text_extracted: true })
    .eq("id", request.file_table_id);

  if (updateError) throw new Error(`Failed to update is_text_extracted: ${updateError.message}`);
}

/** DOCX 텍스트 추출 실행 */
async function extractDocxText(event: DocxExtractRequest) {
  console.log("Processing DOCX file:", event);

  // ✅ DOCX 파일 다운로드
  const docxBuffer = await downloadDocxFile(event.storage_key);

  // ✅ 문단별 텍스트 및 유형 추출
  const extractedElements = await extractTextFromDocx(docxBuffer);

  // ✅ 데이터베이스에 저장 및 `is_text_extracted` 업데이트
  await saveExtractedText(event, extractedElements);

  console.log("DOCX text extraction completed:", event.file_table_id);
}

/** Deno.serve를 사용한 HTTP 핸들러 */
Deno.serve(async (req) => {
  try {
    const event: DocxExtractRequest = await req.json();
    if (!event.file_table_id || !event.work_room_id || !event.storage_key) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), { status: 400 });
    }
    await extractDocxText(event);
    return new Response(JSON.stringify({ message: "DOCX text extraction started" }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
