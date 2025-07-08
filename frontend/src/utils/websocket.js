class WebSocketClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.isConnecting = false;
    this.messageHandlers = new Map();
    this.connectionHandlers = new Map();
    this.token = null;
    this.baseUrl = process.env.REACT_APP_MIPIE_BACKEND_URL || 'http://localhost:3000';
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
  }

  // Connect to WebSocket server
  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      // Create WebSocket URL with token
      const wsUrl = this.baseUrl.replace('http', 'ws');
      const url = `${wsUrl}?token=${this.token}`;
      
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.triggerConnectionHandlers('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        this.isConnecting = false;
        this.triggerConnectionHandlers('disconnected');
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.triggerConnectionHandlers('error', error);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.isConnecting = false;
      this.triggerConnectionHandlers('error', error);
    }
  }

  // Schedule reconnection attempt
  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
        this.connect();
      }
    }, delay);
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  // Send message to WebSocket server
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
      throw new Error('WebSocket is not connected');
    }
  }

  // Send WhatsApp message
  sendWhatsAppMessage(recipientId, content, messageType = 'text', templateId = null, variables = null) {
    const message = {
      type: 'whatsapp_message',
      recipientId,
      content,
      messageType,
      templateId,
      variables
    };
    this.send(message);
  }

  // Join a room
  joinRoom(roomId) {
    const message = {
      type: 'join_room',
      roomId
    };
    this.send(message);
  }

  // Leave a room
  leaveRoom(roomId) {
    const message = {
      type: 'leave_room',
      roomId
    };
    this.send(message);
  }

  // Send ping to keep connection alive
  ping() {
    const message = {
      type: 'ping'
    };
    this.send(message);
  }

  // Handle incoming messages
  handleMessage(message) {
    const { type } = message;
    
    // Trigger message handlers
    if (this.messageHandlers.has(type)) {
      this.messageHandlers.get(type).forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in message handler for type ${type}:`, error);
        }
      });
    }

    // Handle specific message types
    switch (type) {
      case 'welcome':
        console.log('Welcome message received:', message);
        break;
      case 'pong':
        console.log('Pong received:', message);
        break;
      case 'error':
        console.error('WebSocket error message:', message);
        break;
      case 'whatsapp_notification':
        console.log('WhatsApp notification received:', message);
        break;
      case 'message_sent':
        console.log('Message sent confirmation:', message);
        break;
      case 'message_status':
        console.log('Message status update:', message);
        break;
      case 'bulk_message_completed':
        console.log('Bulk message completed:', message);
        break;
      case 'config_updated':
        console.log('Configuration updated:', message);
        break;
      default:
        console.log('Unknown message type:', type, message);
    }
  }

  // Register message handler
  onMessage(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type).push(handler);
  }

  // Remove message handler
  offMessage(type, handler) {
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Register connection handler
  onConnection(event, handler) {
    if (!this.connectionHandlers.has(event)) {
      this.connectionHandlers.set(event, []);
    }
    this.connectionHandlers.get(event).push(handler);
  }

  // Remove connection handler
  offConnection(event, handler) {
    if (this.connectionHandlers.has(event)) {
      const handlers = this.connectionHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Trigger connection handlers
  triggerConnectionHandlers(event, data = null) {
    if (this.connectionHandlers.has(event)) {
      this.connectionHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in connection handler for event ${event}:`, error);
        }
      });
    }
  }

  // Get connection status
  getConnectionStatus() {
    if (!this.ws) {
      return 'disconnected';
    }
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }

  // Check if connected
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  // Start heartbeat to keep connection alive
  startHeartbeat(interval = 30000) { // 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.ping();
      }
    }, interval);
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Create singleton instance
const websocketClient = new WebSocketClient();

export default websocketClient; 