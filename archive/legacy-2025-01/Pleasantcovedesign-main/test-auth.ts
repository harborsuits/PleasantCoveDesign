import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env') });

// Test if the token we're using is valid
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImJ1c2luZXNzSWQiOjEsInJvbGUiOiJhZG1pbiIsInNjb3BlIjoiYWRtaW4iLCJpYXQiOjE3NTk4OTY3MzAsImV4cCI6MTc1OTk4MzEzMH0.qS_rqx7eUqGrG7YuWmaHShAtsHbMnVGUqgEz_PLABQs";
const secret = "pleasant-cove-dev-jwt-secret-2025";

console.log('Testing JWT authentication...');
console.log('JWT_SECRET from env:', process.env.JWT_SECRET);
console.log('Expected secret:', secret);

try {
  const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
  console.log('✅ Token is VALID with expected secret');
  console.log('Decoded:', decoded);
} catch (error) {
  console.log('❌ Token INVALID with expected secret:', error.message);
}

// Also test with env variable
if (process.env.JWT_SECRET) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    console.log('✅ Token is VALID with env JWT_SECRET');
  } catch (error) {
    console.log('❌ Token INVALID with env JWT_SECRET:', error.message);
  }
}
