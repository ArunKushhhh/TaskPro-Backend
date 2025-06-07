import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API);

const fromEmail = process.env.FROM_EMAIL;

export const sendEmail = async (toEmail, subject, htmlContent) => {
  try {
    const msg = {
      to: toEmail,
      from: fromEmail,
      subject: subject,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log("Email sent successfully");

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");

    return false;
  }
};
