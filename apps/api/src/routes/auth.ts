import { Router } from 'express';
import { prisma } from '../db/prisma';
import { AuthService } from '../utils/auth';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { ApiError, ConflictError, NotFoundError } from '../utils/errors';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from '@deposife/shared';
import { UserRole } from '@prisma/client';
import { logger } from '../utils/logger';

export const authRouter = Router();

// Register
authRouter.post('/register',
  validate({ body: registerSchema }),
  async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, role, phoneNumber, address } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash password
      const passwordHash = await AuthService.hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role: role as UserRole,
          phoneNumber,
          streetAddress: address?.street,
          city: address?.city,
          state: address?.state,
          zipCode: address?.zipCode,
          country: address?.country || 'US',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });

      // Generate tokens
      const tokens = AuthService.generateTokens(user);

      // Create session
      await AuthService.createSession(
        user.id,
        tokens,
        req.ip,
        req.headers['user-agent']
      );

      // Log registration
      logger.info(`New user registered: ${user.email}`);

      res.status(201).json({
        success: true,
        data: {
          user,
          ...tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Login
authRouter.post('/login',
  validate({ body: loginSchema }),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new ApiError('Invalid credentials', 401);
      }

      // Verify password
      const isValid = await AuthService.verifyPassword(user.passwordHash, password);

      if (!isValid) {
        throw new ApiError('Invalid credentials', 401);
      }

      // Generate tokens
      const tokens = AuthService.generateTokens(user);

      // Create session
      await AuthService.createSession(
        user.id,
        tokens,
        req.ip,
        req.headers['user-agent']
      );

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
          ...tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Refresh token
authRouter.post('/refresh',
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ApiError('Refresh token required', 400);
      }

      // Verify refresh token
      const payload = AuthService.verifyRefreshToken(refreshToken);

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      // Generate new tokens
      const tokens = AuthService.generateTokens(user);

      // Update session
      await prisma.session.update({
        where: { refreshToken },
        data: {
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          updatedAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Logout
authRouter.post('/logout',
  authenticate,
  async (req, res, next) => {
    try {
      const token = req.headers.authorization?.substring(7);

      if (token) {
        await AuthService.revokeSession(token);
      }

      res.json({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Logout all sessions
authRouter.post('/logout-all',
  authenticate,
  async (req, res, next) => {
    try {
      await AuthService.revokeAllUserSessions(req.user!.userId);

      res.json({
        success: true,
        data: { message: 'All sessions revoked successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Forgot password
authRouter.post('/forgot-password',
  validate({ body: forgotPasswordSchema }),
  async (req, res, next) => {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Don't reveal if user exists
      if (!user) {
        return res.json({
          success: true,
          data: { message: 'If the email exists, a reset link has been sent' },
        });
      }

      // Generate reset token
      const resetToken = AuthService.generateResetToken();

      // TODO: Send email with reset link

      logger.info(`Password reset requested for: ${email}`);

      res.json({
        success: true,
        data: { message: 'If the email exists, a reset link has been sent' },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Reset password
authRouter.post('/reset-password',
  validate({ body: resetPasswordSchema }),
  async (req, res, next) => {
    try {
      const { token, password } = req.body;

      // Validate reset token
      const isValid = await AuthService.validateResetToken(token);

      if (!isValid) {
        throw new ApiError('Invalid or expired reset token', 400);
      }

      // TODO: Get user ID from token and update password

      res.json({
        success: true,
        data: { message: 'Password reset successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get current user
authRouter.get('/me',
  authenticate,
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
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
          twoFactorEnabled: true,
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