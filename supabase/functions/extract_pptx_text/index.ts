import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import PptxGenJS from "https://esm.sh/pptxgenjs"; // ✅ PPTX 파일을 읽는 라이브러리

console.log("Edge Function 'extract_pptx_text' is running!");

/** PPTX 텍스트 추출 요청을 위한 인터페이스 */
interface PptxExtractRequest {
  file_table_id: string;
  work_room_id: string;
  storage_key: string;
}

/** Supabase Storage에서 PPTX 파일 다운로드 */
async function downloadPptxFile(storageKey: string): Promise<Uint8Array> {
  const supabaseUrl = Deno.env.get("DEV_SUPABASE_URL");
  const supabaseKey = Deno.env.get("DEV_SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const url = `${supabaseUrl}/storage/v1/object/public/work_room_files/${storageKey}`;
  console.log(`Downloading PPTX file from: ${url}`);

  const response = await fetch(url, {
    headers: { "Authorization": `Bearer ${supabaseKey}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to download PPTX file: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/** PPTX 파일에서 슬라이드별 텍스트 추출 */
async function extractTextFromPptx(pptxBuffer: Uint8Array): Promise<{ slide: number; text: string }[]> {
  try {
    const pptx = new PptxGenJS();
    await pptx.load(new Blob([pptxBuffer], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }));

    let extractedSlides: { slide: number; text: string }[] = [];

    pptx.slides.forEach((slide: any, index: number) => {
      const text = slide.getText().trim();
      if (text.length > 0) {
        extractedSlides.push({
          slide: index + 1,
          text,
        });
      }
    });

    return extractedSlides;
  } catch (error) {
    console.error("Error extracting text from PPTX:", error);
    throw new Error("Failed to extract text from PPTX file.");
  }
}

/** Supabase에 슬라이드별 PPTX 텍스트 저장 및 `files.is_text_extracted` 업데이트 */
async function saveExtractedText(request: PptxExtractRequest, extractedSlides: { slide: number; text: string }[]) {
  const supabaseUrl = Deno.env.get("DEV_SUPABASE_URL");
  const supabaseKey = Deno.env.get("DEV_SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, supabaseKey);

  const entries = extractedSlides.map((slide) => ({
    file_table_id: request.file_table_id,
    work_room_id: request.work_room_id,
    storage_key: request.storage_key,
    slide_number: slide.slide, // ✅ 슬라이드 번호 저장
    text_content: slide.text,
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("pptx_text").insert(entries);
  if (error) throw new Error(`Failed to save extracted text: ${error.message}`);

  // ✅ `is_text_extracted` 값을 true로 업데이트
  const { error: updateError } = await supabase
    .from("files")
    .update({ is_text_extracted: true })
    .eq("id", request.file_table_id);

  if (updateError) throw new Error(`Failed to update is_text_extracted: ${updateError.message}`);
}

/** PPTX 텍스트 추출 실행 */
async function extractPptxText(event: PptxExtractRequest) {
  console.log("Processing PPTX file:", event);

  // ✅ PPTX 파일 다운로드
  const pptxBuffer = await downloadPptxFile(event.storage_key);

  // ✅ 슬라이드별 텍스트 추출
  const extractedSlides = await extractTextFromPptx(pptxBuffer);

  // ✅ 데이터베이스에 저장 및 `is_text_extracted` 업데이트
  await saveExtractedText(event, extractedSlides);

  console.log("PPTX text extraction completed:", event.file_table_id);
}

/** Deno.serve를 사용한 HTTP 핸들러 */
Deno.serve(async (req) => {
  try {
    const event: PptxExtractRequest = await req.json();
    if (!event.file_table_id || !event.work_room_id || !event.storage_key) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), { status: 400 });
    }
    await extractPptxText(event);
    return new Response(JSON.stringify({ message: "PPTX text extraction started" }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
