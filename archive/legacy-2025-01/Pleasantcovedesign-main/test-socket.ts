import { io } from 'socket.io-client';

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImJ1c2luZXNzSWQiOjEsInJvbGUiOiJhZG1pbiIsInNjb3BlIjoiYWRtaW4iLCJpYXQiOjE3NTk4OTY3MzAsImV4cCI6MTc1OTk4MzEzMH0.qS_rqx7eUqGrG7YuWmaHShAtsHbMnVGUqgEz_PLABQs";

console.log('Testing WebSocket connection with valid token...');

const socket = io('http://localhost:3000', {
  path: '/socket.io',
  transports: ['websocket'],
  auth: { token },
});

socket.on('connect', () => {
  console.log('✅ Connected successfully! Socket ID:', socket.id);
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
  console.log('Error type:', error.type);
  console.log('Error data:', error.data);
  process.exit(1);
});

setTimeout(() => {
  console.log('⏱️ Connection timeout');
  process.exit(1);
}, 5000);

