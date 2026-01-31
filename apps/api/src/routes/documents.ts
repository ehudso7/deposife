import { Router } from 'express';
import { prisma } from '../db/prisma';
import { authenticate } from '../middleware/auth';
import { NotFoundError, AuthorizationError } from '../utils/errors';

export const documentsRouter = Router();

// Get documents for a lease
documentsRouter.get('/lease/:leaseId',
  authenticate,
  async (req, res, next) => {
    try {
      const { leaseId } = req.params;

      // Verify access to lease
      const lease = await prisma.lease.findUnique({
        where: { id: leaseId },
      });

      if (!lease) {
        throw new NotFoundError('Lease');
      }

      if (
        req.user!.role !== 'ADMIN' &&
        lease.tenantId !== req.user!.userId &&
        lease.landlordId !== req.user!.userId
      ) {
        throw new AuthorizationError();
      }

      const documents = await prisma.document.findMany({
        where: { leaseId },
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
      });

      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Upload document
documentsRouter.post('/upload',
  authenticate,
  async (req, res, next) => {
    try {
      const { leaseId, name, type, url, fileSize, mimeType } = req.body;

      // Verify access to lease if provided
      if (leaseId) {
        const lease = await prisma.lease.findUnique({
          where: { id: leaseId },
        });

        if (!lease) {
          throw new NotFoundError('Lease');
        }

        if (
          req.user!.role !== 'ADMIN' &&
          lease.tenantId !== req.user!.userId &&
          lease.landlordId !== req.user!.userId
        ) {
          throw new AuthorizationError();
        }
      }

      const document = await prisma.document.create({
        data: {
          leaseId,
          name,
          type,
          url,
          uploadedById: req.user!.userId,
          fileSize,
          mimeType,
        },
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
      });

      res.status(201).json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete document
documentsRouter.delete('/:id',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const document = await prisma.document.findUnique({
        where: { id },
        include: { lease: true },
      });

      if (!document) {
        throw new NotFoundError('Document');
      }

      // Check permissions
      if (
        req.user!.role !== 'ADMIN' &&
        document.uploadedById !== req.user!.userId
      ) {
        throw new AuthorizationError();
      }

      await prisma.document.delete({
        where: { id },
      });

      res.json({
        success: true,
        data: { message: 'Document deleted successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
);