import express from 'express';
import type { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { propertiesRouter } from './routes/properties';
import { leasesRouter } from './routes/leases';
import { depositsRouter } from './routes/deposits';
import { disputesRouter } from './routes/disputes';
import { transactionsRouter } from './routes/transactions';
import { documentsRouter } from './routes/documents';
import { notificationsRouter } from './routes/notifications';
import { webhookRouter } from './routes/webhooks';
import { healthRouter } from './routes/health';
import { logger } from './utils/logger';
import { prisma } from './db/prisma';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4000;

// Global rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
// Configure CORS with production domains
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://deposife.com',
      'https://www.deposife.com',
      'https://deposife.vercel.app'
    ]
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
}));
app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Webhook routes (before JSON parsing for raw body)
app.use('/api/v1/webhooks', webhookRouter);

// JSON parsing for other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiter to all routes except webhooks
app.use('/api/', limiter);

// API Routes
const API_BASE = '/api/v1';
app.use(`${API_BASE}/health`, healthRouter);
app.use(`${API_BASE}/auth`, authRouter);
app.use(`${API_BASE}/users`, usersRouter);
app.use(`${API_BASE}/properties`, propertiesRouter);
app.use(`${API_BASE}/leases`, leasesRouter);
app.use(`${API_BASE}/deposits`, depositsRouter);
app.use(`${API_BASE}/disputes`, disputesRouter);
app.use(`${API_BASE}/transactions`, transactionsRouter);
app.use(`${API_BASE}/documents`, documentsRouter);
app.use(`${API_BASE}/notifications`, notificationsRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Received shutdown signal, closing connections...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      logger.info(`API available at http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;