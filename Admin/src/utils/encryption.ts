const SECRET_KEY = 'admin-secret-key-super-secure';
export const encrypt = (text: string): string => {
  if (!text) return '';
  let result = '';
  for (let i = 0; i < text.length; i++) result += (text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length)).toString(16).padStart(2, '0');
  return result;
};
export const decrypt = (hex: string): string => {
  if (!hex) return '';
  let result = '';
  for (let i = 0; i < hex.length; i += 2) result += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16) ^ SECRET_KEY.charCodeAt((i / 2) % SECRET_KEY.length));
  return result;
};
