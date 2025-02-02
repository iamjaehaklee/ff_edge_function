#!/bin/bash

# Define the Edge Function URL and the JWT token
DEPLOYED_URL="https://jschbqhrzkdqcpbidqhj.supabase.co/functions/v1/send_friend_request_email"
JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzY2hicWhyemtkcWNwYmlkcWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NDM3MjMsImV4cCI6MjA1MzAxOTcyM30.0LZdDrL_MvVUOdHQm8quR1xfpWIyxq7MofdaJ_hNRJQ"

# Define the payload
PAYLOAD='{
    "recipient_email": "iamjaehaklee@gmail.com",
    "requester_name": "ME",
    "email_type": "invite"
}'

# Make the POST request to the Edge Function endpoint
curl -X POST "$DEPLOYED_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "$PAYLOAD"

echo "Chat message sent successfully."
