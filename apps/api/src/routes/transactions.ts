import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { prisma } from '../db/prisma';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { paginationSchema } from '@deposife/shared';
import { NotFoundError, AuthorizationError } from '../utils/errors';

export const transactionsRouter: ExpressRouter = Router();

// Get all transactions
transactionsRouter.get('/',
  authenticate,
  validate({ query: paginationSchema }),
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20 } = req.query as any;
      const skip = (page - 1) * limit;

      let whereClause: any = {};

      // Filter based on user role
      if (req.user!.role === 'TENANT') {
        whereClause.deposit = {
          lease: { tenantId: req.user!.userId },
        };
      } else if (req.user!.role === 'LANDLORD') {
        whereClause.deposit = {
          lease: { landlordId: req.user!.userId },
        };
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
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
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.transaction.count({ where: whereClause }),
      ]);

      res.json({
        success: true,
        data: transactions,
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

// Get transaction by ID
transactionsRouter.get('/:id',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const transaction = await prisma.transaction.findUnique({
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
            },
          },
        },
      });

      if (!transaction) {
        throw new NotFoundError('Transaction');
      }

      // Check access permissions
      const hasAccess =
        req.user!.role === 'ADMIN' ||
        transaction.deposit?.lease.tenantId === req.user!.userId ||
        transaction.deposit?.lease.landlordId === req.user!.userId;

      if (!hasAccess) {
        throw new AuthorizationError();
      }

      res.json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }
);