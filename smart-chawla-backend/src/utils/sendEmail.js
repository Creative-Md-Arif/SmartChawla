const {
  sendEmail: brevoSendEmail,
  getEmailTemplate,
  sender,
} = require("../config/brevo");

const { convert } = require("html-to-text");
// Send email wrapper with retry logic
const sendEmail = async ({
  to,
  subject,
  htmlContent,
  textContent,
  attachments = [],
  retries = 3,
}) => {
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      const result = await brevoSendEmail({
        to,
        subject,
        htmlContent,
        textContent:
        textContent || convert(htmlContent, { wordwrap: 130 }) || " ",
        attachments,
      });
      return result;
    } catch (error) {
      lastError = error;
      console.error(`Email send attempt ${i + 1} failed:`, error.message);

      // Wait before retry (exponential backoff)
      if (i < retries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 1000),
        );
      }
    }
  }

  throw lastError;
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  const content = `
    <h2>Welcome to Smart Chawla!</h2>
    <p>Hi ${user.fullName},</p>
    <p>We're thrilled to have you join our community of learners and shoppers.</p>
    <p>With Smart Chawla, you can:</p>
    <ul>
      <li>Explore premium courses taught by industry experts</li>
      <li>Shop for quality products at competitive prices</li>
      <li>Track your learning progress</li>
      <li>Get exclusive deals and discounts</li>
    </ul>
    <a href="${process.env.FRONTEND_URL}/shop" class="button">Start Shopping</a>
    <a href="${process.env.FRONTEND_URL}/courses" class="button">Explore Courses</a>
  `;

  

  return await sendEmail({
    to: user.email,
    subject: "Welcome to Smart Chawla!",
    htmlContent: getEmailTemplate(content),
    textContent,
  });
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (user, order) => {
  const itemsList = order.items
    .map(
      (item) => `
    <tr>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>৳${item.priceAtPurchase}</td>
      <td>৳${item.quantity * item.priceAtPurchase}</td>
    </tr>
  `,
    )
    .join("");

  const content = `
    <h2>Order Confirmation</h2>
    <p>Hi ${user.fullName},</p>
    <p>Thank you for your order! We've received your order and will process it soon.</p>
    <p><strong>Order Number:</strong> ${order.orderNumber}</p>
    <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString("bn-BD")}</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="padding: 10px; text-align: left;">Item</th>
          <th style="padding: 10px; text-align: left;">Qty</th>
          <th style="padding: 10px; text-align: left;">Price</th>
          <th style="padding: 10px; text-align: left;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsList}
      </tbody>
    </table>
    <p><strong>Subtotal:</strong> ৳${order.totalAmount}</p>
    ${order.discountAmount > 0 ? `<p><strong>Discount:</strong> -৳${order.discountAmount}</p>` : ""}
    <p><strong>Total:</strong> ৳${order.finalAmount}</p>
    <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
    <p>We'll notify you once your payment is verified.</p>
  `;

  return await sendEmail({
    to: user.email,
    subject: `Order Confirmation - ${order.orderNumber}`,
    htmlContent: getEmailTemplate(content),
  });
};

// Send payment verified email
const sendPaymentVerifiedEmail = async (user, order) => {
  const content = `
    <h2>Payment Verified!</h2>
    <p>Hi ${user.fullName},</p>
    <p>Great news! Your payment for order <strong>${order.orderNumber}</strong> has been verified.</p>
    <p><strong>Order Total:</strong> ৳${order.finalAmount}</p>
    ${order.isDigital ? "<p>You can now access your digital products in your account.</p>" : "<p>Your order will be shipped soon. We will notify you with tracking details.</p>"}
    <a href="${process.env.FRONTEND_URL}/my-orders/${order._id}" class="button">View Order</a>
  `;

  return await sendEmail({
    to: user.email,
    subject: `Payment Verified - ${order.orderNumber}`,
    htmlContent: getEmailTemplate(content),
  });
};

// Send course access email
const sendCourseAccessEmail = async (user, course) => {
  const content = `
    <h2>Course Access Granted!</h2>
    <p>Hi ${user.fullName},</p>
    <p>You now have access to <strong>${course.title}</strong>.</p>
    <p>Start learning today and unlock your potential!</p>
    <a href="${process.env.FRONTEND_URL}/my-courses/${course.slug}" class="button">Start Learning</a>
  `;

  return await sendEmail({
    to: user.email,
    subject: `Course Access - ${course.title}`,
    htmlContent: getEmailTemplate(content),
  });
};

module.exports = {
  sendEmail,
  getEmailTemplate,
  sender,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendPaymentVerifiedEmail,
  sendCourseAccessEmail,
};
