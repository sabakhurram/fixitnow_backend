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

const sendCustomerReminderEmail = async ({
  email,
  customerName,
  technicianName,
  reminderType,
  customMessage,
  scheduledDate,
  scheduledTime,
  serviceTitle,
}) => {
  try {
    const subject = reminderType || "Service Appointment Reminder - FixItNow";
    const response = await brevo.transactionalEmails.sendTransacEmail({
      sender,
      to: [
        {
          email,
          name: customerName || "Valued Customer",
        },
      ],
      subject: `[FixItNow] ${subject}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; color: #222; background: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0;">
          <div style="border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px;">
            <h1 style="color: #0284c7; margin: 0; font-size: 24px;">FixItNow Service Alert</h1>
            <p style="color: #666; margin: 4px 0 0 0; font-size: 14px;">Smart Solar Care & Field Support</p>
          </div>

          <p style="font-size: 16px;">Dear <strong>${customerName || "Customer"}</strong>,</p>

          <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 8px 0; color: #0369a1; font-size: 17px;">${reminderType}</h3>
            <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #334155;">
              ${customMessage || "This is a courtesy reminder regarding your scheduled solar service with our technical team."}
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            ${serviceTitle ? `<tr><td style="padding: 8px; color: #666; border-bottom: 1px solid #f1f5f9;">Service:</td><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f1f5f9;">${serviceTitle}</td></tr>` : ''}
            ${technicianName ? `<tr><td style="padding: 8px; color: #666; border-bottom: 1px solid #f1f5f9;">Assigned Technician:</td><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f1f5f9;">${technicianName}</td></tr>` : ''}
            ${scheduledDate ? `<tr><td style="padding: 8px; color: #666; border-bottom: 1px solid #f1f5f9;">Date:</td><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f1f5f9;">${scheduledDate}</td></tr>` : ''}
            ${scheduledTime ? `<tr><td style="padding: 8px; color: #666; border-bottom: 1px solid #f1f5f9;">Time Window:</td><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f1f5f9;">${scheduledTime}</td></tr>` : ''}
          </table>

          <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-top: 25px;">
            Please ensure clear access to your solar inverter, rooftop, and electrical panel at the scheduled time. If you need to reschedule, please contact our support team.
          </p>

          <div style="border-top: 1px solid #e2e8f0; margin-top: 25px; padding-top: 15px; font-size: 13px; color: #94a3b8;">
            Best regards,<br />
            <strong>FixItNow Technical Operations Team</strong>
          </div>
        </div>
      `,
    });

    console.log("Customer reminder email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Brevo reminder email error:", error);
    throw error;
  }
};

const sendTechnicianAssignmentEmail = async ({
  email,
  technicianName,
  customerName,
  serviceType,
  serviceAddress,
  scheduledDate,
  scheduledTime,
}) => {
  try {
    const response = await brevo.transactionalEmails.sendTransacEmail({
      sender,
      to: [
        {
          email,
          name: technicianName || "Technician",
        },
      ],
      subject: `[FixItNow Assignment] New ${serviceType.toUpperCase()} Job Assigned`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; color: #222; background: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0;">
          <h2 style="color: #0284c7; margin-top: 0;">New Service Dispatched</h2>
          <p>Hi <strong>${technicianName}</strong>,</p>
          <p>You have been assigned a new service ticket by the operations administration.</p>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Service Type:</strong> ${serviceType}</p>
            <p style="margin: 5px 0;"><strong>Customer:</strong> ${customerName}</p>
            <p style="margin: 5px 0;"><strong>Location / Address:</strong> ${serviceAddress}</p>
            <p style="margin: 5px 0;"><strong>Target Date / Time:</strong> ${scheduledDate || "As soon as possible"} - ${scheduledTime || "Flexible"}</p>
          </div>

          <p>Please log in to your <a href="http://localhost:5173/technician/dashboard" style="color: #0284c7; font-weight: bold;">Technician Portal</a> to review job details, contact the customer, and update progress.</p>
          
          <p style="margin-top: 30px;">Best regards,<br/><strong>FixItNow Dispatch Team</strong></p>
        </div>
      `,
    });
    return response;
  } catch (error) {
    console.error("Technician assignment email error:", error);
    // Non-blocking
    return null;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendCustomerReminderEmail,
  sendTechnicianAssignmentEmail,
};