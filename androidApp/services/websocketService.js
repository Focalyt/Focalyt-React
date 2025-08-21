import apiService from './apiService';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000; // 5 seconds
    this.listeners = new Map();
    this.collegeId = null;
  }

  // Initialize WebSocket connection
  async connect() {
    try {
      // Get user data to determine college ID
      const user = await apiService.getCurrentUser();
      if (!user || !user.collegeId) {
        console.log('No user or college ID available for WebSocket connection');
        return false;
      }

      this.collegeId = user.collegeId;
      const token = apiService.getToken();
      
      if (!token) {
        console.log('No authentication token available for WebSocket connection');
        return false;
      }

      // Connect to WebSocket server
      const wsUrl = `ws://192.168.1.35:8080?token=${token}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Join college room for attendance updates
        this.joinCollegeRoom();
        
        // Emit connection event
        this.emit('connected', { timestamp: new Date().toISOString() });
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
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnected = false;
        
        // Emit disconnection event
        this.emit('disconnected', { 
          code: event.code, 
          reason: event.reason,
          timestamp: new Date().toISOString() 
        });
        
        // Attempt to reconnect if not manually closed
        if (event.code !== 1000) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', { 
          error: error.message || 'WebSocket error',
          timestamp: new Date().toISOString() 
        });
      };

      return true;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      return false;
    }
  }

  // Join college room for attendance updates
  joinCollegeRoom() {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        type: 'join_college_room'
      }));
    }
  }

  // Handle incoming messages
  handleMessage(message) {
    console.log('WebSocket message received:', message.type);
    
    switch (message.type) {
      case 'welcome':
        console.log('Welcome message:', message.message);
        break;
        
      case 'room_joined':
        console.log('Joined room:', message.roomId);
        break;
        
      case 'attendance_update':
        this.handleAttendanceUpdate(message.data);
        break;
        
      case 'pong':
        console.log('Pong received');
        break;
        
      case 'error':
        console.error('WebSocket error message:', message.message);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
    
    // Emit message event for general listeners
    this.emit('message', message);
  }

  // Handle attendance updates
  handleAttendanceUpdate(data) {
    console.log('Attendance update received:', data);
    
    // Emit specific attendance update event
    this.emit('attendance_update', data);
    
    // You can add specific logic here to update the UI
    // For example, show a notification or update the attendance display
  }

  // Send attendance update to server
  sendAttendanceUpdate(attendanceData) {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        type: 'attendance_update',
        data: attendanceData
      }));
    }
  }

  // Send ping to keep connection alive
  sendPing() {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        type: 'ping'
      }));
    }
  }

  // Attempt to reconnect
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      this.emit('reconnect_failed', { 
        attempts: this.reconnectAttempts,
        timestamp: new Date().toISOString() 
      });
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      collegeId: this.collegeId
    };
  }

  // Start ping interval to keep connection alive
  startPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendPing();
      }
    }, 30000); // Send ping every 30 seconds
  }

  // Stop ping interval
  stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

// Export singleton instance
const websocketService = new WebSocketService();
export default websocketService;
