import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("🚀 Edge Function 'send_workroom_request_email' is running!");

Deno.serve(async (req) => {
  console.log("📥 Received a request for 'send_workroom_request_email'");

  const sendgridApiKey = Deno.env.get("DEV_SENDGRID_API_KEY");
  const senderEmail = Deno.env.get("DEV_SENDGRID_SENDER_EMAIL");

  if (!sendgridApiKey || !senderEmail) {
    return new Response(
      JSON.stringify({
        error: "Missing SendGrid environment variables.",
        details: {
          SENDGRID_API_KEY: !!sendgridApiKey,
          SENDGRID_SENDER_EMAIL: !!senderEmail,
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const rawBody = (await req.text()).trim();
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON body",
          details: parseError.message,
          hint: "Ensure JSON is correctly formatted and does not contain trailing commas.",
          received_body: rawBody,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { recipient_email, requester_name, email_type, work_room_id, work_room_title, work_room_description, work_room_created_at } = body;

    if (!recipient_email || !requester_name || !email_type || !work_room_id || !work_room_title || !work_room_description || !work_room_created_at) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters",
          details: {
            recipient_email,
            requester_name,
            email_type,
            work_room_id,
            work_room_title,
            work_room_description,
            work_room_created_at,
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let subject, bodyContent;

    if (email_type === "workroom_request") {
      subject = `You've been invited to join ${work_room_title}!`;
      bodyContent = `Workroom Invitation\n${requester_name} has invited you to join the workroom: ${work_room_title}.\n\n${work_room_description}\n\nCreated on: ${new Date(work_room_created_at).toLocaleDateString()}\n\nJoin now: https://legalff.com/workroom/${work_room_id}`;
    } else {
      subject = "You've received a workroom request!";
      bodyContent = `New Workroom Request\n${requester_name} has sent you a request to join the workroom: ${work_room_title}.\n\n${work_room_description}\n\nCreated on: ${new Date(work_room_created_at).toLocaleDateString()}\n\nJoin now: https://legalff.com/workroom/${work_room_id}`;
    }

    const emailPayload = {
      personalizations: [
        {
          to: [{ email: recipient_email }],
        },
      ],
      from: { email: senderEmail },
      subject: subject,
      content: [{ type: "text/plain", value: bodyContent }],
    };

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const responseText = await response.text();
    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "Failed to send email",
          details: responseText,
        }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }

    return new Response(JSON.stringify({ success: true, response: responseText }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
      }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
