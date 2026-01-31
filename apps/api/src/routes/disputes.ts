import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { prisma } from '../db/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { disputeSchema, evidenceSchema, paginationSchema } from '@deposife/shared';
import { DisputeStatus, DisputeReason, DepositStatus, UserRole } from '@prisma/client';
import { NotFoundError, AuthorizationError, ConflictError } from '../utils/errors';

export const disputesRouter: ExpressRouter = Router();

// Get all disputes
disputesRouter.get('/',
  authenticate,
  validate({ query: paginationSchema }),
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20 } = req.query as any;
      const skip = (page - 1) * limit;

      let whereClause: any = {};

      // Filter based on user role
      if (req.user!.role === UserRole.TENANT || req.user!.role === UserRole.LANDLORD) {
        whereClause.OR = [
          { raisedById: req.user!.userId },
          { deposit: { lease: { tenantId: req.user!.userId } } },
          { deposit: { lease: { landlordId: req.user!.userId } } },
        ];
      }

      const [disputes, total] = await Promise.all([
        prisma.dispute.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: {
            deposit: {
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
              },
            },
            raisedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
            _count: {
              select: {
                evidence: true,
                messages: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.dispute.count({ where: whereClause }),
      ]);

      res.json({
        success: true,
        data: disputes,
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

// Get dispute by ID
disputesRouter.get('/:id',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: {
          deposit: {
            include: {
              lease: {
                include: {
                  property: true,
                  tenant: true,
                  landlord: true,
                },
              },
              transactions: true,
              deductions: true,
            },
          },
          raisedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          resolvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          evidence: {
            include: {
              uploadedBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!dispute) {
        throw new NotFoundError('Dispute');
      }

      // Check access permissions
      const hasAccess =
        req.user!.role === UserRole.ADMIN ||
        req.user!.role === UserRole.DISPUTE_RESOLVER ||
        dispute.raisedById === req.user!.userId ||
        dispute.deposit.lease.tenantId === req.user!.userId ||
        dispute.deposit.lease.landlordId === req.user!.userId;

      if (!hasAccess) {
        throw new AuthorizationError();
      }

      res.json({
        success: true,
        data: dispute,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create dispute
disputesRouter.post('/',
  authenticate,
  validate({ body: disputeSchema }),
  async (req, res, next) => {
    try {
      const { depositId, reason, description, claimedAmount } = req.body;

      // Get deposit details
      const deposit = await prisma.deposit.findUnique({
        where: { id: depositId },
        include: {
          lease: true,
          disputes: {
            where: { status: { not: DisputeStatus.CLOSED } },
          },
        },
      });

      if (!deposit) {
        throw new NotFoundError('Deposit');
      }

      // Check if user is party to the lease
      const isTenant = deposit.lease.tenantId === req.user!.userId;
      const isLandlord = deposit.lease.landlordId === req.user!.userId;

      if (!isTenant && !isLandlord) {
        throw new AuthorizationError();
      }

      // Check if deposit can be disputed
      if (deposit.status !== DepositStatus.PENDING_RETURN) {
        throw new ConflictError('Deposit must be pending return to raise a dispute');
      }

      // Check for existing active dispute
      if (deposit.disputes.length > 0) {
        throw new ConflictError('An active dispute already exists for this deposit');
      }

      // Create dispute
      const dispute = await prisma.dispute.create({
        data: {
          depositId,
          raisedById: req.user!.userId,
          reason: reason as DisputeReason,
          description,
          claimedAmount,
          status: DisputeStatus.OPEN,
          deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
        },
        include: {
          raisedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      // Update deposit status
      await prisma.deposit.update({
        where: { id: depositId },
        data: { status: DepositStatus.DISPUTED },
      });

      // Create notification for the other party
      const otherPartyId = isTenant ? deposit.lease.landlordId : deposit.lease.tenantId;
      await prisma.notification.create({
        data: {
          userId: otherPartyId,
          type: 'DISPUTE_RAISED',
          title: 'New Dispute Raised',
          message: `A dispute has been raised regarding the deposit for the property at ${deposit.lease.propertyId}`,
          data: { disputeId: dispute.id },
        },
      });

      res.status(201).json({
        success: true,
        data: dispute,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update dispute status
disputesRouter.patch('/:id/status',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.DISPUTE_RESOLVER),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const dispute = await prisma.dispute.findUnique({
        where: { id },
      });

      if (!dispute) {
        throw new NotFoundError('Dispute');
      }

      const updatedDispute = await prisma.dispute.update({
        where: { id },
        data: {
          status: status as DisputeStatus,
          updatedAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: updatedDispute,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Resolve dispute
disputesRouter.post('/:id/resolve',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.DISPUTE_RESOLVER),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { resolution, tenantAmount, landlordAmount, reasoning } = req.body;

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: { deposit: true },
      });

      if (!dispute) {
        throw new NotFoundError('Dispute');
      }

      if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.CLOSED) {
        throw new ConflictError('Dispute has already been resolved');
      }

      // Validate amounts
      const totalAmount = tenantAmount + landlordAmount;
      if (Math.abs(totalAmount - Number(dispute.deposit.amount)) > 0.01) {
        throw new ConflictError('Total distribution must equal deposit amount');
      }

      // Update dispute
      const updatedDispute = await prisma.dispute.update({
        where: { id },
        data: {
          status: DisputeStatus.RESOLVED,
          resolvedById: req.user!.userId,
          resolution,
          tenantAmount,
          landlordAmount,
          reasoning,
          resolvedAt: new Date(),
        },
      });

      // Update deposit status
      await prisma.deposit.update({
        where: { id: dispute.depositId },
        data: {
          status: DepositStatus.RETURNED,
          returnedAt: new Date(),
          finalAmount: tenantAmount,
        },
      });

      // Create return transactions
      await prisma.transaction.createMany({
        data: [
          {
            depositId: dispute.depositId,
            type: 'RETURN',
            amount: tenantAmount,
            currency: dispute.deposit.currency,
            description: `Dispute resolution - Tenant portion`,
            status: 'COMPLETED',
            processedAt: new Date(),
          },
          {
            depositId: dispute.depositId,
            type: 'DEDUCTION',
            amount: landlordAmount,
            currency: dispute.deposit.currency,
            description: `Dispute resolution - Landlord portion`,
            status: 'COMPLETED',
            processedAt: new Date(),
          },
        ],
      });

      res.json({
        success: true,
        data: updatedDispute,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Add message to dispute
disputesRouter.post('/:id/messages',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { message, isInternal } = req.body;

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: {
          deposit: {
            include: { lease: true },
          },
        },
      });

      if (!dispute) {
        throw new NotFoundError('Dispute');
      }

      // Check permissions
      const canAddMessage =
        req.user!.role === UserRole.ADMIN ||
        req.user!.role === UserRole.DISPUTE_RESOLVER ||
        dispute.raisedById === req.user!.userId ||
        dispute.deposit.lease.tenantId === req.user!.userId ||
        dispute.deposit.lease.landlordId === req.user!.userId;

      if (!canAddMessage) {
        throw new AuthorizationError();
      }

      const newMessage = await prisma.disputeMessage.create({
        data: {
          disputeId: id,
          senderId: req.user!.userId,
          message,
          isInternal: isInternal || false,
        },
      });

      res.status(201).json({
        success: true,
        data: newMessage,
      });
    } catch (error) {
      next(error);
    }
  }
);