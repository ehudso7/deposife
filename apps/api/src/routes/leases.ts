import { Router } from 'express';
import { prisma } from '../db/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { leaseSchema, paginationSchema } from '@deposife/shared';
import { UserRole, LeaseStatus } from '@prisma/client';
import { NotFoundError, AuthorizationError, ConflictError } from '../utils/errors';

export const leasesRouter = Router();

// Get all leases
leasesRouter.get('/',
  authenticate,
  validate({ query: paginationSchema }),
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20 } = req.query as any;
      const skip = (page - 1) * limit;

      // Filter based on user role
      const where = req.user!.role === UserRole.LANDLORD
        ? { landlordId: req.user!.userId }
        : req.user!.role === UserRole.TENANT
        ? { tenantId: req.user!.userId }
        : {};

      const [leases, total] = await Promise.all([
        prisma.lease.findMany({
          where,
          skip,
          take: limit,
          include: {
            property: {
              select: {
                id: true,
                street: true,
                city: true,
                state: true,
                type: true,
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
            deposit: {
              select: {
                id: true,
                amount: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.lease.count({ where }),
      ]);

      res.json({
        success: true,
        data: leases,
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

// Get lease by ID
leasesRouter.get('/:id',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const lease = await prisma.lease.findUnique({
        where: { id },
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
          deposit: true,
          documents: true,
        },
      });

      if (!lease) {
        throw new NotFoundError('Lease');
      }

      // Check access permissions
      if (
        req.user!.role === UserRole.LANDLORD &&
        lease.landlordId !== req.user!.userId
      ) {
        throw new AuthorizationError();
      }

      if (
        req.user!.role === UserRole.TENANT &&
        lease.tenantId !== req.user!.userId
      ) {
        throw new AuthorizationError();
      }

      res.json({
        success: true,
        data: lease,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create lease
leasesRouter.post('/',
  authenticate,
  authorize(UserRole.LANDLORD, UserRole.PROPERTY_MANAGER, UserRole.ADMIN),
  validate({ body: leaseSchema }),
  async (req, res, next) => {
    try {
      const {
        propertyId,
        tenantId,
        startDate,
        endDate,
        monthlyRent,
        depositAmount,
        terms,
      } = req.body;

      // Verify property ownership
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });

      if (!property) {
        throw new NotFoundError('Property');
      }

      if (req.user!.role === UserRole.LANDLORD && property.landlordId !== req.user!.userId) {
        throw new AuthorizationError();
      }

      // Check for existing active lease
      const existingLease = await prisma.lease.findFirst({
        where: {
          propertyId,
          status: { in: ['ACTIVE', 'PENDING_SIGNATURES'] },
        },
      });

      if (existingLease) {
        throw new ConflictError('Property already has an active lease');
      }

      // Create lease
      const lease = await prisma.lease.create({
        data: {
          propertyId,
          tenantId,
          landlordId: property.landlordId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          monthlyRent,
          depositAmount,
          status: LeaseStatus.PENDING_SIGNATURES,
          terms,
        },
        include: {
          property: {
            select: {
              id: true,
              street: true,
              city: true,
              state: true,
              type: true,
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
      });

      // Update property monthly rent
      await prisma.property.update({
        where: { id: propertyId },
        data: { monthlyRent },
      });

      res.status(201).json({
        success: true,
        data: lease,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Sign lease
leasesRouter.post('/:id/sign',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const lease = await prisma.lease.findUnique({
        where: { id },
      });

      if (!lease) {
        throw new NotFoundError('Lease');
      }

      if (lease.status !== LeaseStatus.PENDING_SIGNATURES) {
        throw new ConflictError('Lease is not pending signatures');
      }

      // Determine which party is signing
      const isTenant = lease.tenantId === req.user!.userId;
      const isLandlord = lease.landlordId === req.user!.userId;

      if (!isTenant && !isLandlord) {
        throw new AuthorizationError();
      }

      const updateData: any = {};

      if (isTenant) {
        updateData.signedByTenant = new Date();
      } else {
        updateData.signedByLandlord = new Date();
      }

      const updatedLease = await prisma.lease.update({
        where: { id },
        data: updateData,
      });

      // Check if both parties have signed
      if (updatedLease.signedByTenant && updatedLease.signedByLandlord) {
        await prisma.lease.update({
          where: { id },
          data: { status: LeaseStatus.ACTIVE },
        });

        // Create deposit record
        await prisma.deposit.create({
          data: {
            leaseId: id,
            amount: lease.depositAmount,
            currency: 'USD',
            status: 'PENDING_PAYMENT',
          },
        });
      }

      res.json({
        success: true,
        data: updatedLease,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Terminate lease
leasesRouter.post('/:id/terminate',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const lease = await prisma.lease.findUnique({
        where: { id },
        include: { deposit: true },
      });

      if (!lease) {
        throw new NotFoundError('Lease');
      }

      // Check permissions
      if (
        req.user!.role !== UserRole.ADMIN &&
        lease.landlordId !== req.user!.userId &&
        lease.tenantId !== req.user!.userId
      ) {
        throw new AuthorizationError();
      }

      if (lease.status !== LeaseStatus.ACTIVE) {
        throw new ConflictError('Only active leases can be terminated');
      }

      // Check if deposit has been returned
      if (lease.deposit && lease.deposit.status !== 'RETURNED') {
        throw new ConflictError('Deposit must be returned before terminating lease');
      }

      const updatedLease = await prisma.lease.update({
        where: { id },
        data: {
          status: LeaseStatus.TERMINATED,
          terms: lease.terms ? `${lease.terms}\n\nTermination reason: ${reason}` : `Termination reason: ${reason}`,
          updatedAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: updatedLease,
      });
    } catch (error) {
      next(error);
    }
  }
);