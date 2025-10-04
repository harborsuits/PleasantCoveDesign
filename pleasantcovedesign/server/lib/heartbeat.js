/**
 * Adds WebSocket heartbeat to detect and clean up dead connections
 * @param {import('ws').WebSocketServer} wss The WebSocket server instance
 */
function attachHeartbeat(wss) {
  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
  });
  
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      try { ws.ping(); } catch {}
    });
  }, 15000);
  
  wss.on('close', () => clearInterval(interval));
  
  return interval;
}

module.exports = { attachHeartbeat };
