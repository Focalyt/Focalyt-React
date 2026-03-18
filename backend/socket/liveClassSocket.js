const { v4: uuidv4 } = require('uuid');
const { LiveClass, ClassAttendance, ClassChatMessage } = require('../controllers/models');
const mediaSoupServer = require('../services/mediasoup/server');

// Store active connections: classId -> Set of socketIds
const activeRooms = new Map(); // classId -> Set of socketIds
// Store user info: socketId -> { userId, userName, role, classId, producerId }
const socketUserMap = new Map();
// Store transports: socketId -> { sendTransport, recvTransport }
const socketTransportMap = new Map();

/**
 * Initialize live class socket handlers
 */
function initializeLiveClassSocket(io) {
  console.log('✅ Initializing Live Class Socket handlers...');

  // Socket middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    const userId = socket.handshake.query.userId;
    
    if (!userId) {
      return next(new Error('User ID required'));
    }
    
    // TODO: Verify JWT token here
    // For now, just check if userId exists
    socket.userId = userId;
    socket.userName = socket.handshake.query.userName || 'Unknown User';
    socket.userRole = socket.handshake.query.role || 'student';
    
    next();
  });

  io.on('connection', (socket) => {
    console.log(`✅ Live Class Socket connected: ${socket.id} (User: ${socket.userId})`);

    // ==================== ROOM MANAGEMENT ====================

    /**
     * Create a new live class room
     */
    socket.on('live-class:create-room', async (data, callback) => {
      try {
        const { classId, batchId, courseId } = data;

        if (socket.userRole !== 'trainer') {
          return callback({ error: 'Only trainers can create rooms' });
        }

        // Verify class exists
        const liveClass = await LiveClass.findById(classId);
        if (!liveClass) {
          return callback({ error: 'Class not found' });
        }

        // Create mediasoup room
        const roomId = `room_${classId}_${uuidv4()}`;
        await mediaSoupServer.createRoom(roomId);

        // Update LiveClass with roomId
        liveClass.roomId = roomId;
        liveClass.status = 'live';
        liveClass.startedAt = new Date();
        await liveClass.save();

        // Initialize room tracking
        if (!activeRooms.has(classId)) {
          activeRooms.set(classId, new Set());
        }
        activeRooms.get(classId).add(socket.id);

        socket.join(`live-class:${classId}`);
        socketUserMap.set(socket.id, {
          userId: socket.userId,
          userName: socket.userName,
          role: socket.userRole,
          classId: classId,
          roomId: roomId
        });

        callback({ success: true, roomId, classId });
        socket.emit('live-class:room-created', { classId, roomId });

        console.log(`✅ Room created: ${roomId} for class ${classId}`);
      } catch (error) {
        console.error('❌ Error creating room:', error);
        callback({ error: error.message });
      }
    });

    /**
     * Join a live class room
     */
    socket.on('live-class:join-room', async (data, callback) => {
      try {
        const { classId } = data;

        // Verify class exists and is live
        const liveClass = await LiveClass.findById(classId);
        if (!liveClass) {
          return callback({ error: 'Class not found' });
        }

        if (liveClass.status !== 'live') {
          return callback({ error: 'Class is not live' });
        }

        // TODO: Verify user enrollment/permissions

        // Join socket room
        socket.join(`live-class:${classId}`);

        // Track user in room
        if (!activeRooms.has(classId)) {
          activeRooms.set(classId, new Set());
        }
        activeRooms.get(classId).add(socket.id);

        // Store user info
        socketUserMap.set(socket.id, {
          userId: socket.userId,
          userName: socket.userName,
          role: socket.userRole,
          classId: classId,
          roomId: liveClass.roomId
        });

        // Mark attendance
        const attendance = new ClassAttendance({
          classId: classId,
          userId: socket.userId,
          batchId: liveClass.batchId,
          courseId: liveClass.courseId,
          status: 'present',
          joinTime: new Date(),
          ipAddress: socket.handshake.address,
          userAgent: socket.handshake.headers['user-agent']
        });
        await attendance.save();

        // Update participant count
        liveClass.currentParticipants = activeRooms.get(classId).size;
        await liveClass.save();

        // Notify others
        socket.to(`live-class:${classId}`).emit('live-class:user-joined', {
          userId: socket.userId,
          userName: socket.userName,
          role: socket.userRole
        });

        // Get router capabilities for WebRTC
        const rtpCapabilities = mediaSoupServer.getRouterCapabilities(liveClass.roomId);

        callback({
          success: true,
          classId,
          roomId: liveClass.roomId,
          rtpCapabilities
        });

        socket.emit('live-class:connected', {
          socketId: socket.id,
          classId
        });

        console.log(`✅ User ${socket.userId} joined class ${classId}`);
      } catch (error) {
        console.error('❌ Error joining room:', error);
        callback({ error: error.message });
      }
    });

    /**
     * Leave room
     */
    socket.on('live-class:leave-room', async (data) => {
      try {
        const userInfo = socketUserMap.get(socket.id);
        if (!userInfo) return;

        const { classId } = userInfo;

        // Leave socket room
        socket.leave(`live-class:${classId}`);

        // Update attendance
        const attendance = await ClassAttendance.findOne({
          classId: classId,
          userId: socket.userId,
          leaveTime: null
        });

        if (attendance) {
          const leaveTime = new Date();
          const duration = Math.floor((leaveTime - attendance.joinTime) / 1000 / 60); // minutes
          attendance.leaveTime = leaveTime;
          attendance.duration = duration;
          await attendance.save();
        }

        // Remove from tracking
        if (activeRooms.has(classId)) {
          activeRooms.get(classId).delete(socket.id);
          
          // Update participant count
          const liveClass = await LiveClass.findById(classId);
          if (liveClass) {
            liveClass.currentParticipants = activeRooms.get(classId).size;
            await liveClass.save();
          }
        }

        // Cleanup transports
        const transports = socketTransportMap.get(socket.id);
        if (transports) {
          if (transports.sendTransport) transports.sendTransport.close();
          if (transports.recvTransport) transports.recvTransport.close();
          socketTransportMap.delete(socket.id);
        }

        // Notify others
        socket.to(`live-class:${classId}`).emit('live-class:user-left', {
          userId: socket.userId,
          userName: socket.userName
        });

        socketUserMap.delete(socket.id);

        console.log(`✅ User ${socket.userId} left class ${classId}`);
      } catch (error) {
        console.error('❌ Error leaving room:', error);
      }
    });

    // ==================== WEBRTC SIGNALING (mediasoup) ====================

    /**
     * Create transport (send or receive)
     */
    socket.on('live-class:create-transport', async (data, callback) => {
      try {
        const userInfo = socketUserMap.get(socket.id);
        if (!userInfo) {
          return callback({ error: 'Not in a room' });
        }

        const { direction } = data;
        const transport = await mediaSoupServer.createTransport(
          userInfo.roomId,
          direction
        );

        // Store transport
        if (!socketTransportMap.has(socket.id)) {
          socketTransportMap.set(socket.id, {});
        }
        
        if (direction === 'send') {
          socketTransportMap.get(socket.id).sendTransport = transport;
        } else {
          socketTransportMap.get(socket.id).recvTransport = transport;
        }

        callback({
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters
        });
      } catch (error) {
        console.error('❌ Error creating transport:', error);
        callback({ error: error.message });
      }
    });

    /**
     * Connect transport
     */
    socket.on('live-class:connect-transport', async (data, callback) => {
      try {
        const { transportId, dtlsParameters } = data;
        const transports = socketTransportMap.get(socket.id);
        
        if (!transports) {
          return callback({ error: 'Transport not found' });
        }

        const transport = transports.sendTransport?.id === transportId
          ? transports.sendTransport
          : transports.recvTransport?.id === transportId
          ? transports.recvTransport
          : null;

        if (!transport) {
          return callback({ error: 'Transport not found' });
        }

        await transport.connect({ dtlsParameters });
        callback({ success: true });
      } catch (error) {
        console.error('❌ Error connecting transport:', error);
        callback({ error: error.message });
      }
    });

    /**
     * Produce (publish media)
     */
    socket.on('live-class:produce', async (data, callback) => {
      try {
        const { transportId, kind, rtpParameters } = data;
        const userInfo = socketUserMap.get(socket.id);
        
        if (!userInfo) {
          return callback({ error: 'Not in a room' });
        }

        const transports = socketTransportMap.get(socket.id);
        const transport = transports?.sendTransport;

        if (!transport || transport.id !== transportId) {
          return callback({ error: 'Transport not found' });
        }

        const producer = await mediaSoupServer.createProducer(
          transport,
          rtpParameters,
          kind
        );

        // Store producer info
        userInfo.producerId = producer.id;
        socketUserMap.set(socket.id, userInfo);

        // Notify others about new producer
        socket.to(`live-class:${userInfo.classId}`).emit('live-class:new-producer', {
          producerId: producer.id,
          userId: socket.userId,
          userName: socket.userName,
          kind: kind
        });

        callback({ producerId: producer.id });

        console.log(`✅ Producer created: ${producer.id} (${kind}) for user ${socket.userId}`);
      } catch (error) {
        console.error('❌ Error producing:', error);
        callback({ error: error.message });
      }
    });

    /**
     * Get list of available producers to consume
     */
    socket.on('live-class:get-producers', async (data, callback) => {
      try {
        const userInfo = socketUserMap.get(socket.id);
        if (!userInfo) {
          return callback({ error: 'Not in a room' });
        }

        const producers = mediaSoupServer.getRoomProducers(userInfo.roomId);
        callback({ producers });
      } catch (error) {
        console.error('❌ Error getting producers:', error);
        callback({ error: error.message });
      }
    });

    /**
     * Consume (subscribe to media)
     */
    socket.on('live-class:consume', async (data, callback) => {
      try {
        const { producerId, rtpCapabilities } = data;
        const userInfo = socketUserMap.get(socket.id);
        
        if (!userInfo) {
          return callback({ error: 'Not in a room' });
        }

        const transports = socketTransportMap.get(socket.id);
        const transport = transports?.recvTransport;

        if (!transport) {
          return callback({ error: 'Receive transport not found' });
        }

        const consumer = await mediaSoupServer.createConsumer(
          transport,
          producerId,
          rtpCapabilities
        );

        callback({
          consumerId: consumer.id,
          producerId: consumer.producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters
        });

        console.log(`✅ Consumer created: ${consumer.id} for producer ${producerId}`);
      } catch (error) {
        console.error('❌ Error consuming:', error);
        callback({ error: error.message });
      }
    });

    // ==================== CHAT ====================

    /**
     * Send chat message
     */
    socket.on('live-class:chat-message', async (data) => {
      try {
        const userInfo = socketUserMap.get(socket.id);
        if (!userInfo) return;

        const { message } = data;

        // Save to database
        const chatMessage = new ClassChatMessage({
          classId: userInfo.classId,
          userId: socket.userId,
          userName: socket.userName,
          userRole: socket.userRole,
          message: message,
          sentAt: new Date()
        });
        await chatMessage.save();

        // Broadcast to all in room
        io.to(`live-class:${userInfo.classId}`).emit('live-class:chat-message', {
          userId: socket.userId,
          userName: socket.userName,
          userRole: socket.userRole,
          message: message,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Error sending chat message:', error);
      }
    });

    // ==================== DISCONNECT ====================

    socket.on('disconnect', async () => {
      console.log(`❌ Live Class Socket disconnected: ${socket.id}`);

      // Handle leave room logic
      const userInfo = socketUserMap.get(socket.id);
      if (userInfo) {
        // Trigger leave-room logic
        socket.emit('live-class:leave-room', { classId: userInfo.classId });
      }
    });
  });

  console.log('✅ Live Class Socket handlers initialized');
}

module.exports = initializeLiveClassSocket;
