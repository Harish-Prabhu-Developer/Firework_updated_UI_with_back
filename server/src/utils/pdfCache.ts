/**
 * Shared PDF Cache Module
 * Avoids circular imports between invoiceController and settingsController
 */
const pdfCacheMap = new Map<string, { buffer: Buffer; timestamp: number }>();

export const PDF_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const pdfCache = {
    get: (key: string) => pdfCacheMap.get(key),
    set: (key: string, value: { buffer: Buffer; timestamp: number }) => pdfCacheMap.set(key, value),
    delete: (key: string) => {
        console.log(`🗑️ Evicted PDF cache for invoice: ${key}`);
        pdfCacheMap.delete(key);
    },
    clear: () => {
        console.log(`🧹 PDF Cache fully cleared. Was holding ${pdfCacheMap.size} entries.`);
        pdfCacheMap.clear();
    },
    has: (key: string) => pdfCacheMap.has(key),
    size: () => pdfCacheMap.size,
};
