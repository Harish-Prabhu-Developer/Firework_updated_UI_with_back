export const formatIdentityDisplay = (text?: string | null): string => {
  if (!text) return '';
  if (text.includes('@') || /[a-zA-Z]/.test(text)) return text;
  
  // Strip non-digits
  let raw = text.replace(/\D/g, '');
  
  // If text has '+' and starts with 91, it's definitely the prefix, strip it for processing
  if (text.includes('+') && raw.startsWith('91')) {
    raw = raw.substring(2);
  } else if (raw.startsWith('91') && raw.length > 10) {
    // If no '+', only strip 91 if it's a 12-digit number (prefix + 10 digits)
    raw = raw.substring(2);
  }

  const clean = raw.substring(0, 10);
  if (!clean.length) return '';
  
  let fmt = '+91 ' + clean.substring(0, 5);
  if (clean.length > 5) fmt += ' ' + clean.substring(5, 10);
  return fmt;
};

export const cleanIdentityInput = (text?: string | null): string => {
  if (!text) return '';
  if (text.includes('@') || /[a-zA-Z]/.test(text)) return text;
  
  let digits = text.replace(/\D/g, '');
  
  if (text.includes('+') && digits.startsWith('91')) {
    digits = digits.substring(2);
  } else if (digits.startsWith('91') && digits.length > 10) {
    digits = digits.substring(2);
  }

  return digits.substring(0, 10);
};

export const formatCurrency = (amount: number | string): string => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(value)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(value);
};
