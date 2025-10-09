// Test JWT authentication
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'pleasant-cove-dev-jwt-secret-2025';

// Create a test token (same as what the admin login would create)
const adminToken = jwt.sign(
  { 
    userId: 1,
    businessId: 1,
    role: 'admin',
    scope: 'admin'
  },
  JWT_SECRET,
  { algorithm: 'HS256', expiresIn: '24h' }
);

console.log('Generated admin token:');
console.log(adminToken);
console.log('\nTo use this token:');
console.log('1. Open browser console at http://localhost:5173');
console.log('2. Run: localStorage.setItem("auth_token", "' + adminToken + '")');
console.log('3. Refresh the page');
console.log('\nThe WebSocket should now connect successfully!');

// Verify the token works
try {
  const decoded = jwt.verify(adminToken, JWT_SECRET, { algorithms: ['HS256'] });
  console.log('\nToken verification successful:', decoded);
} catch (error) {
  console.error('Token verification failed:', error);
}

