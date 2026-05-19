import { Request, Response } from 'express';
import { sendEmail } from '../utils/mailer.js';

export const sendContactEmail = async (req: Request, res: Response) => {
    try {
        const { name, phone, subject, message } = req.body;

        if (!name || !message) {
            return res.status(400).json({
                success: false,
                msg: "Name and message are required fields.",
            });
        }

        // Construct HTML email content
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #d4af37; padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">New Contact Message</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">Crackers Kingdom Enquiry Form</p>
                </div>
                <div style="padding: 24px;">
                    <p style="font-size: 16px; margin-top: 0;">You have received a new message from the website contact form:</p>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; width: 150px; border-bottom: 1px solid #f0f0f0;">Sender Name:</td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f0f0f0;">Phone/WhatsApp:</td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${phone || 'Not provided'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f0f0f0;">Subject:</td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${subject || 'General Inquiry'}</td>
                        </tr>
                    </table>
                    <div style="background-color: #f9f9f9; border-left: 4px solid #d4af37; padding: 15px; border-radius: 4px;">
                        <h4 style="margin: 0 0 8px 0; color: #555;">Message Content:</h4>
                        <p style="margin: 0; white-space: pre-wrap; font-size: 14px; color: #444;">${message}</p>
                    </div>
                </div>
                <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eaeaea;">
                    This is an automated notification from your Crackers Kingdom website.
                </div>
            </div>
        `;

        const emailSubject = `Contact Form: ${subject || 'New Message from ' + name}`;
        
        // Send email to store owner's address
        const recipient = process.env.SMTP_USER || process.env.EMAIL_FROM || "harishpraharshu@gmail.com";
        const emailSent = await sendEmail(recipient, emailSubject, emailHtml);

        if (emailSent) {
            return res.json({
                success: true,
                msg: "Message submitted successfully! Our team will contact you within 2 hours.",
            });
        } else {
            throw new Error("Mailer utility failed to send email.");
        }
    } catch (error: any) {
        console.error("SendContactEmail Error:", error);
        return res.status(500).json({
            success: false,
            msg: "Failed to send email. Please try again later.",
            error: error.message,
        });
    }
};
