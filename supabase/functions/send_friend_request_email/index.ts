import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

console.log("🚀 Edge Function 'send_friend_request_email' is running!");

Deno.serve(async (req) => {
  console.log("📥 Received a request for 'send_friend_request_email'");

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
    const rawBody = await req.text();
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON body",
          details: parseError.message,
          received_body: rawBody,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract required parameters
    const { recipient_email, requester_name, email_type } = body;

    if (!recipient_email || !requester_name || !email_type) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters",
          details: {
            recipient_email,
            requester_name,
            email_type,
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let subject, bodyContent;

    if (email_type === "friend_request") {
      subject = "You have a new friend request!";
      bodyContent = `New Friend Request\n${requester_name} has sent you a friend request. Please check your account to accept or reject it.`;
    } else {
      subject = "You've been invited to Legal FactFinder!";
      bodyContent = `Join Legal FactFinder\n${requester_name} has invited you to join Legal FactFinder. Click the link below to sign up and start collaborating.\nhttps://legalff.com/register`;
    }

    // ✅ Send email via SendGrid
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
