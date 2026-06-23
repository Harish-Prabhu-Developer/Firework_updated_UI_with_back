import { sendEmail } from '../utils/mailer.js';
import { OrderReceivedTemplate } from '../templates/orderReceived.js';

export interface OrderEmailData {
    orderNumber: string;
    orderDate: string;
    customerPhone: string;
    customerEmail: string;
    subtotal: string;
    total: string;
    items: Array<{
        productName: string;
        content?: string;
        quantity: number;
        unitPrice: number | string;
        totalPrice: number | string;
    }>;
    logoUrl?: string;
}

export interface EmailAttachment {
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
    cid?: string;
}

export const sendOrderReceivedEmail = async (
    to: string,
    data: OrderEmailData,
    attachments: EmailAttachment[] = []
): Promise<boolean> => {
    const recipient = to.trim();
    if (!recipient) {
        return false;
    }

    const html = OrderReceivedTemplate(data);

    return sendEmail(recipient, `Order Received - ${data.orderNumber}`, html, attachments);
};
