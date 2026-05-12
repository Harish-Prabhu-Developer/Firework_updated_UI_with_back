import QRCode from 'qrcode';

export const generateQRCodeDataURL = async (text: string): Promise<string> => {
    return await QRCode.toDataURL(text, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 200,
    });
};