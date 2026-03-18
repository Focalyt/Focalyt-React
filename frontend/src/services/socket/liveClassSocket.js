import { io } from 'socket.io-client';

class LiveClassSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  /**
   * Connect to live class socket server
   */
  connect(userId, userName, userRole, token) {
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL || 'http://localhost:5000';

    this.socket = io(backendUrl, {
      query: {
        userId: userId,
        userName: userName,
        role: userRole || 'student'
      },
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Live Class Socket connected:', this.socket.id);
      this.isConnected = true;
      this.emit('live-class:connected', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Live Class Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Live Class Socket connection error:', error);
    });

    return this.socket;
  }

  /**
   * Disconnect from socket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Emit event to server
   */
  emit(event, data, callback) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      if (callback) callback({ error: 'Socket not connected' });
      return;
    }

    if (callback) {
      this.socket.emit(event, data, callback);
    } else {
      this.socket.emit(event, data);
    }
  }

  /**
   * Listen to server events
   */
  on(event, callback) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    this.socket.on(event, callback);

    // Store listener for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event) {
    if (!this.socket) return;
    this.socket.removeAllListeners(event);
    this.listeners.delete(event);
  }

  // ==================== ROOM MANAGEMENT ====================

  /**
   * Create a new live class room (Trainer only)
   */
  createRoom(classId, batchId, courseId, callback) {
    this.emit('live-class:create-room', {
      classId,
      batchId,
      courseId
    }, callback);
  }

  /**
   * Join a live class room
   */
  joinRoom(classId, callback) {
    this.emit('live-class:join-room', {
      classId
    }, callback);
  }

  /**
   * Leave a live class room
   */
  leaveRoom(classId) {
    this.emit('live-class:leave-room', {
      classId
    });
  }

  // ==================== WEBRTC SIGNALING ====================

  /**
   * Create transport (send or receive)
   */
  createTransport(direction, callback) {
    this.emit('live-class:create-transport', {
      direction // 'send' or 'recv'
    }, callback);
  }

  /**
   * Connect transport
   */
  connectTransport(transportId, dtlsParameters, callback) {
    this.emit('live-class:connect-transport', {
      transportId,
      dtlsParameters
    }, callback);
  }

  /**
   * Produce (publish media)
   */
  produce(transportId, kind, rtpParameters, callback) {
    this.emit('live-class:produce', {
      transportId,
      kind, // 'video' or 'audio'
      rtpParameters
    }, callback);
  }

  /**
   * Get list of available producers
   */
  getProducers(callback) {
    this.emit('live-class:get-producers', {}, callback);
  }

  /**
   * Consume (subscribe to media)
   */
  consume(producerId, rtpCapabilities, callback) {
    this.emit('live-class:consume', {
      producerId,
      rtpCapabilities
    }, callback);
  }

  // ==================== CHAT ====================

  /**
   * Send chat message
   */
  sendChatMessage(classId, message) {
    this.emit('live-class:chat-message', {
      classId,
      message
    });
  }

  // ==================== ROOM EVENTS ====================

  /**
   * Listen to room events
   */
  onRoomCreated(callback) {
    this.on('live-class:room-created', callback);
  }

  onUserJoined(callback) {
    this.on('live-class:user-joined', callback);
  }

  onUserLeft(callback) {
    this.on('live-class:user-left', callback);
  }

  onNewProducer(callback) {
    this.on('live-class:new-producer', callback);
  }

  onProducerClosed(callback) {
    this.on('live-class:producer-closed', callback);
  }

  onChatMessage(callback) {
    this.on('live-class:chat-message', callback);
  }

  onClassEnded(callback) {
    this.on('live-class:ended', callback);
  }

  onError(callback) {
    this.on('live-class:error', callback);
  }

  // ==================== CLEANUP ====================

  /**
   * Cleanup all listeners
   */
  cleanup() {
    if (this.socket) {
      // Remove all custom listeners
      for (const [event, callbacks] of this.listeners.entries()) {
        callbacks.forEach(callback => {
          this.socket.off(event, callback);
        });
      }
      this.listeners.clear();
      
      // Disconnect
      this.disconnect();
    }
  }
}

// Export singleton instance
const liveClassSocketService = new LiveClassSocketService();
export default liveClassSocketService;
