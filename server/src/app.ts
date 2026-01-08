import express, { Express } from 'express';
import cors from 'cors';
import errorHandlerMiddleware from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import activityLogRoutes from './routes/activityLog';
import inventoryRoutes from './routes/inventory';
import purchaseRoutes from './routes/purchases';
import purchaseOrderRoutes from './routes/purchaseOrders';
import saleRoutes from './routes/sales';
import productionRoutes from './routes/production';
import bomRoutes from './routes/bom';
import settingsRoutes from './routes/settings';
import invoiceRoutes from './routes/invoices';
import customerRoutes from './routes/customers';
import paymentRoutes from './routes/payments';
import reportRoutes from './routes/reports';
import posRoutes from './routes/pos';
import expenseRoutes from './routes/expenses';
import supplierRoutes from './routes/suppliers';
import path from 'path';
import fs from 'fs';

// Create Express app
const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes - MUST come before SPA catch-all
app.use('/api/auth', authRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/boms', bomRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api', purchaseOrderRoutes);
app.use('/api', purchaseRoutes);
app.use('/api', saleRoutes);
app.use('/api', productionRoutes);

// Serve static files from client/dist in production
// This MUST come AFTER API routes
if (process.env.NODE_ENV === 'production') {
  let clientDistPath: string;

  // Check if running in Electron (DATABASE_PATH is set by Electron main process)
  if (process.env.DATABASE_PATH) {
    // Running in packaged Electron app
    clientDistPath = path.join(process.cwd(), '..', 'client', 'dist');
    clientDistPath = path.normalize(clientDistPath);

    if (!fs.existsSync(clientDistPath)) {
      console.log('[Server] Path not found, trying alternative locations...');

      clientDistPath = path.join(__dirname, '..', '..', '..', 'client', 'dist');
      clientDistPath = path.normalize(clientDistPath);
    }

    if (!fs.existsSync(clientDistPath)) {
      const resourcesPath = path.join(path.dirname(process.execPath), 'resources');
      clientDistPath = path.join(resourcesPath, 'client', 'dist');
      clientDistPath = path.normalize(clientDistPath);
    }
  } else {
    clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
  }

  console.log('[Server] Serving static files from:', clientDistPath);
  console.log('[Server] Path exists:', fs.existsSync(clientDistPath));
  console.log('[Server] process.cwd():', process.cwd());

  // Serve static assets (js, css, images, etc.)
  app.use(express.static(clientDistPath, {
    maxAge: '1y',
    setHeaders: (res: any, filePath: string) => {
      if (!filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
    }
  }));

  // SPA catch-all - serve index.html for all non-API routes
  // This enables client-side routing (React Router)
  app.get('*', (req: express.Request, res: express.Response) => {
    const indexPath = path.join(clientDistPath, 'index.html');

    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error('[Server] index.html not found at:', indexPath);
      res.status(404).json({ error: 'Route not found', path: req.path });
    }
  });
} else {
  // In development, serve the built frontend for SPA routing
  const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
  const normalizedPath = path.normalize(clientDistPath);

  console.log('[Server] Serving static files from:', normalizedPath);

  // Serve static assets
  app.use(express.static(normalizedPath));

  // SPA catch-all - serve index.html for all non-API routes
  // This enables client-side routing (React Router)
  app.get('*', (req: express.Request, res: express.Response) => {
    const indexPath = path.join(normalizedPath, 'index.html');

    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error('[Server] index.html not found at:', indexPath);
      res.status(404).json({ error: 'Route not found', path: req.path });
    }
  });
}

// Global error handler
app.use(errorHandlerMiddleware.errorHandler);

export default app;
