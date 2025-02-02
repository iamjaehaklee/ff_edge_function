#!/bin/bash

# Edge Function URL
LOCAL_URL="http://127.0.0.1:54321/functions/v1/get_work_room_details"

DEPLOYED_URL="https://jschbqhrzkdqcpbidqhj.supabase.co/functions/v1/get_work_room_details"



# JSON 데이터: work_room_id 설정
DATA='{"work_room_id":"21cd71b0-b033-4d2a-b2a7-e45ad7ada332"}'

# cURL 명령어 실행 : 여기서의 Authorization은 JWT 토큰을 넣어야 합니다. Supabase에서 발급받은 토큰을 넣어주세요.
curl -X POST $DEPLOYED_URL \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzY2hicWhyemtkcWNwYmlkcWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NDM3MjMsImV4cCI6MjA1MzAxOTcyM30.0LZdDrL_MvVUOdHQm8quR1xfpWIyxq7MofdaJ_hNRJQ" \
  -d "$DATA"
