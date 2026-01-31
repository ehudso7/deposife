export const APP_NAME = 'Deposife';
export const APP_VERSION = '1.0.0';

export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

export const AUTH_TOKEN_KEY = 'deposife_auth_token';
export const REFRESH_TOKEN_KEY = 'deposife_refresh_token';

export const TOKEN_EXPIRY = {
  ACCESS: 15 * 60 * 1000, // 15 minutes
  REFRESH: 7 * 24 * 60 * 60 * 1000, // 7 days
  VERIFICATION: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_RESET: 1 * 60 * 60 * 1000, // 1 hour
};

export const DEPOSIT_LIMITS = {
  MIN_AMOUNT: 100,
  MAX_AMOUNT: 50000,
  MAX_MONTHS_RENT: 6,
};

export const DISPUTE_TIMEFRAMES = {
  INITIAL_RESPONSE_DAYS: 14,
  EVIDENCE_SUBMISSION_DAYS: 10,
  RESOLUTION_DAYS: 28,
  APPEAL_DAYS: 10,
};

export const FILE_UPLOAD_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 20,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/heif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

export const CURRENCY = {
  DEFAULT: 'USD',
  SUPPORTED: ['USD', 'GBP', 'EUR', 'CAD', 'AUD'],
};

export const PROTECTION_SCHEMES = {
  TDS: 'Tenancy Deposit Scheme',
  DPS: 'Deposit Protection Service',
  MYDEPOSITS: 'mydeposits',
  INTERNAL: 'Internal Protection',
};

export const ERROR_CODES = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Permissions
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Business Logic
  DEPOSIT_ALREADY_PROTECTED: 'DEPOSIT_ALREADY_PROTECTED',
  DEPOSIT_NOT_ELIGIBLE: 'DEPOSIT_NOT_ELIGIBLE',
  DISPUTE_ALREADY_EXISTS: 'DISPUTE_ALREADY_EXISTS',
  DISPUTE_DEADLINE_PASSED: 'DISPUTE_DEADLINE_PASSED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',

  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
};

export const SUCCESS_MESSAGES = {
  DEPOSIT_PROTECTED: 'Deposit has been successfully protected',
  DEPOSIT_RETURNED: 'Deposit has been successfully returned',
  DISPUTE_RAISED: 'Dispute has been raised successfully',
  DISPUTE_RESOLVED: 'Dispute has been resolved',
  EVIDENCE_UPLOADED: 'Evidence has been uploaded successfully',
  PROFILE_UPDATED: 'Profile has been updated successfully',
  PASSWORD_RESET: 'Password has been reset successfully',
  EMAIL_VERIFIED: 'Email has been verified successfully',
};

export const REGEX_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^\+?[\d\s-()]+$/,
  ZIP_CODE: /^\d{5}(-\d{4})?$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
};

export const DATE_FORMATS = {
  SHORT: 'MM/dd/yyyy',
  LONG: 'MMMM d, yyyy',
  WITH_TIME: 'MM/dd/yyyy HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  RELATIVE: 'relative',
};