
import http.server
import json
import time

start_time = time.time()
requests = 0

class HealthHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        global requests
        requests += 1

        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "http://localhost:5173")
            self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.end_headers()

            data = {
                "status": "healthy",
                "uptime_seconds": int(time.time() - start_time),
                "request_count": requests,
                "service": "minimal-gateway"
            }
            self.wfile.write(json.dumps(data).encode())
        else:
            self.send_response(404)
            self.send_header("Access-Control-Allow-Origin", "http://localhost:5173")
            self.end_headers()

    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "http://localhost:5173")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        pass  # Suppress logs

print("Minimal health server running on :8003")
server = http.server.HTTPServer(("", 8003), HealthHandler)
server.serve_forever()
