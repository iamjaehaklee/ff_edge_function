#!/bin/bash

# Edge Function URL (Local)
LOCAL_URL="http://127.0.0.1:54321/functions/v1/get_chat_messages"
DEPLOYED_URL="https://jschbqhrzkdqcpbidqhj.supabase.co/functions/v1/get_chat_messages"

JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzY2hicWhyemtkcWNwYmlkcWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NDM3MjMsImV4cCI6MjA1MzAxOTcyM30.0LZdDrL_MvVUOdHQm8quR1xfpWIyxq7MofdaJ_hNRJQ"

WORK_ROOM_ID="21cd71b0-b033-4d2a-b2a7-e45ad7ada332"
LIMIT=2
OFFSET=0

# cURL command to call the Edge Function
curl -X GET "$LOCAL_URL?work_room_id=$WORK_ROOM_ID&limit=$LIMIT&offset=$OFFSET" \
  -H "Authorization: Bearer $JWT_TOKEN"
