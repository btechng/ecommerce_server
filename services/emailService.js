import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send notification email to admin
 */
export const sendAdminNotification = async (subject, message) => {
  try {
    await transporter.sendMail({
      from: `"Ecommerce App" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject,
      html: message,
    });
    console.log("📩 Admin notified successfully");
  } catch (error) {
    console.error("❌ Failed to send admin email:", error);
  }
};
