#!/usr/bin/env python3
"""
Simple Messages Server - Built-in HTTP server for /messages endpoint
"""

import http.server
import socketserver
import json
from datetime import datetime, timedelta
from urllib.parse import parse_qs, urlparse
import threading

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

class MessagesHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/messages':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()

            response = {
                'messages': messages,
                'total': len(messages),
                'hasMore': False
            }
            self.wfile.write(json.dumps(response).encode())
            print('📨 Served messages via GET')

        elif self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            response = {
                'status': 'healthy',
                'service': 'simple-messages-server',
                'port': 5173
            }
            self.wfile.write(json.dumps(response).encode())

        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Not found'}).encode())

    def do_POST(self):
        if self.path == '/messages':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode())

            new_message = {
                'id': len(messages) + 1,
                'sender_type': data.get('sender_type', 'client'),
                'sender_name': data.get('sender_name', 'Anonymous'),
                'content': data.get('content', ''),
                'created_at': datetime.now().isoformat(),
                'attachments': data.get('attachments', [])
            }

            messages.append(new_message)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()

            self.wfile.write(json.dumps({
                'success': True,
                'message': new_message
            }).encode())
            print(f'📝 Added new message: {new_message["content"][:50]}...')

        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Not found'}).encode())

    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, format, *args):
        # Suppress default logging
        pass

def run_server():
    try:
        with socketserver.TCPServer(("", 5174), MessagesHandler) as httpd:
            print("🚀 Simple Messages Server running on port 5174")
            print("📨 Messages endpoint: http://localhost:5174/messages")
            print("💚 Health check: http://localhost:5174/health")
            print("Press Ctrl+C to stop")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("Server stopped")
    except Exception as e:
        print(f"Server error: {e}")

if __name__ == '__main__':
    run_server()
