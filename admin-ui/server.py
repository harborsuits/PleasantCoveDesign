#!/usr/bin/env python3
"""
Simple Admin UI Server for Pleasant Cove Design
Serves the admin interface HTML files
"""

import http.server
import socketserver
import os
import sys
from urllib.parse import urlparse, parse_qs

PORT = int(os.getenv('ADMIN_PORT', 5173))
ADMIN_DIR = "."

class AdminHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ADMIN_DIR, **kwargs)

    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_GET(self):
        # Parse the request
        parsed_path = urlparse(self.path)

        # Health check
        if parsed_path.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status": "healthy", "service": "admin-ui"}')
            return

        # Serve files normally
        super().do_GET()

    def log_message(self, format, *args):
        # Suppress logs for cleaner output
        pass

if __name__ == '__main__':
    print(f"🚀 Pleasant Cove Design Admin UI")
    print(f"📊 Dashboard: http://localhost:{PORT}")
    print(f"🔗 API: http://localhost:8080")
    print(f"🎨 Demos: http://localhost:8010")
    print(f"💚 Health: http://localhost:8003")
    print(f"Press Ctrl+C to stop")

    try:
        with socketserver.TCPServer(("", PORT), AdminHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Admin UI stopped")
        sys.exit(0)


