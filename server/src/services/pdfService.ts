import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// In-memory cache for PDFs
const pdfCache = new Map<string, { buffer: Buffer; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
export const clearPDFCache = () => {
    pdfCache.clear();
};
export const generatePDFFromHTML = async (
    html: string,
    cacheKey?: string
): Promise<Buffer> => {
    // 1. Performance Optimization (The Cache Layer)
    if (cacheKey) {
        const cached = pdfCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            return cached.buffer;
        }
    }

    let browser;
    try {
        // 2. Professional PDF Rendering Engine (Environment Awareness)
        const isProduction = process.env.NODE_ENV === 'production';
        
        if (isProduction) {
            browser = await puppeteerCore.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
            });
        } else {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            });
        }

        const page = await browser.newPage();
        
        // 3. A4 Precision
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        const pdfBytes = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' },
        });
        
        const pdfBuffer = Buffer.from(pdfBytes);

        // 4. Cleanup and Caching
        if (cacheKey) {
            pdfCache.set(cacheKey, { buffer: pdfBuffer, timestamp: Date.now() });
        }

        return pdfBuffer;
    } finally {
        if (browser) await browser.close();
    }
};

export const generateOrderPDFBuffer = async (orderData: any, shopInfo: any, qrCodeDataUrl: string = ''): Promise<Buffer> => {
    const { generateOrderHTML } = await import('../templates/orderTemplate.js');
    const html = generateOrderHTML(orderData, qrCodeDataUrl, shopInfo);
    return generatePDFFromHTML(html);
};
