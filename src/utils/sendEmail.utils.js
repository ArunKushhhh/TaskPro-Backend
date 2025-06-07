import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API);

const fromEmail = process.env.FROM_EMAIL;

export const sendEmail = async (toEmail, subject, htmlContent) => {
  try {
    if (!process.env.SENDGRID_API) {
      throw new Error("SENDGRID_API environment variable is not set");
    }

    if (!fromEmail) {
      throw new Error("FROM_EMAIL environment variable is not set");
    }
    const msg = {
      to: toEmail,
      from: `Trelloq <${fromEmail}>`,
      subject,
      html: htmlContent,
    };

    console.log("Attempting to send email with config:", {
      to: toEmail,
      from: fromEmail,
      subject,
      hasHtml: !!htmlContent,
    });

    await sgMail.send(msg);
    console.log("Email sent successfully");

    return true;
  } catch (error) {
    console.error("Error sending email:", error);

    if (error.response) {
      console.error(
        "SendGrid Error Response:",
        JSON.stringify(error.response.body, null, 2)
      );
    }

    return false;
  }
};
