import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("Edge Function 'get_chat_messages' is running!");

// Use Deno.serve
Deno.serve(async (req) => {
  // Load Supabase environment variables
  const supabaseUrl = Deno.env.get("DEV_SUPABASE_URL");
  const supabaseKey = Deno.env.get("DEV_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseKey) {
    return new Response("Missing Supabase environment variables", { status: 500 });
  }

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const work_room_id = searchParams.get("work_room_id");
    const limit = Number(searchParams.get("limit") || 20);
    const offset = Number(searchParams.get("offset") || 0);

    if (!work_room_id) {
      return new Response("Missing 'work_room_id' parameter", { status: 400 });
    }

    // Call the RPC `get_chat_messages`
    const { data, error } = await supabase.rpc("get_chat_messages", {
      p_work_room_id: work_room_id,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error("Error calling RPC:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Return data as JSON
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

/*

[
  {
    "id": "7724a4bc-4098-4494-b4ec-60e11ebac296",
    "work_room_id": "21cd71b0-b033-4d2a-b2a7-e45ad7ada332",
    "sender_id": "be4979ae-1b1e-4f8c-b2dc-cfeb211a8d82",
    "parent_message_id": null,
    "content": "Let me know if you need help with this case.",
    "message_type": "text",
    "thread_count": 0,
    "has_attachments": false,
    "attachment_file_url": null,
    "attachment_file_type": null,
    "highlight": null,
    "created_at": "2022-11-04T21:32:44+00:00",
    "updated_at": "2023-11-11T00:02:07+00:00",
    "annotation_id": null,
    "ocr_text": null,
    "annotation_image_file_url": null,
    "is_system": false,
    "system_event_type": null,
    "reply_to_message_id": null,
    "reply_to_message_content": null,
    "reply_to_message_sender_id": null,
    "reply_to_message_created_at": null,
    "image_file_id": null
  },
  {
    "id": "caef7754-1670-45ea-94e7-d0633968e6cf",
    "work_room_id": "21cd71b0-b033-4d2a-b2a7-e45ad7ada332",
    "sender_id": "a2b48c39-ddc4-4101-a2ed-8f76e03d2081",
    "parent_message_id": null,
    "content": "Hi, let's discuss the next steps.",
    "message_type": "text",
    "thread_count": 0,
    "has_attachments": false,
    "attachment_file_url": null,
    "attachment_file_type": null,
    "highlight": null,
    "created_at": "2022-06-13T04:12:29+00:00",
    "updated_at": "2024-04-25T04:46:06+00:00",
    "annotation_id": null,
    "ocr_text": null,
    "annotation_image_file_url": null,
    "is_system": false,
    "system_event_type": null,
    "reply_to_message_id": null,
    "reply_to_message_content": null,
    "reply_to_message_sender_id": null,
    "reply_to_message_created_at": null,
    "image_file_id": null
  },
  {
    "id": "9720e2e5-5424-4794-a8e7-baa9a66df435",
    "work_room_id": "21cd71b0-b033-4d2a-b2a7-e45ad7ada332",
    "sender_id": "df28a66a-ce3a-41c0-b397-8532f8419d57",
    "parent_message_id": null,
    "content": "Can you clarify the deadline for this task?",
    "message_type": "text",
    "thread_count": 0,
    "has_attachments": false,
    "attachment_file_url": null,
    "attachment_file_type": null,
    "highlight": null,
    "created_at": "2021-06-01T17:37:21+00:00",
    "updated_at": "2020-04-24T23:44:10+00:00",
    "annotation_id": null,
    "ocr_text": null,
    "annotation_image_file_url": null,
    "is_system": false,
    "system_event_type": null,
    "reply_to_message_id": null,
    "reply_to_message_content": null,
    "reply_to_message_sender_id": null,
    "reply_to_message_created_at": null,
    "image_file_id": null
  },
  {
    "id": "e5a1a027-7449-4c1f-97a3-04a02f8f170d",
    "work_room_id": "21cd71b0-b033-4d2a-b2a7-e45ad7ada332",
    "sender_id": "ee6bd55d-8d0c-4636-9a4d-d7fd236df08b",
    "parent_message_id": null,
    "content": "Great job on the presentation!",
    "message_type": "text",
    "thread_count": 0,
    "has_attachments": false,
    "attachment_file_url": null,
    "attachment_file_type": null,
    "highlight": null,
    "created_at": "2020-10-03T09:20:34+00:00",
    "updated_at": "2023-03-05T22:41:52+00:00",
    "annotation_id": null,
    "ocr_text": null,
    "annotation_image_file_url": null,
    "is_system": false,
    "system_event_type": null,
    "reply_to_message_id": null,
    "reply_to_message_content": null,
    "reply_to_message_sender_id": null,
    "reply_to_message_created_at": null,
    "image_file_id": null
  },
  {
    "id": "2f8ee1f1-4de9-468b-bcb2-fcebe06897fb",
    "work_room_id": "21cd71b0-b033-4d2a-b2a7-e45ad7ada332",
    "sender_id": "df28a66a-ce3a-41c0-b397-8532f8419d57",
    "parent_message_id": null,
    "content": "Please review the attached document.",
    "message_type": "text",
    "thread_count": 0,
    "has_attachments": false,
    "attachment_file_url": null,
    "attachment_file_type": null,
    "highlight": null,
    "created_at": "2020-03-25T04:03:24+00:00",
    "updated_at": "2021-07-06T04:58:34+00:00",
    "annotation_id": null,
    "ocr_text": null,
    "annotation_image_file_url": null,
    "is_system": false,
    "system_event_type": null,
    "reply_to_message_id": null,
    "reply_to_message_content": null,
    "reply_to_message_sender_id": null,
    "reply_to_message_created_at": null,
    "image_file_id": null
  }
]


*/ 