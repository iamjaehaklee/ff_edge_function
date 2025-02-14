import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

console.log("Edge Function 'pdf_ocr_file_chunk_kr_naver_clova' is running!");

// ✅ 환경 변수에서 OpenAI 임베딩 함수 URL 및 Supabase Service Role Key 가져오기
const EMBEDDING_FUNCTION_URL = Deno.env.get("EMBEDDING_FUNCTION_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("DEV_SUPABASE_SERVICE_ROLE_KEY");

/** OCR 요청을 위한 인터페이스 */
interface OcrRequest {
  file_table_id: string;
  work_room_id: string; // ✅ 추가
  bucket_name: string;
  storage_key: string;
  file_name?: string;
}

/** PDF 청크 정보를 담는 인터페이스 */
interface PdfChunk {
  chunkBytes: Uint8Array;
  startPage: number;
  pagesCount: number;
}

/** OCR API 결과 정보를 담는 인터페이스 */
interface OCRPageResult {
  pageText: string;
  ocrStatus: string;
  confidenceAvg: number | null;
  convertedImageInfo: any;
  rawResponse: any;
}

/** Supabase Storage에서 파일 다운로드 */
async function downloadFile(bucketName: string, storageKey: string): Promise<Uint8Array> {
  const supabaseUrl = Deno.env.get("DEV_SUPABASE_URL");
  const supabaseKey = Deno.env.get("DEV_SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  // Storage API에서 파일 가져오기 (버킷명 + storageKey 포함)
  const url = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${storageKey}`;
  console.log(`파일 다운로드 URL: ${url}`);

  const response = await fetch(url, {
    headers: { "Authorization": `Bearer ${supabaseKey}` }
  });

  if (!response.ok) {
    throw new Error(`파일 다운로드 실패: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/** PDF를 10페이지 단위로 분할 (각 청크가 50MB 이하) */
async function splitPdfIntoChunks(pdfBuffer: Uint8Array): Promise<PdfChunk[]> {
  console.log("PDF 분할 시작...");
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const totalPages = pdfDoc.getPageCount();
  console.log(`총 페이지 수: ${totalPages}`);

  const maxPagesPerChunk = 10;
  const maxChunkSize = 50 * 1024 * 1024; // 50MB
  const chunks: PdfChunk[] = [];

  let startPage = 0;
  while (startPage < totalPages) {
    let pagesCount = Math.min(maxPagesPerChunk, totalPages - startPage);
    let acceptable = false;

    while (!acceptable && pagesCount > 0) {
      const newPdfDoc = await PDFDocument.create();
      const pageIndices = Array.from({ length: pagesCount }, (_, i) => startPage + i);
      const pagesToCopy = await newPdfDoc.copyPages(pdfDoc, pageIndices);
      pagesToCopy.forEach(page => newPdfDoc.addPage(page));

      const chunkBytes = await newPdfDoc.save();
      console.log(`시도: 페이지 ${startPage + 1} ~ ${startPage + pagesCount}, 크기: ${chunkBytes.length} bytes`);

      if (chunkBytes.length <= maxChunkSize) {
        chunks.push({ chunkBytes, startPage, pagesCount });
        acceptable = true;
        startPage += pagesCount;
      } else {
        pagesCount--;
        if (pagesCount === 0) {
          throw new Error("한 페이지의 크기도 50MB를 초과합니다.");
        }
      }
    }
  }
  return chunks;
}

/** CLOVA OCR API 호출 */
async function callCLOVAOCRForChunk(pdfBuffer: Uint8Array): Promise<OCRPageResult[]> {
  console.log("CLOVA OCR API 호출 시작...");
  const formData = new FormData();
  formData.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), "document.pdf");

  const OCR_SECRET = Deno.env.get("CLOVA_SECRET_KEY")?.trim() || "";
  const OCR_URL = Deno.env.get("CLOVA_INVOKE_URL")?.trim() || "";

  const response = await fetch(OCR_URL, {
    method: "POST",
    headers: { "X-OCR-SECRET": OCR_SECRET },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`OCR API 호출 실패: ${await response.text()}`);
  }

  const result = await response.json();
  return result.images.map((pageResult: any) => ({
    pageText: pageResult.fields?.map((f: any) => f.inferText).join("\n") || "",
    ocrStatus: pageResult.inferResult || "UNKNOWN",
    confidenceAvg: pageResult.fields ? 
      pageResult.fields.reduce((sum: number, f: any) => sum + (f.inferConfidence || 0), 0) / (pageResult.fields.length || 1) 
      : null,
    convertedImageInfo: pageResult.convertedImageInfo || null,
    rawResponse: pageResult
  }));
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


/** OCR 결과 저장 및 files 테이블 업데이트 */
async function storeOcrResults(fileInfo: OcrRequest, ocrResults: OCRPageResult[]) {
  const supabaseUrl = Deno.env.get("DEV_SUPABASE_URL");
  const supabaseKey = Deno.env.get("DEV_SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const entries = ocrResults.map(async (ocrResult, index) => ({
    file_table_id: fileInfo.file_table_id,
    bucket_name: fileInfo.bucket_name,
    storage_key: fileInfo.storage_key,
    work_room_id: fileInfo.work_room_id, // ✅ 추가
    file_name: fileInfo.file_name || "Unknown",
    page_number: index + 1,
    ocr_text: ocrResult.pageText,
    ocr_status: ocrResult.ocrStatus,
    embedding: await getEmbeddingFromOpenAI(ocrResult.pageText), // ✅ OpenAI 임베딩 생성
    confidence_avg: ocrResult.confidenceAvg,
    converted_image_info: ocrResult.convertedImageInfo,
    raw_response: ocrResult.rawResponse,
    created_at: new Date().toISOString()
  }));

  const { error } = await supabase.from("pdf_ocr").insert(entries);
  if (error) throw new Error(`OCR 결과 저장 실패: ${error.message}`);

  // 모든 페이지가 OCR 성공했으면 files 테이블의 is_ocr 업데이트
  if (ocrResults.every(r => r.ocrStatus === "SUCCESS")) {
    await supabase.from("files").update({ is_text_extracted: true }).eq("id", fileInfo.file_table_id);
  }
}

/** OCR 실행 */
async function pdf_ocr_file_chunk_kr_naver_clova(event: OcrRequest) {
  console.log("OCR 요청 수신:", event);
  const pdfBuffer = await downloadFile(event.bucket_name, event.storage_key);
  const pdfChunks = await splitPdfIntoChunks(pdfBuffer);

  const allOcrResults: OCRPageResult[] = [];
  for (const chunk of pdfChunks) {
    const chunkResults = await callCLOVAOCRForChunk(chunk.chunkBytes);
    allOcrResults.push(...chunkResults);
  }

  await storeOcrResults(event, allOcrResults);
  console.log("OCR 처리 완료:", event.file_table_id);
}

/** Deno.serve를 사용한 RPC 스타일 HTTP 핸들러 */
Deno.serve(async (req) => {
  try {
    const event: OcrRequest = await req.json();
    if (!event.file_table_id || !event.work_room_id || !event.storage_key) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), { status: 400 });
    }
    await pdf_ocr_file_chunk_kr_naver_clova(event);
    return new Response(JSON.stringify({ message: "OCR processing started" }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
