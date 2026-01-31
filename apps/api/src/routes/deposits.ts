import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { prisma } from '../db/prisma';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { depositSchema, returnRequestSchema, paginationSchema } from '@deposife/shared';
import { DepositStatus, TransactionStatus, TransactionType } from '@prisma/client';
import { NotFoundError, AuthorizationError, ConflictError, BusinessLogicError } from '../utils/errors';
import { getStateLaw, isProtectionRequired, getProtectionDeadline } from '@deposife/state-laws';

export const depositsRouter: ExpressRouter = Router();

// Get all deposits
depositsRouter.get('/',
  authenticate,
  validate({ query: paginationSchema }),
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20 } = req.query as any;
      const skip = (page - 1) * limit;

      const whereClause: any = {};

      // Filter based on user role
      if (req.user!.role === 'TENANT') {
        whereClause.lease = { tenantId: req.user!.userId };
      } else if (req.user!.role === 'LANDLORD') {
        whereClause.lease = { landlordId: req.user!.userId };
      }

      const [deposits, total] = await Promise.all([
        prisma.deposit.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: {
            lease: {
              include: {
                property: {
                  select: {
                    street: true,
                    city: true,
                    state: true,
                  },
                },
                tenant: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
                landlord: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            _count: {
              select: {
                transactions: true,
                disputes: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.deposit.count({ where: whereClause }),
      ]);

      res.json({
        success: true,
        data: deposits,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get deposit by ID
depositsRouter.get('/:id',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const deposit = await prisma.deposit.findUnique({
        where: { id },
        include: {
          lease: {
            include: {
              property: true,
              tenant: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phoneNumber: true,
                },
              },
              landlord: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phoneNumber: true,
                },
              },
            },
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
          },
          disputes: {
            include: {
              evidence: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          deductions: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!deposit) {
        throw new NotFoundError('Deposit');
      }

      // Check access permissions
      if (
        req.user!.role !== 'ADMIN' &&
        req.user!.role !== 'DISPUTE_RESOLVER' &&
        deposit.lease.tenantId !== req.user!.userId &&
        deposit.lease.landlordId !== req.user!.userId
      ) {
        throw new AuthorizationError();
      }

      res.json({
        success: true,
        data: deposit,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Mark deposit as paid
depositsRouter.post('/:id/pay',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { transactionReference } = req.body;

      const deposit = await prisma.deposit.findUnique({
        where: { id },
        include: { lease: true },
      });

      if (!deposit) {
        throw new NotFoundError('Deposit');
      }

      // Check permissions
      if (deposit.lease.tenantId !== req.user!.userId && req.user!.role !== 'ADMIN') {
        throw new AuthorizationError();
      }

      if (deposit.status !== DepositStatus.PENDING_PAYMENT) {
        throw new ConflictError('Deposit has already been paid');
      }

      // Update deposit status
      const updatedDeposit = await prisma.deposit.update({
        where: { id },
        data: {
          status: DepositStatus.HELD,
        },
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          depositId: id,
          type: TransactionType.DEPOSIT,
          amount: deposit.amount,
          currency: deposit.currency,
          description: 'Initial deposit payment',
          reference: transactionReference,
          status: TransactionStatus.COMPLETED,
          processedAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: updatedDeposit,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Protect deposit
depositsRouter.post('/:id/protect',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { protectionScheme, protectionReference } = req.body;

      const deposit = await prisma.deposit.findUnique({
        where: { id },
        include: {
          lease: {
            include: {
              property: true,
            },
          },
        },
      });

      if (!deposit) {
        throw new NotFoundError('Deposit');
      }

      // Check permissions
      if (deposit.lease.landlordId !== req.user!.userId && req.user!.role !== 'ADMIN') {
        throw new AuthorizationError();
      }

      if (deposit.status !== DepositStatus.HELD) {
        throw new ConflictError('Deposit must be in HELD status to be protected');
      }

      // Check state law requirements
      const stateLaw = getStateLaw(deposit.lease.property.state);
      const protectionRequired = isProtectionRequired(deposit.lease.property.state);

      if (protectionRequired) {
        const deadline = getProtectionDeadline(deposit.lease.property.state, deposit.lease.startDate);
        if (deadline && new Date() > deadline) {
          throw new BusinessLogicError(
            'Protection deadline has passed',
            'PROTECTION_DEADLINE_PASSED'
          );
        }
      }

      // Update deposit with protection details
      const updatedDeposit = await prisma.deposit.update({
        where: { id },
        data: {
          status: DepositStatus.PROTECTED,
          protectionScheme,
          protectionReference,
          protectedAt: new Date(),
        },
      });

      // Create transaction for protection fee if applicable
      if (stateLaw?.protectionRequired) {
        await prisma.transaction.create({
          data: {
            depositId: id,
            type: TransactionType.PROTECTION_FEE,
            amount: 25, // Example protection fee
            currency: deposit.currency,
            description: `Protection fee for ${protectionScheme}`,
            status: TransactionStatus.COMPLETED,
            processedAt: new Date(),
          },
        });
      }

      res.json({
        success: true,
        data: updatedDeposit,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Request deposit return
depositsRouter.post('/:id/return-request',
  authenticate,
  validate({ body: returnRequestSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { requestedAmount, deductions } = req.body;

      const deposit = await prisma.deposit.findUnique({
        where: { id },
        include: {
          lease: true,
        },
      });

      if (!deposit) {
        throw new NotFoundError('Deposit');
      }

      // Check permissions - both tenant and landlord can request return
      if (
        deposit.lease.tenantId !== req.user!.userId &&
        deposit.lease.landlordId !== req.user!.userId &&
        req.user!.role !== 'ADMIN'
      ) {
        throw new AuthorizationError();
      }

      if (deposit.status !== DepositStatus.PROTECTED && deposit.status !== DepositStatus.HELD) {
        throw new ConflictError('Deposit must be protected or held to request return');
      }

      // Check if lease has ended
      if (deposit.lease.status !== 'EXPIRED' && deposit.lease.status !== 'TERMINATED') {
        throw new ConflictError('Lease must be expired or terminated to request deposit return');
      }

      // Calculate total deductions
      const totalDeductions = deductions?.reduce((sum: number, d: any) => sum + Number(d.amount), 0) || 0;

      if (totalDeductions > Number(deposit.amount)) {
        throw new BusinessLogicError(
          'Total deductions exceed deposit amount',
          'EXCESSIVE_DEDUCTIONS'
        );
      }

      // Update deposit status
      await prisma.deposit.update({
        where: { id },
        data: {
          status: DepositStatus.PENDING_RETURN,
          returnRequestedAt: new Date(),
          returnAmount: requestedAmount,
        },
      });

      // Create deduction records
      if (deductions && deductions.length > 0) {
        await prisma.deduction.createMany({
          data: deductions.map((d: any) => ({
            depositId: id,
            reason: d.reason,
            description: d.reason,
            amount: d.amount,
            evidence: d.evidence || [],
            approved: deposit.lease.landlordId === req.user!.userId,
            approvedBy: deposit.lease.landlordId === req.user!.userId ? req.user!.userId : null,
            approvedAt: deposit.lease.landlordId === req.user!.userId ? new Date() : null,
          })),
        });
      }

      res.json({
        success: true,
        data: { message: 'Return request submitted successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Approve deposit return
depositsRouter.post('/:id/approve-return',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const deposit = await prisma.deposit.findUnique({
        where: { id },
        include: {
          lease: true,
          deductions: {
            where: { approved: true },
          },
        },
      });

      if (!deposit) {
        throw new NotFoundError('Deposit');
      }

      // Check permissions
      if (
        deposit.lease.landlordId !== req.user!.userId &&
        req.user!.role !== 'ADMIN' &&
        req.user!.role !== 'DISPUTE_RESOLVER'
      ) {
        throw new AuthorizationError();
      }

      if (deposit.status !== DepositStatus.PENDING_RETURN) {
        throw new ConflictError('Deposit is not pending return');
      }

      // Calculate final return amount
      const totalDeductions = deposit.deductions.reduce(
        (sum, d) => sum + Number(d.amount),
        0
      );
      const finalAmount = Number(deposit.amount) - totalDeductions;

      // Update deposit
      const updatedDeposit = await prisma.deposit.update({
        where: { id },
        data: {
          status: DepositStatus.RETURNED,
          returnApprovedAt: new Date(),
          returnedAt: new Date(),
          finalAmount,
        },
      });

      // Create return transaction
      await prisma.transaction.create({
        data: {
          depositId: id,
          type: TransactionType.RETURN,
          amount: finalAmount,
          currency: deposit.currency,
          description: 'Deposit return',
          status: TransactionStatus.COMPLETED,
          processedAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: updatedDeposit,
      });
    } catch (error) {
      next(error);
    }
  }
);