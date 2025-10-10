export function validateEnv() {
  const required = ['ADMIN_TOKEN', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Set defaults for optional vars
  process.env.PORT = process.env.PORT || '3000';
  process.env.UPLOADS_DIR = process.env.UPLOADS_DIR || './uploads';
  process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || 'http://localhost:5173';
}
