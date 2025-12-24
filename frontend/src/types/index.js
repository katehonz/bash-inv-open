// Enums converted to JavaScript objects
export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMINISTRATOR: 'ADMINISTRATOR',
  USER: 'USER',
  ACCOUNTANT: 'ACCOUNTANT'
};

export const DocumentType = {
  INVOICE: 'INVOICE',
  CREDIT_NOTE: 'CREDIT_NOTE',
  DEBIT_NOTE: 'DEBIT_NOTE',
  PROFORMA: 'PROFORMA'
};

export const DocumentStatus = {
  DRAFT: 'DRAFT',
  FINAL: 'FINAL',
  CANCELLED: 'CANCELLED'
};

export const SequenceType = {
  TAX_DOCUMENT: 'TAX_DOCUMENT',
  NON_TAX_DOCUMENT: 'NON_TAX_DOCUMENT'
};

export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  FINAL: 'FINAL'
};

export const ClientType = {
  B2B: 'B2B',
  B2C: 'B2C'
};

// Note: Interfaces are removed since JavaScript doesn't support them
// All type definitions are handled at runtime in JavaScript