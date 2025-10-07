#!/usr/bin/env python3
"""
Minimal Messages Server - Provides /messages endpoint on port 5173
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import json
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app, origins=[
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8080'
])

# Sample messages data
messages = [
    {
        'id': 1,
        'sender_type': 'client',
        'sender_name': 'Tony Smith',
        'content': 'Hi, I saw your demo and I\'m interested in getting a website for my plumbing business.',
        'created_at': (datetime.now() - timedelta(days=1)).isoformat(),
        'attachments': []
    },
    {
        'id': 2,
        'sender_type': 'admin',
        'sender_name': 'Admin',
        'content': 'Great! I\'d be happy to help you get a professional website. What\'s your budget range?',
        'created_at': (datetime.now() - timedelta(hours=12)).isoformat(),
        'attachments': []
    },
    {
        'id': 3,
        'sender_type': 'client',
        'sender_name': 'Tony Smith',
        'content': 'I\'m thinking around $2,000-$3,000. Is that reasonable?',
        'created_at': (datetime.now() - timedelta(hours=6)).isoformat(),
        'attachments': []
    }
]

@app.route('/messages', methods=['GET'])
def get_messages():
    """Get all messages"""
    print('📨 GET /messages requested')
    return jsonify({
        'messages': messages,
        'total': len(messages),
        'hasMore': False
    })

@app.route('/messages', methods=['POST'])
def post_message():
    """Add a new message"""
    data = request.get_json()
    print('📝 POST /messages:', data)

    new_message = {
        'id': len(messages) + 1,
        'sender_type': data.get('sender_type', 'client'),
        'sender_name': data.get('sender_name', 'Anonymous'),
        'content': data.get('content', ''),
        'created_at': datetime.now().isoformat(),
        'attachments': data.get('attachments', [])
    }

    messages.append(new_message)

    return jsonify({
        'success': True,
        'message': new_message
    })

@app.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        'status': 'healthy',
        'service': 'minimal-messages-server',
        'port': 5173,
        'endpoints': ['/messages', '/health']
    })

if __name__ == '__main__':
    print('🚀 Minimal Messages Server starting on port 5173')
    print('📨 Messages endpoint: http://localhost:5173/messages')
    print('💚 Health check: http://localhost:5173/health')
    app.run(host='0.0.0.0', port=5173, debug=False)
