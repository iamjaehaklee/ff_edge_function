#!/bin/bash

# Edge Function URL
LOCAL_URL="http://127.0.0.1:54321/functions/v1/get_work_rooms_by_user_id"

DEPLOYED_URL="https://jschbqhrzkdqcpbidqhj.supabase.co/functions/v1/get_work_rooms_by_user_id"



# JSON 데이터: user_id 설정
DATA='{"user_id":"01ba12d0-da6a-45e0-8535-6d2e49a4f96e"}'

# cURL 명령어 실행 : 여기서의 Authorization은 JWT 토큰을 넣어야 합니다. Supabase에서 발급받은 토큰을 넣어주세요.
curl -X POST $DEPLOYED_URL \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzY2hicWhyemtkcWNwYmlkcWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NDM3MjMsImV4cCI6MjA1MzAxOTcyM30.0LZdDrL_MvVUOdHQm8quR1xfpWIyxq7MofdaJ_hNRJQ" \
  -d "$DATA"
