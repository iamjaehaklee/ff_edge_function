#!/bin/bash

# Define the Edge Function URL and the JWT token
DEPLOYED_URL="https://jschbqhrzkdqcpbidqhj.supabase.co/functions/v1/put_chat_message"
JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzY2hicWhyemtkcWNwYmlkcWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NDM3MjMsImV4cCI6MjA1MzAxOTcyM30.0LZdDrL_MvVUOdHQm8quR1xfpWIyxq7MofdaJ_hNRJQ"

# Define the payload
PAYLOAD='{
    "work_room_id": "11111111-1111-1111-1111-111111111111",
    "sender_id": "01ba12d0-da6a-45e0-8535-6d2e49a4f96e",
    "content": "WOW",
    "message_type": "text"
}'

# Make the POST request to the Edge Function endpoint
curl -X POST "$DEPLOYED_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "$PAYLOAD"

echo "Chat message sent successfully."
