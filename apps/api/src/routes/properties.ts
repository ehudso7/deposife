import { Router } from 'express';
import { prisma } from '../db/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { propertySchema, paginationSchema } from '@deposife/shared';
import { UserRole, PropertyType } from '@prisma/client';
import { NotFoundError, AuthorizationError } from '../utils/errors';

export const propertiesRouter = Router();

// Get all properties
propertiesRouter.get('/',
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
        ? { leases: { some: { tenantId: req.user!.userId } } }
        : {};

      const [properties, total] = await Promise.all([
        prisma.property.findMany({
          where,
          skip,
          take: limit,
          include: {
            landlord: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: {
              select: { leases: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.property.count({ where }),
      ]);

      res.json({
        success: true,
        data: properties,
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

// Get property by ID
propertiesRouter.get('/:id',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const property = await prisma.property.findUnique({
        where: { id },
        include: {
          landlord: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
          leases: {
            where: { status: 'ACTIVE' },
            include: {
              tenant: {
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
      });

      if (!property) {
        throw new NotFoundError('Property');
      }

      // Check access permissions
      if (req.user!.role === UserRole.LANDLORD && property.landlordId !== req.user!.userId) {
        throw new AuthorizationError();
      }

      if (req.user!.role === UserRole.TENANT) {
        const hasAccess = property.leases.some(lease => lease.tenantId === req.user!.userId);
        if (!hasAccess) {
          throw new AuthorizationError();
        }
      }

      res.json({
        success: true,
        data: property,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create property
propertiesRouter.post('/',
  authenticate,
  authorize(UserRole.LANDLORD, UserRole.PROPERTY_MANAGER, UserRole.ADMIN),
  validate({ body: propertySchema }),
  async (req, res, next) => {
    try {
      const {
        address,
        type,
        bedrooms,
        bathrooms,
        squareFeet,
        amenities,
      } = req.body;

      const property = await prisma.property.create({
        data: {
          landlordId: req.user!.userId,
          street: address.street,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          country: address.country || 'US',
          type: type as PropertyType,
          bedrooms,
          bathrooms,
          squareFeet,
          amenities: amenities || [],
          images: [],
          monthlyRent: 0, // To be set when creating lease
        },
        include: {
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

      res.status(201).json({
        success: true,
        data: property,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update property
propertiesRouter.patch('/:id',
  authenticate,
  authorize(UserRole.LANDLORD, UserRole.PROPERTY_MANAGER, UserRole.ADMIN),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Verify ownership
      const existing = await prisma.property.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError('Property');
      }

      if (req.user!.role === UserRole.LANDLORD && existing.landlordId !== req.user!.userId) {
        throw new AuthorizationError();
      }

      const property = await prisma.property.update({
        where: { id },
        data: {
          ...req.body,
          updatedAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: property,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete property
propertiesRouter.delete('/:id',
  authenticate,
  authorize(UserRole.LANDLORD, UserRole.ADMIN),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Verify ownership
      const property = await prisma.property.findUnique({
        where: { id },
        include: {
          _count: {
            select: { leases: true },
          },
        },
      });

      if (!property) {
        throw new NotFoundError('Property');
      }

      if (req.user!.role === UserRole.LANDLORD && property.landlordId !== req.user!.userId) {
        throw new AuthorizationError();
      }

      if (property._count.leases > 0) {
        throw new AuthorizationError('Cannot delete property with active leases');
      }

      await prisma.property.delete({
        where: { id },
      });

      res.json({
        success: true,
        data: { message: 'Property deleted successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
);