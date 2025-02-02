#!/bin/bash

# Edge Function URL
URL="http://127.0.0.1:54321/functions/v1/hello"

# JSON 데이터: user_id 설정
DATA='{"name":"JACK"}'

# cURL 명령어 실행
curl -X POST $URL \
  -H "Content-Type: application/json" \
  -d "$DATA"