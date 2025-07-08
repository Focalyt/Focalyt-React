const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('./config');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // Map to store connected clients
    this.rooms = new Map(); // Map to store chat rooms
    
    this.init();
  }

  init() {
    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection established');
      
      // Extract token from query string or headers
      const token = this.extractToken(req);
      
      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      // Verify JWT token
      try {
        const decoded = jwt.verify(token, jwtSecret);
        ws.userId = decoded.id;
        ws.userType = decoded.userType; // college, candidate, company, admin
        ws.collegeId = decoded.collegeId;
        
        this.addClient(ws);
        this.sendWelcomeMessage(ws);
        
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        ws.close(1008, 'Invalid token');
        return;
      }

      // Handle incoming messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        this.removeClient(ws);
        console.log('WebSocket connection closed');
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.removeClient(ws);
      });
    });
  }

  extractToken(req) {
    // Try to get token from query string
    const url = new URL(req.url, `http://${req.headers.host}`);
    let token = url.searchParams.get('token');
    
    // If not in query string, try headers
    if (!token) {
      token = req.headers['x-auth'] || req.headers['authorization'];
      if (token && token.startsWith('Bearer ')) {
        token = token.substring(7);
      }
    }
    
    return token;
  }

  addClient(ws) {
    this.clients.set(ws.userId, ws);
    
    // Add to college room if it's a college user
    if (ws.userType === 'college' && ws.collegeId) {
      if (!this.rooms.has(ws.collegeId)) {
        this.rooms.set(ws.collegeId, new Set());
      }
      this.rooms.get(ws.collegeId).add(ws);
    }
    
    console.log(`Client ${ws.userId} (${ws.userType}) connected. Total clients: ${this.clients.size}`);
  }

  removeClient(ws) {
    this.clients.delete(ws.userId);
    
    // Remove from college room
    if (ws.userType === 'college' && ws.collegeId && this.rooms.has(ws.collegeId)) {
      this.rooms.get(ws.collegeId).delete(ws);
      if (this.rooms.get(ws.collegeId).size === 0) {
        this.rooms.delete(ws.collegeId);
      }
    }
    
    console.log(`Client ${ws.userId} disconnected. Total clients: ${this.clients.size}`);
  }

  sendWelcomeMessage(ws) {
    const welcomeMessage = {
      type: 'welcome',
      message: 'Connected to WhatsApp WebSocket server',
      userId: ws.userId,
      userType: ws.userType,
      timestamp: new Date().toISOString()
    };
    
    this.sendToClient(ws, welcomeMessage);
  }

  handleMessage(ws, message) {
    switch (message.type) {
      case 'whatsapp_message':
        this.handleWhatsAppMessage(ws, message);
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
        this.sendError(ws, 'Unknown message type');
    }
  }

  handleWhatsAppMessage(ws, message) {
    const { recipientId, content, messageType = 'text', templateId, variables } = message;
    
    // Validate message
    if (!recipientId || !content) {
      this.sendError(ws, 'Missing required fields: recipientId, content');
      return;
    }

    // Create message object
    const whatsappMessage = {
      type: 'whatsapp_message',
      senderId: ws.userId,
      senderType: ws.userType,
      recipientId,
      content,
      messageType,
      templateId,
      variables,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // Send to recipient if online
    const recipientWs = this.clients.get(recipientId);
    if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
      this.sendToClient(recipientWs, {
        ...whatsappMessage,
        status: 'delivered'
      });
    }

    // Send confirmation to sender
    this.sendToClient(ws, {
      type: 'message_sent',
      messageId: Date.now().toString(),
      timestamp: new Date().toISOString()
    });

    // Broadcast to college room if it's a college message
    if (ws.userType === 'college' && ws.collegeId) {
      this.broadcastToRoom(ws.collegeId, {
        type: 'whatsapp_activity',
        userId: ws.userId,
        action: 'message_sent',
        recipientId,
        timestamp: new Date().toISOString()
      }, ws); // Exclude sender
    }
  }

  handleJoinRoom(ws, message) {
    const { roomId } = message;
    
    if (!roomId) {
      this.sendError(ws, 'Room ID required');
      return;
    }

    // Add to room
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(ws);
    
    this.sendToClient(ws, {
      type: 'room_joined',
      roomId,
      timestamp: new Date().toISOString()
    });
  }

  handleLeaveRoom(ws, message) {
    const { roomId } = message;
    
    if (roomId && this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(ws);
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
      }
    }
    
    this.sendToClient(ws, {
      type: 'room_left',
      roomId,
      timestamp: new Date().toISOString()
    });
  }

  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  sendError(ws, error) {
    this.sendToClient(ws, {
      type: 'error',
      message: error,
      timestamp: new Date().toISOString()
    });
  }

  broadcastToRoom(roomId, message, excludeWs = null) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).forEach(client => {
        if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
          this.sendToClient(client, message);
        }
      });
    }
  }

  broadcastToAll(message, excludeWs = null) {
    this.clients.forEach(client => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        this.sendToClient(client, message);
      }
    });
  }

  sendToUser(userId, message) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      this.sendToClient(client, message);
    }
  }

  // Method to send WhatsApp notification
  sendWhatsAppNotification(userId, notification) {
    const message = {
      type: 'whatsapp_notification',
      notification,
      timestamp: new Date().toISOString()
    };
    
    this.sendToUser(userId, message);
  }

  // Method to send message status update
  sendMessageStatus(messageId, status, recipientId) {
    const message = {
      type: 'message_status',
      messageId,
      status,
      timestamp: new Date().toISOString()
    };
    
    this.sendToUser(recipientId, message);
  }

  // Get connected clients info
  getConnectedClients() {
    const clients = [];
    this.clients.forEach((ws, userId) => {
      clients.push({
        userId,
        userType: ws.userType,
        collegeId: ws.collegeId,
        connectedAt: ws.connectedAt
      });
    });
    return clients;
  }

  // Get room info
  getRoomInfo(roomId) {
    if (this.rooms.has(roomId)) {
      const clients = [];
      this.rooms.get(roomId).forEach(ws => {
        clients.push({
          userId: ws.userId,
          userType: ws.userType
        });
      });
      return {
        roomId,
        clientCount: clients.length,
        clients
      };
    }
    return null;
  }
}

module.exports = WebSocketServer; 