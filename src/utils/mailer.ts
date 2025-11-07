import nodemailer from "nodemailer";
import { EmailOptions } from "../types";

const transporter = nodemailer.createTransport({
  // host: process.env.SMTP_HOST || "smtp.gmail.com",
  // port: Number(process.env.SMTP_PORT) || 587,
  // secure: true, // true for 465, false for other ports
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send email helper
 */
export async function sendEmail({ to, subject, message, from }: EmailOptions): Promise<{ message: string }> {
  const mailOptions = {
    from: from || `"Workflow Engine" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { message: "Email Sent Successfully" };
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
