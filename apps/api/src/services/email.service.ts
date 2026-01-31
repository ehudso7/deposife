import { Resend } from 'resend';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@deposife.com';
const APP_URL = process.env.FRONTEND_URL || 'https://deposife.com';

export class EmailService {
  static async sendPasswordResetEmail(email: string, userId: string) {
    try {
      // Generate reset token
      const resetToken = jwt.sign(
        { userId, email, type: 'password-reset' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      // Store reset token in database
      await prisma.user.update({
        where: { id: userId },
        data: {
          resetToken,
          resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour
        },
      });

      const resetUrl = `${APP_URL}/auth/reset-password?token=${resetToken}`;

      const { data, error } = await resend.emails.send({
        from: `Deposife <${FROM_EMAIL}>`,
        to: email,
        subject: 'Reset Your Password - Deposife',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Reset Your Password</title>
            </head>
            <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Deposife</h1>
                <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Secure Deposit Protection</p>
              </div>

              <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>

                <p style="margin: 20px 0;">Hi there,</p>

                <p style="margin: 20px 0;">We received a request to reset your password. Click the button below to create a new password:</p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 5px; font-weight: 600; font-size: 16px;">Reset Password</a>
                </div>

                <p style="margin: 20px 0; font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
                <p style="margin: 20px 0; font-size: 14px; color: #666; word-break: break-all;">${resetUrl}</p>

                <p style="margin: 20px 0; font-size: 14px; color: #666;">This link will expire in 1 hour for security reasons.</p>

                <p style="margin: 20px 0; font-size: 14px; color: #666;">If you didn't request a password reset, you can safely ignore this email.</p>

                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

                <p style="margin: 20px 0; font-size: 12px; color: #999; text-align: center;">
                  This email was sent by Deposife. If you have any questions, please contact our support team at support@deposife.com.
                </p>
              </div>
            </body>
          </html>
        `,
      });

      if (error) {
        logger.error('Failed to send password reset email:', error);
        throw new Error('Failed to send password reset email');
      }

      logger.info(`Password reset email sent to ${email}`);
      return data;
    } catch (error) {
      logger.error('Error sending password reset email:', error);
      throw error;
    }
  }

  static async sendEmailVerification(email: string, userId: string, name: string) {
    try {
      // Generate verification token
      const verificationToken = jwt.sign(
        { userId, email, type: 'email-verification' },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      // Store verification token in database
      await prisma.user.update({
        where: { id: userId },
        data: {
          emailVerificationToken: verificationToken,
          emailVerificationExpiry: new Date(Date.now() + 86400000), // 24 hours
        },
      });

      const verifyUrl = `${APP_URL}/auth/verify-email?token=${verificationToken}`;

      const { data, error } = await resend.emails.send({
        from: `Deposife <${FROM_EMAIL}>`,
        to: email,
        subject: 'Verify Your Email - Deposife',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verify Your Email</title>
            </head>
            <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Deposife!</h1>
                <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Secure Deposit Protection Platform</p>
              </div>

              <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>

                <p style="margin: 20px 0;">Hi ${name},</p>

                <p style="margin: 20px 0;">Welcome to Deposife! Please verify your email address to activate your account and start protecting your deposits.</p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 5px; font-weight: 600; font-size: 16px;">Verify Email</a>
                </div>

                <p style="margin: 20px 0; font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
                <p style="margin: 20px 0; font-size: 14px; color: #666; word-break: break-all;">${verifyUrl}</p>

                <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 30px 0;">
                  <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">What happens next?</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #666;">
                    <li>Complete your profile setup</li>
                    <li>Add your first property</li>
                    <li>Start managing deposits securely</li>
                    <li>Access dispute resolution tools</li>
                  </ul>
                </div>

                <p style="margin: 20px 0; font-size: 14px; color: #666;">This link will expire in 24 hours.</p>

                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

                <p style="margin: 20px 0; font-size: 12px; color: #999; text-align: center;">
                  This email was sent by Deposife. If you didn't create an account, please ignore this email.
                </p>
              </div>
            </body>
          </html>
        `,
      });

      if (error) {
        logger.error('Failed to send email verification:', error);
        throw new Error('Failed to send email verification');
      }

      logger.info(`Email verification sent to ${email}`);
      return data;
    } catch (error) {
      logger.error('Error sending email verification:', error);
      throw error;
    }
  }

  static async sendDepositConfirmation(
    email: string,
    depositDetails: {
      amount: number;
      propertyAddress: string;
      tenantName: string;
      landlordName: string;
      leaseStartDate: Date;
      leaseEndDate: Date;
    }
  ) {
    try {
      const { data, error } = await resend.emails.send({
        from: `Deposife <${FROM_EMAIL}>`,
        to: email,
        subject: 'Deposit Received - Deposife',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Deposit Confirmation</title>
            </head>
            <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Deposit Confirmed</h1>
                <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your deposit is now protected</p>
              </div>

              <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 5px; padding: 15px; margin-bottom: 25px;">
                  <p style="margin: 0; color: #166534; font-weight: 600;">✓ Deposit Successfully Received</p>
                </div>

                <h2 style="color: #333; margin-top: 0;">Deposit Details</h2>

                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Amount:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: 600;">£${depositDetails.amount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Property:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">${depositDetails.propertyAddress}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Tenant:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">${depositDetails.tenantName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Landlord:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">${depositDetails.landlordName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Lease Period:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">${new Date(depositDetails.leaseStartDate).toLocaleDateString()} - ${new Date(depositDetails.leaseEndDate).toLocaleDateString()}</td>
                  </tr>
                </table>

                <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 25px 0;">
                  <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">What's Protected?</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #666;">
                    <li>Your deposit is held in a secure, government-approved scheme</li>
                    <li>Independent dispute resolution if needed</li>
                    <li>Full transparency throughout the tenancy</li>
                    <li>Quick and fair return process at tenancy end</li>
                  </ul>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${APP_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 5px; font-weight: 600; font-size: 16px;">View in Dashboard</a>
                </div>

                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

                <p style="margin: 20px 0; font-size: 12px; color: #999; text-align: center;">
                  Keep this email for your records. If you have any questions, contact support@deposife.com
                </p>
              </div>
            </body>
          </html>
        `,
      });

      if (error) {
        logger.error('Failed to send deposit confirmation:', error);
        throw new Error('Failed to send deposit confirmation');
      }

      logger.info(`Deposit confirmation sent to ${email}`);
      return data;
    } catch (error) {
      logger.error('Error sending deposit confirmation:', error);
      throw error;
    }
  }

  static async sendDisputeNotification(
    email: string,
    disputeDetails: {
      disputeId: string;
      propertyAddress: string;
      reason: string;
      raisedBy: string;
      amount: number;
    }
  ) {
    try {
      const { data, error } = await resend.emails.send({
        from: `Deposife <${FROM_EMAIL}>`,
        to: email,
        subject: 'Dispute Raised - Action Required',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Dispute Notification</title>
            </head>
            <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Dispute Raised</h1>
                <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Action Required</p>
              </div>

              <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 5px; padding: 15px; margin-bottom: 25px;">
                  <p style="margin: 0; color: #991b1b; font-weight: 600;">⚠️ A dispute has been raised regarding your deposit</p>
                </div>

                <h2 style="color: #333; margin-top: 0;">Dispute Details</h2>

                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Dispute ID:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: 600;">#${disputeDetails.disputeId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Property:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">${disputeDetails.propertyAddress}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Raised By:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">${disputeDetails.raisedBy}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Amount Disputed:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: 600;">£${disputeDetails.amount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Reason:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">${disputeDetails.reason}</td>
                  </tr>
                </table>

                <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 25px 0;">
                  <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">What to do next?</h3>
                  <ol style="margin: 0; padding-left: 20px; color: #666;">
                    <li>Review the dispute details in your dashboard</li>
                    <li>Upload any supporting evidence (photos, receipts, etc.)</li>
                    <li>Respond to the dispute within 14 days</li>
                    <li>Consider mediation if direct agreement cannot be reached</li>
                  </ol>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${APP_URL}/disputes/${disputeDetails.disputeId}" style="display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 14px 30px; border-radius: 5px; font-weight: 600; font-size: 16px;">View Dispute</a>
                </div>

                <p style="margin: 20px 0; font-size: 14px; color: #666; background: #fef3c7; padding: 15px; border-radius: 5px;">
                  <strong>Important:</strong> You have 14 days to respond to this dispute. Failure to respond may result in a decision being made without your input.
                </p>

                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

                <p style="margin: 20px 0; font-size: 12px; color: #999; text-align: center;">
                  Need help? Contact our dispute resolution team at disputes@deposife.com
                </p>
              </div>
            </body>
          </html>
        `,
      });

      if (error) {
        logger.error('Failed to send dispute notification:', error);
        throw new Error('Failed to send dispute notification');
      }

      logger.info(`Dispute notification sent to ${email}`);
      return data;
    } catch (error) {
      logger.error('Error sending dispute notification:', error);
      throw error;
    }
  }

  static async send2FACode(email: string, code: string, name: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: `Deposife Security <${FROM_EMAIL}>`,
        to: email,
        subject: 'Your Verification Code - Deposife',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verification Code</title>
            </head>
            <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Verification Code</h1>
                <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Secure Access</p>
              </div>

              <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="margin: 20px 0;">Hi ${name},</p>

                <p style="margin: 20px 0;">Your verification code is:</p>

                <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; text-align: center; margin: 30px 0;">
                  <h1 style="margin: 0; color: #667eea; letter-spacing: 10px; font-size: 36px;">${code}</h1>
                </div>

                <p style="margin: 20px 0; font-size: 14px; color: #666;">This code will expire in 10 minutes.</p>

                <p style="margin: 20px 0; font-size: 14px; color: #666;">If you didn't request this code, please secure your account immediately.</p>

                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

                <p style="margin: 20px 0; font-size: 12px; color: #999; text-align: center;">
                  This is an automated security email from Deposife. Do not reply to this email.
                </p>
              </div>
            </body>
          </html>
        `,
      });

      if (error) {
        logger.error('Failed to send 2FA code:', error);
        throw new Error('Failed to send 2FA code');
      }

      logger.info(`2FA code sent to ${email}`);
      return data;
    } catch (error) {
      logger.error('Error sending 2FA code:', error);
      throw error;
    }
  }
}