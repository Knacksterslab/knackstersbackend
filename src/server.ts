import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import supertokens from 'supertokens-node';
import { initSupertokens } from './config/supertokens';
import { middleware as supertokensMiddleware, errorHandler as supertokensErrorHandler } from 'supertokens-node/framework/express';
import { logger } from './utils/logger';
import { prisma } from './lib/prisma';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize SuperTokens
initSupertokens();

// Import routes
import authRoutes from './routes/auth';
import adminAuthRoutes from './routes/admin/auth';
import contentRoutes from './routes/admin/content';
import partnersRoutes from './routes/admin/partners';
import managersRoutes from './routes/admin/managers';
import uploadRoutes from './routes/admin/upload';
import pagesRoutes from './routes/admin/pages';
import adminNotificationRoutes from './routes/admin/notifications';
import adminTalentRoutes from './routes/admin/talent';

// Client routes
import dashboardRoutes from './routes/client/dashboard';
import hoursRoutes from './routes/client/hours';
import notificationsRoutes from './routes/client/notifications';
import projectsRoutes from './routes/client/projects';
import tasksRoutes from './routes/client/tasks';
import timeRoutes from './routes/client/time';
import billingRoutes from './routes/client/billing';
import meetingsRoutes from './routes/client/meetings';
import stripeRoutes from './routes/client/stripe';

// User routes
import userPreferencesRoutes from './routes/user/preferences';

// Talent routes
import talentDashboardRoutes from './routes/talent/dashboard';

// Manager routes
import managerDashboardRoutes from './routes/manager/dashboard';
import managerOnboardingRoutes from './routes/manager/onboarding';

// Admin routes (dashboard & management)
import adminDashboardRoutes from './routes/admin/dashboard';

// Public routes
import publicTalentRoutes from './routes/public/talent';
import publicBookingRoutes from './routes/public/booking';
import publicContentRoutes from './routes/public/content';

// Webhook routes
import calcomWebhookRoutes from './routes/webhooks/calcom';

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration - MUST come before SuperTokens middleware
// Allow multiple origins for local dev and production
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://www.knacksters.co',
  'https://knacksters.co',
  'http://localhost:3000', // Local development
  'http://localhost:3001', // Alternative local port
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: (origin, callback) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/b64e0ab6-7d71-4fbd-bdcc-a8b7f534a7a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.ts:83',message:'CORS origin check',data:{origin:origin,allowedOrigins:allowedOrigins,hasOrigin:!!origin},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2'})}).catch(()=>{});
    // #endregion
    
    // Allow requests with no origin (like mobile apps, curl, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log for debugging (remove in production if needed)
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
  exposedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// SuperTokens middleware
app.use(supertokensMiddleware());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'knacksters-backend'
  });
});

// Public Routes (no auth required)
app.use('/api/public/talent', publicTalentRoutes);
app.use('/api/public/booking', publicBookingRoutes);
app.use('/api/public/content', publicContentRoutes);

// Webhook Routes (no auth required)
app.use('/api/webhooks/calcom', calcomWebhookRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/content', contentRoutes);
app.use('/api/admin/partners', partnersRoutes);
app.use('/api/admin/pages', pagesRoutes);
app.use('/api/admin/upload', uploadRoutes);
app.use('/api/admin/managers', managersRoutes);
app.use('/api/admin/notifications', adminNotificationRoutes);
app.use('/api/admin/talent', adminTalentRoutes);

// Client Routes
app.use('/api/client/dashboard', dashboardRoutes);
app.use('/api/client/hours', hoursRoutes);
app.use('/api/client/notifications', notificationsRoutes);
app.use('/api/client/projects', projectsRoutes);
app.use('/api/client/tasks', tasksRoutes);
app.use('/api/client/time', timeRoutes);
app.use('/api/client/billing', billingRoutes);
app.use('/api/client/meetings', meetingsRoutes);
app.use('/api/client/stripe', stripeRoutes);

// User Routes (protected)
app.use('/api/user/preferences', userPreferencesRoutes);

// Talent Routes
app.use('/api/talent', talentDashboardRoutes);

// Manager Routes
app.use('/api/manager', managerDashboardRoutes);
app.use('/api/manager/onboarding', managerOnboardingRoutes);

// Admin Routes (Dashboard & Management)
app.use('/api/admin', adminDashboardRoutes);

// SuperTokens error handler
app.use(supertokensErrorHandler());

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: any) => {
  logger.error('Request error', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server with proper cleanup
const server = app.listen(PORT, () => {
  logger.info(`Backend server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown to prevent memory leaks
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, closing server gracefully`);
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    // Disconnect Prisma
    await prisma.$disconnect();
    logger.info('Database connections closed');
    
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
