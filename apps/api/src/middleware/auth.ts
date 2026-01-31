import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../utils/auth';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = AuthService.verifyAccessToken(token);

    // Validate session
    await AuthService.validateSession(token);

    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError());
    }

    if (!roles.includes(req.user.role as UserRole)) {
      return next(new AuthorizationError());
    }

    next();
  };
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const payload = AuthService.verifyAccessToken(token);

    // Validate session
    await AuthService.validateSession(token);

    req.user = payload;
    next();
  } catch (error) {
    // If token is invalid, continue without user
    next();
  }
};