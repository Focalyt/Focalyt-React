const WebSocket = require('ws');

class WhatsAppWebSocketServer {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map of collegeId -> Set of WebSocket clients
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws/whatsapp' });

    this.wss.on('connection', (ws, req) => {
      console.log('🔌 New WebSocket connection established');
      console.log('📡 Client IP:', req.socket.remoteAddress);
      console.log('📡 Request URL:', req.url);

      // Handle authentication
      ws.on('message', (message) => {
        console.log('📨 Received message from client:', message.toString());
        try {
          const data = JSON.parse(message);

          // Register client with collegeId
          if (data.type === 'register' && data.collegeId) {
            console.log(`📝 Registration request for college: ${data.collegeId}`);
            this.registerClient(data.collegeId, ws);
            console.log(`✅ Client registered for college: ${data.collegeId}`);
            console.log(`📊 Total clients for college ${data.collegeId}: ${this.clients.get(data.collegeId)?.size || 0}`);
            console.log(`📊 All registered colleges:`, Array.from(this.clients.keys()));
            
            // Send confirmation
            ws.send(JSON.stringify({
              type: 'registered',
              collegeId: data.collegeId,
              timestamp: new Date().toISOString()
            }));
          }

          // Handle ping/pong for keep-alive
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
        this.unregisterClient(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Send initial connection message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'WebSocket connection established',
        timestamp: new Date().toISOString()
      }));
    });

    console.log('🚀 WhatsApp WebSocket server initialized');
  }

  registerClient(collegeId, ws) {
    if (!this.clients.has(collegeId)) {
      this.clients.set(collegeId, new Set());
    }
    this.clients.get(collegeId).add(ws);
    ws.collegeId = collegeId; // Store collegeId on the WebSocket object
  }

  unregisterClient(ws) {
    if (ws.collegeId && this.clients.has(ws.collegeId)) {
      this.clients.get(ws.collegeId).delete(ws);
      if (this.clients.get(ws.collegeId).size === 0) {
        this.clients.delete(ws.collegeId);
      }
    }
  }

  // Send WhatsApp notification to specific college
  sendWhatsAppNotification(collegeId, data) {
    if (!this.clients.has(collegeId)) {
      console.log(`⚠️ No active WebSocket clients for college: ${collegeId}`);
      return;
    }

    const clients = this.clients.get(collegeId);
    const message = JSON.stringify({
      ...data,
      timestamp: data.timestamp || new Date().toISOString()
    });

    let sentCount = 0;
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        sentCount++;
      }
    });

    console.log(`📤 Sent notification to ${sentCount} client(s) for college: ${collegeId}`);
  }

  // Broadcast to all clients
  broadcast(data) {
    const message = JSON.stringify(data);
    let sentCount = 0;

    this.clients.forEach((clientSet) => {
      clientSet.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
          sentCount++;
        }
      });
    });

    console.log(`📡 Broadcast to ${sentCount} client(s)`);
  }

  // Get stats
  getStats() {
    let totalClients = 0;
    this.clients.forEach((clientSet) => {
      totalClients += clientSet.size;
    });

    return {
      totalColleges: this.clients.size,
      totalClients: totalClients
    };
  }
}

// Export singleton instance
const wsServer = new WhatsAppWebSocketServer();
module.exports = wsServer;

