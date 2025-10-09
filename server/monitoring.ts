import { Express } from 'express';
import { Server } from 'socket.io';

export function setupMonitoring(app: Express, io?: Server) {
  // Basic metrics endpoint
  app.get('/api/metrics', (req, res) => {
    res.json({
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      connections: io ? io.engine.clientsCount : 0,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    });
  });
  
  // Log important events
  process.on('uncaughtException', (error) => {
    console.error('🔥 Uncaught Exception:', error);
    console.error(error.stack);
    // In production, you might want to gracefully shutdown
    if (process.env.NODE_ENV === 'production') {
      console.error('💀 Shutting down due to uncaught exception...');
      process.exit(1);
    }
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️  Unhandled Rejection at:', promise, 'reason:', reason);
    // In production, log to error tracking service
  });
  
  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received, shutting down gracefully...');
    if (io) {
      io.close(() => {
        console.log('✅ Socket.IO connections closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
  
  console.log('📊 Monitoring setup complete');
}
