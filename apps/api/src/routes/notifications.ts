import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { prisma } from '../db/prisma';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { paginationSchema } from '@deposife/shared';

export const notificationsRouter: ExpressRouter = Router();

// Get user notifications
notificationsRouter.get('/',
  authenticate,
  validate({ query: paginationSchema }),
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20 } = req.query as any;
      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: { userId: req.user!.userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.notification.count({
          where: { userId: req.user!.userId },
        }),
        prisma.notification.count({
          where: {
            userId: req.user!.userId,
            read: false,
          },
        }),
      ]);

      res.json({
        success: true,
        data: notifications,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          unreadCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Mark notification as read
notificationsRouter.patch('/:id/read',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const notification = await prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        return res.json({
          success: true,
          data: { message: 'Notification marked as read' },
        });
      }

      if (notification.userId !== req.user!.userId) {
        return res.json({
          success: true,
          data: { message: 'Notification marked as read' },
        });
      }

      await prisma.notification.update({
        where: { id },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: { message: 'Notification marked as read' },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Mark all notifications as read
notificationsRouter.patch('/read-all',
  authenticate,
  async (req, res, next) => {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: req.user!.userId,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: { message: 'All notifications marked as read' },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete notification
notificationsRouter.delete('/:id',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      await prisma.notification.deleteMany({
        where: {
          id,
          userId: req.user!.userId,
        },
      });

      res.json({
        success: true,
        data: { message: 'Notification deleted' },
      });
    } catch (error) {
      next(error);
    }
  }
);