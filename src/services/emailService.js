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
const sendOrderConfirmationEmail = async ({
  email,
  name,
  orderId,
  items,
  totalAmount,
  paymentMethod,
  shippingAddress,
}) => {
  try {
    const itemsHtml = items
      .map(
        (item) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">
              ${item.name || "Product"}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">
              ${item.quantity}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">
              ${Number(item.price || 0).toFixed(2)}
            </td>
          </tr>
        `
      )
      .join("");

    const response =
      await brevo.transactionalEmails.sendTransacEmail({
        sender,

        to: [
          {
            email,
            name: name || "Customer",
          },
        ],

        subject: `FixItNow Order Confirmation - #${orderId}`,

        htmlContent: `
          <div style="
            font-family: Arial, sans-serif;
            max-width: 650px;
            margin: auto;
            padding: 30px;
            color: #222;
          ">

            <h1 style="margin-bottom: 10px;">
              Order Confirmed!
            </h1>

            <p style="font-size: 16px;">
              Hi ${name || "there"},
            </p>

            <p style="font-size: 16px; line-height: 1.6;">
              Thank you for your order. We've successfully received it
              and it is now being processed.
            </p>

            <div style="
              background: #f5f5f5;
              padding: 15px;
              margin: 20px 0;
              border-radius: 8px;
            ">
              <strong>Order ID:</strong> #${orderId}<br />
              <strong>Payment Method:</strong> ${paymentMethod}<br />
              <strong>Shipping Address:</strong> ${shippingAddress}
            </div>

            <h2>Order Details</h2>

            <table style="
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            ">
              <thead>
                <tr>
                  <th style="padding: 10px; text-align: left;">
                    Product
                  </th>
                  <th style="padding: 10px; text-align: center;">
                    Quantity
                  </th>
                  <th style="padding: 10px; text-align: right;">
                    Price
                  </th>
                </tr>
              </thead>

              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="
              text-align: right;
              margin-top: 20px;
              font-size: 18px;
            ">
              <strong>
                Total: ${Number(totalAmount).toFixed(2)}
              </strong>
            </div>

            <p style="
              margin-top: 30px;
              font-size: 16px;
              line-height: 1.6;
            ">
              We'll keep you updated about your order.
            </p>

            <p>
              Best regards,<br />
              <strong>FixItNow Team</strong>
            </p>

          </div>
        `,
      });

    console.log(
      "Order confirmation email sent successfully:",
      response
    );

    return response;
  } catch (error) {
    console.error(
      "Brevo order confirmation email error:",
      error
    );

    throw error;
  }
};
module.exports = {
  sendWelcomeEmail,
    sendOrderConfirmationEmail,
};