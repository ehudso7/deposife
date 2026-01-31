import { format, formatDistance, parseISO, isValid, isBefore, isAfter, addDays } from 'date-fns';
import { DATE_FORMATS, CURRENCY, REGEX_PATTERNS } from './constants';

export const formatDate = (date: Date | string, formatStr: string = DATE_FORMATS.SHORT): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return 'Invalid date';
  }

  if (formatStr === DATE_FORMATS.RELATIVE) {
    return formatDistance(dateObj, new Date(), { addSuffix: true });
  }

  return format(dateObj, formatStr);
};

export const formatCurrency = (
  amount: number,
  currency: string = CURRENCY.DEFAULT,
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export const calculateDepositProtectionDeadline = (leaseStartDate: Date, days: number = 30): Date => {
  return addDays(leaseStartDate, days);
};

export const isDepositProtectionOverdue = (leaseStartDate: Date, protectionDeadlineDays: number = 30): boolean => {
  const deadline = calculateDepositProtectionDeadline(leaseStartDate, protectionDeadlineDays);
  return isAfter(new Date(), deadline);
};

export const calculateReturnAmount = (
  depositAmount: number,
  deductions: { amount: number; approved: boolean }[]
): number => {
  const totalDeductions = deductions
    .filter(d => d.approved)
    .reduce((sum, d) => sum + d.amount, 0);

  return Math.max(0, depositAmount - totalDeductions);
};

export const generateReference = (prefix: string = 'REF'): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const validateEmail = (email: string): boolean => {
  return REGEX_PATTERNS.EMAIL.test(email);
};

export const validatePhone = (phone: string): boolean => {
  return REGEX_PATTERNS.PHONE.test(phone);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/script/gi, '');
};

export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - suffix.length) + suffix;
};

export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const group = String(item[key]);
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const isUUID = (value: string): boolean => {
  return REGEX_PATTERNS.UUID.test(value);
};

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export const calculateRentToDepositRatio = (monthlyRent: number, depositAmount: number): number => {
  if (monthlyRent === 0) return 0;
  return depositAmount / monthlyRent;
};

export const isDepositAmountValid = (
  depositAmount: number,
  monthlyRent: number,
  maxMonthsRent: number = 6
): boolean => {
  const ratio = calculateRentToDepositRatio(monthlyRent, depositAmount);
  return ratio > 0 && ratio <= maxMonthsRent;
};

export const parseQueryParams = (queryString: string): Record<string, string> => {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};

  params.forEach((value, key) => {
    result[key] = value;
  });

  return result;
};

export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
};

export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (!domain) return email;

  const maskedLocal = localPart.length > 2
    ? `${localPart.substring(0, 2)}${'*'.repeat(Math.max(0, localPart.length - 2))}`
    : localPart;

  return `${maskedLocal}@${domain}`;
};

export const maskPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10) return phone;

  return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) ***-**$3');
};