import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), 'cache', 'pdfs');

export const ensureCacheDir = async () => {
    await fs.mkdir(CACHE_DIR, { recursive: true });
};

export const getCacheKey = (identifier: string): string => {
    return crypto.createHash('md5').update(identifier).digest('hex');
};

export const getCachedPDF = async (key: string): Promise<Buffer | null> => {
    try {
        const filePath = path.join(CACHE_DIR, `${key}.pdf`);
        return await fs.readFile(filePath);
    } catch {
        return null;
    }
};

export const cachePDF = async (key: string, buffer: Buffer): Promise<void> => {
    await ensureCacheDir();
    const filePath = path.join(CACHE_DIR, `${key}.pdf`);
    await fs.writeFile(filePath, buffer);
};