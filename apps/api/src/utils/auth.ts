import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { User } from '@prisma/client';
import { prisma } from '../db/prisma';
import { ApiError } from './errors';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private static readonly ACCESS_TOKEN_EXPIRES = '15m';
  private static readonly REFRESH_TOKEN_EXPIRES = '7d';

  static async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  static async verifyPassword(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  static generateTokens(user: Pick<User, 'id' | 'email' | 'role'>): AuthTokens {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: this.ACCESS_TOKEN_EXPIRES }
    );

    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: this.REFRESH_TOKEN_EXPIRES }
    );

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    } catch (error) {
      throw new ApiError('Invalid or expired token', 401);
    }
  }

  static verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload;
    } catch (error) {
      throw new ApiError('Invalid or expired refresh token', 401);
    }
  }

  static async createSession(userId: string, tokens: AuthTokens, ipAddress?: string, userAgent?: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return prisma.session.create({
      data: {
        userId,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });
  }

  static async validateSession(token: string) {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new ApiError('Invalid or expired session', 401);
    }

    return session;
  }

  static async revokeSession(token: string) {
    return prisma.session.delete({
      where: { token },
    });
  }

  static async revokeAllUserSessions(userId: string) {
    return prisma.session.deleteMany({
      where: { userId },
    });
  }

  static generateResetToken(): string {
    return jwt.sign(
      { purpose: 'password-reset', timestamp: Date.now() },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  }

  static generateVerificationToken(): string {
    return jwt.sign(
      { purpose: 'email-verification', timestamp: Date.now() },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
  }

  static async validateResetToken(token: string): Promise<boolean> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      return decoded.purpose === 'password-reset';
    } catch {
      return false;
    }
  }

  static async validateVerificationToken(token: string): Promise<boolean> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      return decoded.purpose === 'email-verification';
    } catch {
      return false;
    }
  }
}