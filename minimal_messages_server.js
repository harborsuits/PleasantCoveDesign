#!/usr/bin/env node

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5173;

// Enable CORS for frontend development
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));

app.use(express.json());

// Sample messages data
const messages = [
  {
    id: 1,
    sender_type: 'client',
    sender_name: 'Tony Smith',
    content: 'Hi, I saw your demo and I\'m interested in getting a website for my plumbing business.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    attachments: []
  },
  {
    id: 2,
    sender_type: 'admin',
    sender_name: 'Admin',
    content: 'Great! I\'d be happy to help you get a professional website. What\'s your budget range?',
    created_at: new Date(Date.now() - 43200000).toISOString(),
    attachments: []
  },
  {
    id: 3,
    sender_type: 'client',
    sender_name: 'Tony Smith',
    content: 'I\'m thinking around $2,000-$3,000. Is that reasonable?',
    created_at: new Date(Date.now() - 21600000).toISOString(),
    attachments: []
  }
];

// Messages endpoint
app.get('/messages', (req, res) => {
  console.log('📨 GET /messages requested');
  res.json({
    messages: messages,
    total: messages.length,
    hasMore: false
  });
});

// POST messages endpoint
app.post('/messages', (req, res) => {
  console.log('📝 POST /messages:', req.body);

  const newMessage = {
    id: messages.length + 1,
    sender_type: req.body.sender_type || 'client',
    sender_name: req.body.sender_name || 'Anonymous',
    content: req.body.content || '',
    created_at: new Date().toISOString(),
    attachments: req.body.attachments || []
  };

  messages.push(newMessage);

  res.json({
    success: true,
    message: newMessage
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'minimal-messages-server',
    port: PORT,
    endpoints: ['/messages', '/health']
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Minimal Messages Server running on port ${PORT}`);
  console.log(`📨 Messages endpoint: http://localhost:${PORT}/messages`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});
