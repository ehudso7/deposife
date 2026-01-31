import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { prisma } from '../db/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateProfileSchema, paginationSchema } from '@deposife/shared';
import { UserRole } from '@prisma/client';
import { NotFoundError } from '../utils/errors';

export const usersRouter: ExpressRouter = Router();

// Get all users (admin only)
usersRouter.get('/',
  authenticate,
  authorize(UserRole.ADMIN),
  validate({ query: paginationSchema }),
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20 } = req.query as any;
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            emailVerified: true,
            createdAt: true,
            lastLoginAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count(),
      ]);

      res.json({
        success: true,
        data: users,
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

// Get user by ID
usersRouter.get('/:id',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Check if user is viewing their own profile or is admin
      if (req.user!.userId !== id && req.user!.role !== UserRole.ADMIN) {
        throw new NotFoundError('User');
      }

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phoneNumber: true,
          streetAddress: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          emailVerified: true,
          profileImageUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update user profile
usersRouter.patch('/:id',
  authenticate,
  validate({ body: updateProfileSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Check if user is updating their own profile or is admin
      if (req.user!.userId !== id && req.user!.role !== UserRole.ADMIN) {
        throw new NotFoundError('User');
      }

      const { firstName, lastName, phoneNumber, address } = req.body;

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phoneNumber !== undefined && { phoneNumber }),
          ...(address && {
            streetAddress: address.street,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            country: address.country,
          }),
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phoneNumber: true,
          streetAddress: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          updatedAt: true,
        },
      });

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete user (admin only)
usersRouter.delete('/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      await prisma.user.delete({
        where: { id },
      });

      res.json({
        success: true,
        data: { message: 'User deleted successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
);