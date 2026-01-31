export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  address?: Address;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  TENANT = 'TENANT',
  LANDLORD = 'LANDLORD',
  PROPERTY_MANAGER = 'PROPERTY_MANAGER',
  ADMIN = 'ADMIN',
  DISPUTE_RESOLVER = 'DISPUTE_RESOLVER',
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Property {
  id: string;
  landlordId: string;
  address: Address;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  amenities?: string[];
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum PropertyType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  CONDO = 'CONDO',
  TOWNHOUSE = 'TOWNHOUSE',
  STUDIO = 'STUDIO',
}

export interface Lease {
  id: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  depositAmount: number;
  depositId?: string;
  status: LeaseStatus;
  terms?: string;
  documents?: Document[];
  createdAt: Date;
  updatedAt: Date;
}

export enum LeaseStatus {
  DRAFT = 'DRAFT',
  PENDING_SIGNATURES = 'PENDING_SIGNATURES',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
}

export interface Deposit {
  id: string;
  leaseId: string;
  amount: number;
  currency: string;
  status: DepositStatus;
  protectionScheme?: ProtectionScheme;
  protectionReference?: string;
  bankAccount?: BankAccount;
  transactions: Transaction[];
  disputes?: Dispute[];
  returnDetails?: ReturnDetails;
  createdAt: Date;
  updatedAt: Date;
}

export enum DepositStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  HELD = 'HELD',
  PROTECTED = 'PROTECTED',
  PENDING_RETURN = 'PENDING_RETURN',
  PARTIALLY_RETURNED = 'PARTIALLY_RETURNED',
  RETURNED = 'RETURNED',
  DISPUTED = 'DISPUTED',
}

export interface ProtectionScheme {
  provider: string;
  reference: string;
  certificateUrl?: string;
  protectedAt: Date;
}

export interface BankAccount {
  accountName: string;
  accountNumber: string;
  sortCode?: string;
  iban?: string;
  bankName: string;
}

export interface Transaction {
  id: string;
  depositId: string;
  type: TransactionType;
  amount: number;
  description: string;
  reference?: string;
  status: TransactionStatus;
  processedAt?: Date;
  createdAt: Date;
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  PROTECTION_FEE = 'PROTECTION_FEE',
  RETURN = 'RETURN',
  DEDUCTION = 'DEDUCTION',
  REFUND = 'REFUND',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface Dispute {
  id: string;
  depositId: string;
  raisedBy: string;
  reason: DisputeReason;
  description: string;
  claimedAmount: number;
  evidence: Evidence[];
  status: DisputeStatus;
  resolution?: DisputeResolution;
  createdAt: Date;
  updatedAt: Date;
}

export enum DisputeReason {
  DAMAGE = 'DAMAGE',
  CLEANING = 'CLEANING',
  UNPAID_RENT = 'UNPAID_RENT',
  UNPAID_BILLS = 'UNPAID_BILLS',
  MISSING_ITEMS = 'MISSING_ITEMS',
  OTHER = 'OTHER',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  AWAITING_EVIDENCE = 'AWAITING_EVIDENCE',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  ESCALATED = 'ESCALATED',
}

export interface Evidence {
  id: string;
  disputeId: string;
  uploadedBy: string;
  type: EvidenceType;
  description: string;
  fileUrl: string;
  uploadedAt: Date;
}

export enum EvidenceType {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
  CORRESPONDENCE = 'CORRESPONDENCE',
}

export interface DisputeResolution {
  decidedBy: string;
  decision: string;
  tenantAmount: number;
  landlordAmount: number;
  reasoning: string;
  resolvedAt: Date;
}

export interface ReturnDetails {
  requestedAt: Date;
  approvedAt?: Date;
  returnedAt?: Date;
  amount: number;
  deductions?: Deduction[];
  finalAmount: number;
}

export interface Deduction {
  reason: string;
  amount: number;
  evidence?: string[];
  approved: boolean;
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export enum DocumentType {
  LEASE_AGREEMENT = 'LEASE_AGREEMENT',
  INVENTORY = 'INVENTORY',
  INSPECTION_REPORT = 'INSPECTION_REPORT',
  PROOF_OF_PAYMENT = 'PROOF_OF_PAYMENT',
  IDENTITY = 'IDENTITY',
  OTHER = 'OTHER',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

export enum NotificationType {
  DEPOSIT_RECEIVED = 'DEPOSIT_RECEIVED',
  DEPOSIT_PROTECTED = 'DEPOSIT_PROTECTED',
  DEPOSIT_RETURN_REQUESTED = 'DEPOSIT_RETURN_REQUESTED',
  DEPOSIT_RETURNED = 'DEPOSIT_RETURNED',
  DISPUTE_RAISED = 'DISPUTE_RAISED',
  DISPUTE_UPDATE = 'DISPUTE_UPDATE',
  DISPUTE_RESOLVED = 'DISPUTE_RESOLVED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  LEASE_SIGNED = 'LEASE_SIGNED',
  PAYMENT_DUE = 'PAYMENT_DUE',
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}