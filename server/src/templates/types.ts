export interface InvoiceLineItem {
  description: string;
  subDescription?: string;
  hsnCode?: string;
  uom: string;
  qty: number;
  rate: number;
}

export interface InvoiceTax {
  cgstPercent?: number;
  sgstPercent?: number;
  igstPercent?: number;
}

export interface InvoiceCompany {
  name: string;
  addressLines: string[];
  phone: string;
  email: string;
  gstin: string;
  pan?: string;
}

export interface InvoiceCustomer {
  name: string;
  addressLines: string[];
  phone?: string;
  gstin?: string;
}

export interface InvoiceInput {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  placeOfSupply?: string;
  company: InvoiceCompany;
  billTo: InvoiceCustomer;
  shipTo?: InvoiceCustomer;
  shippingDetails?: {
    transport?: string;
    vehicleNo?: string;
    ewayBill?: string;
  };
  items: InvoiceLineItem[];
  freightCharge?: number;
  tax: InvoiceTax;
  roundOff?: number;
  amountInWords: string;
  bank?: {
    bankName: string;
    accountNo: string;
    ifsc: string;
    branch: string;
  };
  qr?: {
    paymentQrDataUrl?: string;
    invoiceQrDataUrl?: string;
  };
  logoDataUrl?: string;
  accentColor?: string;
  watermarkOpacity?: number;
}

export interface InvoiceComputedTotals {
  subtotal: number;
  freight: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  roundOff: number;
  grandTotal: number;
  totalTax: number;
}
