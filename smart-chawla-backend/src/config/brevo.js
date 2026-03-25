const SibApiV3Sdk = require("sib-api-v3-sdk");

// Debug: Check if API key exists
console.log("🔍 BREVO_API_KEY exists:", !!process.env.BREVO_API_KEY);
console.log("🔍 BREVO_API_KEY length:", process.env.BREVO_API_KEY?.length);

if (!process.env.BREVO_API_KEY) {
  console.error("❌ ERROR: BREVO_API_KEY is not set!");
}

// Initialize client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKeyAuth = defaultClient.authentications["api-key"];

// Set the API key
apiKeyAuth.apiKey = process.env.BREVO_API_KEY;

// Create API instance
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async ({
  to,
  subject,
  htmlContent,
  textContent,
  attachments = [],
}) => {
  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = textContent || "";
    sendSmtpEmail.sender = {
      name: process.env.FROM_NAME || "Smart Chawla",
      email: process.env.FROM_EMAIL || "noreply@smartchawla.com",
    };
    sendSmtpEmail.to = Array.isArray(to)
      ? to.map((email) => ({ email }))
      : [{ email: to }];

    if (attachments.length > 0) {
      sendSmtpEmail.attachment = attachments;
    }

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log(`✅ Email sent successfully to: ${to}`);
    return {
      success: true,
      messageId: data.messageId,
      data: data,
    };
  } catch (error) {
    console.error(`❌ Brevo API Error:`, error.response?.body || error.message);
    throw error;
  }
};

// Email template wrapper
const getEmailTemplate = (content) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
        .header img { max-width: 150px; }
        .content { padding: 40px 30px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
        .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        @media only screen and (max-width: 600px) {
          .content { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: white; margin: 0;">Smart Chawla</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Smart Chawla. All rights reserved.</p>
          <p>আমাদের সেবা ব্যবহার করার জন্য ধন্যবাদ</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const sender = {
  email: process.env.FROM_EMAIL || "noreply@smartchawla.com",
  name: process.env.FROM_NAME || "Smart Chawla",
};

module.exports = { sendEmail, getEmailTemplate, sender };
