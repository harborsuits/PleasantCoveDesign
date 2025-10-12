import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes.js";
import { storage } from './storage.js';
import { attachSocket } from './socket.js';
import publicWs from './routes/public-ws.js';
import authRouter from './routes/auth.js';
import healthRouter from './routes/health.js';
import { webhooksRouter } from './routes/webhooks.js';
import { setupMonitoring } from './monitoring.js';

// Load environment variables FIRST before importing anything else
dotenv.config({ path: resolve(process.cwd(), '.env') });

// Debug: Log environment variable loading
console.log('🔧 Environment variables loaded');

import express, { type Express } from "express";
import cors from "cors";
// Lazily use R2 only if enabled
const STORAGE_BACKEND = process.env.STORAGE_BACKEND || 'local';
// import { createR2Storage } from './storage/r2-storage.js';
import { validateEnv } from './config/env.js';

// Validate environment variables
validateEnv();

// CORS allowlist for security - defined below with existing config

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 3000;

// Tune HTTP server timeouts for WebSocket/proxy environments
// Prevent premature disconnects behind proxies (e.g., Railway)
//  - requestTimeout 0 disables the per-request inactivity timeout
//  - keepAliveTimeout slightly above proxy idle thresholds
//  - headersTimeout slightly above keepAliveTimeout
// These do not affect WebSocket frames which are handled by Socket.IO.
// Note: Only available on Node >= 18
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
(server as any).requestTimeout = 0;
// @ts-ignore
(server as any).keepAliveTimeout = 65000;
// @ts-ignore
(server as any).headersTimeout = 66000;

// --- CORS Configuration ---
// CORS allowlist for security - now function-based for Squarespace subdomains
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "https://pleasantcovedesign.com",
  "http://www.pleasantcovedesign.com",
  "https://www.pleasantcovedesign.com",
  "https://pleasantcovedesign.squarespace.com",
  "https://harborsuit-iguana-5x29.squarespace.com",
  "https://pcd-production-clean-production-e6f3.up.railway.app",
  "https://pleasantcovedesign-production.up.railway.app",
  "http://localhost:8080", // Test server for widget testing
  "http://192.168.1.87:3000", // Local server via IP for mobile access
  "https://1ce2-2603-7080-e501-3f6a-59ca-c294-1beb-ddfc.ngrok-free.app", // ngrok for HTTPS compatibility
]);

// Merge additional origins from CORS_ORIGINS env (comma-separated)
const EXTRA_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);
for (const origin of EXTRA_ORIGINS) {
  ALLOWED_ORIGINS.add(origin);
}

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) return callback(null, true);
    callback(null, ALLOWED_ORIGINS.has(origin));
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: false,
};

console.log('🔧 CORS Allowed Origins:', Array.from(ALLOWED_ORIGINS));
app.use(cors(corsOptions));
// --- End of CORS Configuration ---

// Initialize Socket.io with robust configuration
const io = attachSocket(server);

// Store active connections by project token
const activeConnections = new Map<string, Set<string>>();

// Socket.io connection handling with Railway Pro support
io.on('connection', (socket) => {
  const clientInfo = {
    id: socket.id,
    transport: socket.conn.transport.name,
    origin: socket.handshake.headers.origin,
    userAgent: socket.handshake.headers['user-agent']
  };
  
  console.log('🔌 New socket connection:', clientInfo);
  
  // Log transport upgrades for Railway debugging
  socket.conn.on('upgrade', () => {
    console.log('⬆️ Socket transport upgraded to:', socket.conn.transport.name, 'for', socket.id);
  });
  
  socket.on('join', (projectToken: string, callback?: Function) => {
    if (!projectToken) {
      console.log('❌ No project token provided for socket:', socket.id);
      if (callback) callback({ error: 'No project token provided' });
      return;
    }
    
    console.log(`🏠 Socket ${socket.id} (${socket.conn.transport.name}) joining project: ${projectToken}`);
    
    // TODO: Validate project token exists (optional security check)
    // For now, allow all project tokens
    
    socket.join(projectToken);
    
    // Track active connections
    if (!activeConnections.has(projectToken)) {
      activeConnections.set(projectToken, new Set());
    }
    activeConnections.get(projectToken)!.add(socket.id);
    
    // Send confirmation with transport info
    const confirmationData = { 
      room: projectToken,
      projectToken, 
      status: 'connected',
      transport: socket.conn.transport.name,
      socketId: socket.id
    };
    
    socket.emit('joined', confirmationData);
    
    // Send callback response if provided
    if (callback) {
      callback({ 
        success: true, 
        room: projectToken,
        socketId: socket.id,
        transport: socket.conn.transport.name
      });
    }
    
    console.log(`✅ Socket ${socket.id} successfully joined project ${projectToken} via ${socket.conn.transport.name}`);
    
    // Log current room members for debugging
    io.in(projectToken).allSockets().then(clients => {
      console.log(`📊 Room ${projectToken} now has ${clients.size} clients`);
    });
  });
  
  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', socket.id, 'reason:', reason);
    
    // Remove from all active connections
    for (const [projectToken, connections] of activeConnections.entries()) {
      connections.delete(socket.id);
      if (connections.size === 0) {
        activeConnections.delete(projectToken);
      }
    }
  });
  
  socket.on('error', (error) => {
    console.error('🔌 Socket error for', socket.id, ':', error);
  });
  
  socket.on('connect_error', (error) => {
    console.error('🔌 Socket connect error for', socket.id, ':', error);
  });
});

// Export io for use in routes
export { io };

// Parse JSON bodies with increased limit for webhook data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from React build (if they exist)
const buildPath = path.join(__dirname, '../dist/client');
app.use(express.static(buildPath));

// Serve Lovable UI at /admin/
const lovableDist = path.join(__dirname, '../public/admin');
app.use('/admin', express.static(lovableDist, { index: false }));
// Serve assets (Vite outputs absolute /assets/* by default)
app.use('/assets', express.static(path.join(lovableDist, 'assets'), { immutable: true, maxAge: '365d' }));
app.use('/admin/assets', express.static(path.join(lovableDist, 'assets'), { immutable: true, maxAge: '365d' }));
// Mirror assets under /admin2 to bypass any proxy caches
app.use('/admin2/assets', express.static(path.join(lovableDist, 'assets'), { immutable: true, maxAge: '365d' }));
// Serve favicon from admin build
app.get('/favicon.ico', (req, res) => {
  const iconPath = path.join(lovableDist, 'favicon.ico');
  if (fs.existsSync(iconPath)) return res.sendFile(iconPath);
  res.status(404).end();
});
app.get('/admin', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(lovableDist, 'index.html'));
});
app.get('/admin/*', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(lovableDist, 'index.html'));
});
// Temporary alternate mount to bypass caches
app.get('/admin2', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(lovableDist, 'index.html'));
});
app.get('/admin2/*', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(lovableDist, 'index.html'));
});

// Mount full admin UI under /admin2 with cache headers
const oneYearSeconds = 31536000;
app.use('/admin2', express.static(lovableDist, {
  index: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store');
    } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      res.setHeader('Cache-Control', `public, max-age=${oneYearSeconds}, immutable`);
    }
  }
}));

// Serve embed bundle
const embedDist = path.join(__dirname, '../../packages/embed/dist');
app.use('/embed', express.static(embedDist, {
  setHeaders: (_res, fp) => {
    if (fp.endsWith('.js') || fp.endsWith('.cjs')) _res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    else _res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));

// Root should serve admin shell; redirect to /admin2 for now
app.get('/', (req, res) => {
  res.redirect(302, '/admin2');
});

// Use environment variable for uploads directory
const uploadsPath = process.env.UPLOADS_DIR || path.join(__dirname, '../uploads');

// Ensure directory exists
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Serve uploaded files from uploads directory with proper headers
app.use('/uploads', (req, res, next) => {
  // Add headers for cross-origin image access
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cache-Control', 'public, max-age=31536000'); // 1 year cache
  next();
}, express.static(uploadsPath));

// Helper function to get MIME type from filename
const getMimeType = (filename: string) => {
  const extension = path.extname(filename).toLowerCase();
  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream'; // Default binary type
  }
};

// Add OPTIONS handler for image proxy preflight requests
app.options('/api/image-proxy/:filename', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, ngrok-skip-browser-warning');
  res.header('ngrok-skip-browser-warning', 'true');
  res.header('X-Ngrok-Skip-Browser-Warning', 'true');
  res.status(200).end();
});

// Initialize R2 storage for production
const r2Storage = (STORAGE_BACKEND === 'r2' && (global as any).createR2Storage)
  ? (global as any).createR2Storage()
  : null as any;

// Add a mobile-friendly image proxy endpoint with R2 support
app.get('/api/image-proxy/:filename', async (req, res) => {
  const filename = req.params.filename;
  
  try {
    // Set CORS headers first (for both R2 and local)
    res.header('Access-Control-Allow-Origin', 'https://www.pleasantcovedesign.com');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, ngrok-skip-browser-warning');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Cache-Control', 'public, max-age=31536000');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('ngrok-skip-browser-warning', 'true');
    res.header('X-Ngrok-Skip-Browser-Warning', 'true');
    
    // First, always check local storage
    const imagePath = path.join(uploadsPath, filename);
    
    if (fs.existsSync(imagePath) && imagePath.startsWith(uploadsPath)) {
      // Serve from local storage if file exists
      const mimeType = getMimeType(filename);
      res.header('Content-Type', mimeType);
      
      console.log(`📁 Serving image from local storage: ${filename}`);
      res.sendFile(imagePath);
      return;
    }
    
    // If not found locally and R2 is configured, try R2 storage
    if (r2Storage) {
      console.log(`📁 Attempting to stream image from R2: ${filename}`);
      
      try {
        const signedUrl = await r2Storage.getFileUrl(filename);
        
        // Fetch the image from R2 server-side
        const response = await fetch(signedUrl);
        if (!response.ok) {
          console.error(`❌ R2 fetch failed for ${filename}:`, response.status, response.statusText);
          return res.status(404).json({ error: 'Image not found in R2 storage' });
        }
        
        // Set content type from R2 response
        const contentType = response.headers.get('content-type') || getMimeType(filename);
        res.header('Content-Type', contentType);
        
        // Stream the image bytes directly to the browser
        if (response.body) {
          console.log(`✅ Streaming ${filename} from R2 with CORS headers`);
          // Convert ReadableStream to Node.js readable stream
          const reader = response.body.getReader();
          const pump = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
              }
              res.end();
            } catch (error) {
              console.error('❌ Error streaming from R2:', error);
              res.status(500).end();
            }
          };
          pump();
        } else {
          return res.status(500).json({ error: 'No response body from R2' });
        }
        return;
      } catch (r2Error) {
        console.error(`❌ R2 error for ${filename}:`, r2Error);
        return res.status(404).json({ error: 'Image not found' });
      }
    }
    
    // If neither local nor R2 has the file
    console.error(`❌ Image not found anywhere: ${filename}`);
    return res.status(404).json({ error: 'Image not found' });
    
  } catch (error) {
    console.error('❌ Error serving image:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.1',
    services: {
      database: 'connected',
      webhooks: 'active'
    }
  });
});

// Enhanced webhook validation middleware
app.use('/api/new-lead', (req, res, next) => {
  console.log('=== SQUARESPACE WEBHOOK RECEIVED ===');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('IP:', req.ip);
  console.log('User-Agent:', req.get('User-Agent'));
  console.log('==========================================');
  next();
});

// Register all API routes
async function startServer() {
  try {
    // Register public WebSocket exchange routes (no auth required)
    console.log("🔗 [ROUTES] Mounting /api/public routes");
    app.use("/api/public", express.json(), publicWs);

    // Admin auth routes
    app.use("/api", authRouter);
    // Webhooks
    app.use('/webhooks', webhooksRouter());
    
    // Health check endpoint
    app.use("/api", healthRouter);

    // Register all other routes (includes admin routes with requireAdmin middleware)
    await registerRoutes(app, io);
    
    // Handle React Router - serve index.html for non-API routes
    app.get('*', (req, res) => {
      // Don't serve index.html for API routes
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      
      try {
        res.sendFile(path.join(buildPath, 'index.html'));
      } catch (error) {
        // If build doesn't exist, serve a simple development message
        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Pleasant Cove Design - Development</title>
              <style>
                body { font-family: system-ui; padding: 2rem; max-width: 800px; margin: 0 auto; }
                .status { padding: 1rem; background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; }
                .api-link { color: #0ea5e9; text-decoration: none; }
                .api-link:hover { text-decoration: underline; }
              </style>
            </head>
            <body>
              <h1>🚀 Pleasant Cove Design - WebsiteWizard</h1>
              <div class="status">
                <h2>✅ Server Running on Port ${PORT}</h2>
                <p>Backend API is active and ready for Squarespace integration!</p>
                <p><strong>Webhook Endpoint:</strong> <code>http://localhost:${PORT}/api/new-lead</code></p>
                <p><strong>Acuity Webhook:</strong> <code>http://localhost:${PORT}/api/acuity-appointment</code></p>
                <p><strong>Test API:</strong> <a href="/api/businesses?token=pleasantcove2024admin" class="api-link">View Businesses</a></p>
                <p><strong>Health Check:</strong> <a href="/health" class="api-link">Server Status</a></p>
              </div>
              <h3>Build React App</h3>
              <p>To see the full UI, run: <code>npm run build</code> then refresh this page.</p>
            </body>
          </html>
        `);
      }
    });

    // Setup monitoring
    setupMonitoring(app, io);
    
    console.log('🔄 About to start listening on port', PORT);
    server.listen(PORT, () => {
      console.log('✅ In-memory database initialized (empty - ready for real data)');
      console.log(`🚀 Pleasant Cove Design v1.1 server running on port ${PORT}`);
      console.log(`📍 Local: http://localhost:${PORT}`);
      console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/api/new-lead`);
      console.log(`💾 Database: SQLite (websitewizard.db)`);
      console.log(`🎯 Ready for Squarespace integration!`);
      
      // Railway Pro WebSocket info
      if (process.env.NODE_ENV === 'production') {
        console.log(`🚂 Railway Pro WebSocket support enabled`);
        console.log(`🔌 Socket.IO transports: websocket, polling`);
        console.log(`⚡ WebSocket upgrades supported`);
      } else {
        console.log(`🏠 Local development - WebSocket support active`);
      }
      

      
      console.log(`🚀 Server ready and waiting for webhooks!`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

// Enhanced error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } else {
    console.log('Server closed');
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } else {
    console.log('Server closed');
    process.exit(0);
  }
});

export default app; 