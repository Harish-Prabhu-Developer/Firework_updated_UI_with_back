import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolveLogoDataUrl = () => {
    const candidatePaths = [
        path.resolve(__dirname, '../../assets/logo.svg'),
        path.resolve(__dirname, '../../../src/assets/logo.svg'),
        path.resolve(process.cwd(), 'src/assets/logo.svg'),
        path.resolve(process.cwd(), 'server/src/assets/logo.svg'),
    ];

    const logoPath = candidatePaths.find((candidate) => fs.existsSync(candidate));
    if (!logoPath) {
        return '';
    }

    const imageBuffer = fs.readFileSync(logoPath);
    return `data:image/svg+xml;base64,${imageBuffer.toString('base64')}`;
};

export const DEFAULT_LOGO_DATA_URL = resolveLogoDataUrl();
