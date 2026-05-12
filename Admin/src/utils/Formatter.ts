export const formatIdentityDisplay = (text?: string | null): string => {
  if (!text) return '';
  if (text.includes('@') || /[a-zA-Z]/.test(text)) return text;
  let raw = text.replace(/\D/g, '');
  if (raw.startsWith('91') && raw.length > 10) raw = raw.substring(2);
  const clean = raw.substring(0, 10);
  if (!clean.length) return '';
  let fmt = '+91 ' + clean.substring(0, 5);
  if (clean.length > 5) fmt += ' ' + clean.substring(5, 10);
  return fmt;
};

export const cleanIdentityInput = (text?: string | null): string => {
  if (!text) return '';
  if (text.includes('@') || /[a-zA-Z]/.test(text)) return text;
  const digits = text.replace(/\D/g, '');
  if (digits.startsWith('91') && (text.trim().startsWith('+') || digits.length > 10)) return digits.substring(2, 12);
  return digits.substring(0, 10);
};

export const formatCurrency = (amount: number | string): string => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(value)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(value);
};
