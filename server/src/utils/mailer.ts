import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface EmailAttachment {
    filename: string;
    content: Buffer | string;
    contentType?: string;
}

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendEmail = async (
    to: string,
    subject: string,
    html: string,
    attachments: EmailAttachment[] = []
) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            html,
            attachments,
        });
        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
};
