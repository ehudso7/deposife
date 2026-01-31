import { z } from 'zod';
import { UserRole, PropertyType, LeaseStatus, DepositStatus, TransactionType, TransactionStatus, DisputeReason, DisputeStatus, EvidenceType, DocumentType, NotificationType } from './types';

export const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
  country: z.string().min(1),
});

export const userSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.nativeEnum(UserRole),
  phoneNumber: z.string().regex(/^\+?[\d\s-()]+$/).optional(),
  address: addressSchema.optional(),
});

export const propertySchema = z.object({
  address: addressSchema,
  type: z.nativeEnum(PropertyType),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().min(0),
  squareFeet: z.number().positive().optional(),
  amenities: z.array(z.string()).optional(),
});

export const leaseSchema = z.object({
  propertyId: z.string().uuid(),
  tenantId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  monthlyRent: z.number().positive(),
  depositAmount: z.number().positive(),
  terms: z.string().optional(),
}).refine(data => data.endDate > data.startDate, {
  message: 'End date must be after start date',
});

export const depositSchema = z.object({
  leaseId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
});

export const transactionSchema = z.object({
  depositId: z.string().uuid(),
  type: z.nativeEnum(TransactionType),
  amount: z.number().positive(),
  description: z.string().min(1),
  reference: z.string().optional(),
});

export const disputeSchema = z.object({
  depositId: z.string().uuid(),
  reason: z.nativeEnum(DisputeReason),
  description: z.string().min(10),
  claimedAmount: z.number().positive(),
});

export const evidenceSchema = z.object({
  disputeId: z.string().uuid(),
  type: z.nativeEnum(EvidenceType),
  description: z.string().min(1),
  file: z.any(),
});

export const returnRequestSchema = z.object({
  depositId: z.string().uuid(),
  requestedAmount: z.number().positive(),
  deductions: z.array(z.object({
    reason: z.string().min(1),
    amount: z.number().positive(),
    evidence: z.array(z.string()).optional(),
  })).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = userSchema.extend({
  password: z.string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number and special character'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phoneNumber: z.string().regex(/^\+?[\d\s-()]+$/).optional(),
  address: addressSchema.optional(),
});

export const searchSchema = z.object({
  query: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  filters: z.record(z.unknown()).optional(),
});

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine(data => data.endDate >= data.startDate, {
  message: 'End date must be after or equal to start date',
});