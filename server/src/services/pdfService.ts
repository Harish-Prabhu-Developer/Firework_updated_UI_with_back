import puppeteer from 'puppeteer';
import { getCachedPDF, cachePDF } from '../utils/pdfCache.js';

export const generatePDFFromHTML = async (
    html: string,
    cacheKey?: string
): Promise<Buffer> => {
    if (cacheKey) {
        const cached = await getCachedPDF(cacheKey);
        if (cached) return cached;
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBytes = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
    });
    const pdf = Buffer.from(pdfBytes);


    await browser.close();

    if (cacheKey) {
        await cachePDF(cacheKey, pdf);
    }

    return pdf;
};

export const generateOrderPDFBuffer = async (orderData: any, shopInfo: any, qrCodeDataUrl: string = ''): Promise<Buffer> => {
    const { generateOrderHTML } = await import('../templates/orderTemplate.js');
    const html = generateOrderHTML(orderData, qrCodeDataUrl, shopInfo);
    return generatePDFFromHTML(html);
};
