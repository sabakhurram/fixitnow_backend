const { BrevoClient } = require("@getbrevo/brevo");

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

const sender = {
  name: process.env.BREVO_SENDER_NAME,
  email: process.env.BREVO_SENDER_EMAIL,
};

const sendWelcomeEmail = async ({ email, name }) => {
  try {
    const response = await brevo.transactionalEmails.sendTransacEmail({
      sender,
      to: [
        {
          email,
          name: name || "Customer",
        },
      ],
      subject: "Welcome to FixItNow",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; color: #222;">
          
          <h1 style="margin-bottom: 10px;">
            Welcome to FixItNow!
          </h1>

          <p style="font-size: 16px;">
            Hi ${name || "there"},
          </p>

          <p style="font-size: 16px; line-height: 1.6;">
            Thank you for creating your FixItNow account.
            We're happy to have you with us.
          </p>

          <p style="font-size: 16px; line-height: 1.6;">
            You can now use FixItNow to manage your solar service
            requests, inspections, repairs, and orders.
          </p>

          <p style="font-size: 16px; line-height: 1.6;">
            If you need any assistance, we're here to help.
          </p>

          <p style="margin-top: 30px;">
            Best regards,<br />
            <strong>FixItNow Team</strong>
          </p>

        </div>
      `,
    });

    console.log("Welcome email sent successfully:", response);

    return response;
  } catch (error) {
    console.error("Brevo welcome email error:", error);
    throw error;
  }
};

module.exports = {
  sendWelcomeEmail,
};