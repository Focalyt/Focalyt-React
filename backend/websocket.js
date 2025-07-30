const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { College, WhatsAppMessage } = require('./controllers/models');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // Store connected clients
    this.rooms = new Map(); // Store room subscriptions
    
    this.setupEventHandlers();
    console.log('WebSocket server initialized');
  }

  setupEventHandlers() {
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });
  }

  async handleConnection(ws, req) {
    try {
      // Extract token from query parameters or headers
      const token = this.extractToken(req);
      
      // For attendance system, allow connections without token
      if (!token) {
        // Allow anonymous connections for attendance system
        this.handleAnonymousConnection(ws);
        return;
      }

      // Verify token and get user info
      const userInfo = await this.verifyToken(token);
      if (!userInfo) {
        ws.close(1008, 'Invalid token');
        return;
      }

      // Store client information
      this.clients.set(ws, {
        userId: userInfo.userId,
        userType: userInfo.userType,
        collegeId: userInfo.collegeId,
        connectedAt: new Date()
      });

      // Send welcome message
      this.sendToClient(ws, {
        type: 'welcome',
        message: 'Connected to WebSocket server',
        userId: userInfo.userId,
        userType: userInfo.userType,
        timestamp: new Date().toISOString()
      });

      console.log(`Client connected: ${userInfo.userType} - ${userInfo.userId}`);

      // Handle incoming messages
      ws.on('message', (data) => {
        this.handleMessage(ws, data);
      });

      // Handle disconnection
      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnection(ws);
      });

    } catch (error) {
      console.error('Connection error:', error);
      ws.close(1011, 'Internal server error');
    }
  }

  handleAnonymousConnection(ws) {
    // Store anonymous client for attendance system
    this.clients.set(ws, {
      userId: 'anonymous',
      userType: 'attendance',
      connectedAt: new Date()
    });

    console.log('Anonymous client connected for attendance system');

    // Handle incoming messages
    ws.on('message', (data) => {
      this.handleMessage(ws, data);
    });

    // Handle disconnection
    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleDisconnection(ws);
    });
  }

  extractToken(req) {
    // Try to get token from query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    let token = url.searchParams.get('token');

    // If not in query, try Authorization header
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.replace('Bearer ', '');
    }

    return token;
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Get user details from database
      if (decoded.userType === 'college') {
        const college = await College.findById(decoded.userId);
        if (!college) return null;
        
        return {
          userId: college._id.toString(),
          userType: 'college',
          collegeId: college._id.toString()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  handleMessage(ws, data) {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'whatsapp_message':
          this.handleWhatsAppMessage(ws, message);
          break;
          
        case 'location_update':
          this.handleLocationUpdate(ws, message);
          break;
          
        case 'join_room':
          this.handleJoinRoom(ws, message);
          break;
          
        case 'leave_room':
          this.handleLeaveRoom(ws, message);
          break;
          
        case 'ping':
          this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendToClient(ws, {
        type: 'error',
        message: 'Invalid message format',
        timestamp: new Date().toISOString()
      });
    }
  }

  async handleWhatsAppMessage(ws, message) {
    const client = this.clients.get(ws);
    if (!client || client.userType !== 'college') {
      this.sendToClient(ws, {
        type: 'error',
        message: 'Unauthorized to send WhatsApp messages',
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      // Here you would integrate with WhatsApp Business API
      // For now, we'll simulate the process
      
      // Send notification to client
      this.sendToClient(ws, {
        type: 'whatsapp_notification',
        notification: {
          type: 'message_sent',
          messageId: `msg_${Date.now()}`,
          recipientPhone: message.recipientId,
          status: 'sent',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });

      // Broadcast to room if specified
      if (message.roomId) {
        this.broadcastToRoom(message.roomId, {
          type: 'whatsapp_notification',
          notification: {
            type: 'message_sent',
            messageId: `msg_${Date.now()}`,
            recipientPhone: message.recipientId,
            status: 'sent',
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('WhatsApp message error:', error);
      this.sendToClient(ws, {
        type: 'whatsapp_notification',
        notification: {
          type: 'message_error',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  handleLocationUpdate(ws, message) {
    const client = this.clients.get(ws);
    console.log(
      `Location update from ${message.employeeId}:`,
      message.location
    );

    // Broadcast location update to all other clients
    this.wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        this.sendToClient(client, {
          type: 'location_broadcast',
          employeeId: message.employeeId,
          location: message.location,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  handleJoinRoom(ws, message) {
    const roomId = message.roomId;
    if (!roomId) return;

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    
    this.rooms.get(roomId).add(ws);
    console.log(`Client joined room: ${roomId}`);
  }

  handleLeaveRoom(ws, message) {
    const roomId = message.roomId;
    if (!roomId || !this.rooms.has(roomId)) return;

    this.rooms.get(roomId).delete(ws);
    console.log(`Client left room: ${roomId}`);
  }

  handleDisconnection(ws) {
    const client = this.clients.get(ws);
    if (client) {
      console.log(`Client disconnected: ${client.userType} - ${client.userId}`);
      
      // Remove from all rooms
      this.rooms.forEach((clients, roomId) => {
        if (clients.has(ws)) {
          clients.delete(ws);
        }
      });
      
      this.clients.delete(ws);
    }
  }

  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  broadcastToRoom(roomId, message) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.forEach(client => {
      this.sendToClient(client, message);
    });
  }

  broadcastToAll(message) {
    this.wss.clients.forEach(client => {
      this.sendToClient(client, message);
    });
  }

  // Method to send WhatsApp notifications from API routes
  sendWhatsAppNotification(userId, notification) {
    this.wss.clients.forEach(client => {
      const clientInfo = this.clients.get(client);
      if (clientInfo && clientInfo.userId === userId) {
        this.sendToClient(client, {
          type: 'whatsapp_notification',
          notification,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  // Get connection statistics
  getStats() {
    return {
      totalClients: this.clients.size,
      totalRooms: this.rooms.size,
      connectedClients: Array.from(this.clients.values()).map(client => ({
        userId: client.userId,
        userType: client.userType,
        connectedAt: client.connectedAt
      }))
    };
  }
}

module.exports = WebSocketServer;