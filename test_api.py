#!/usr/bin/env python3
"""
Simple test API server for Pleasant Cove Design
"""

from flask import Flask, jsonify
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)

start_time = time.time()

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "uptime_seconds": int(time.time() - start_time),
        "service": "pleasant-cove-api"
    })

@app.route('/api/v1/test')
def test():
    return jsonify({"message": "Pleasant Cove API is working!"})

if __name__ == '__main__':
    port = int(__import__('os').getenv('API_PORT', 8080))
    print(f"Starting Pleasant Cove API on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)


