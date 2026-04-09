# 🔥 ADVANCED LIVE CLASS SYSTEM - COMPLETE IMPLEMENTATION GUIDE

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Folder Structure](#folder-structure)
3. [Tech Stack](#tech-stack)
4. [Development Stages](#development-stages)
5. [Socket Events Reference](#socket-events-reference)
6. [API Endpoints](#api-endpoints)
7. [Setup Instructions](#setup-instructions)

---

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ LiveClass    │  │ Video Grid   │  │ Chat Panel   │ │
│  │ Component    │  │ Component    │  │ Component    │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                  │                  │          │
│         └──────────────────┴──────────────────┘          │
│                        │                                  │
│         ┌──────────────▼──────────────┐                 │
│         │  Socket.IO Client           │                 │
│         │  (WebRTC Signaling)         │                 │
│         └──────────────┬──────────────┘                 │
└────────────────────────┼─────────────────────────────────┘
                         │
                         │ HTTPS/WSS
                         │
┌────────────────────────▼─────────────────────────────────┐
│              BACKEND (Node.js + Express)                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │         Socket.IO Signaling Server                 │ │
│  │  - Room Management                                 │ │
│  │  - User Join/Leave                                 │ │
│  │  - WebRTC Offer/Answer Exchange                    │ │
│  │  - Chat Messages                                   │ │
│  │  - Attendance Tracking                             │ │
│  └──────────────────┬─────────────────────────────────┘ │
│                     │                                    │
│         ┌───────────▼──────────┐                        │
│         │   mediasoup          │                        │
│         │   Media Server       │                        │
│         │  - Video/Audio       │                        │
│         │  - Screen Share      │                        │
│         │  - Recording         │                        │
│         └──────────────────────┘                        │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │         REST API                                    │ │
│  │  - Class Management                                 │ │
│  │  - Attendance Records                               │ │
│  │  - Recording Storage                                │ │
│  └────────────────────────────────────────────────────┘ │
└────────────────────────┬─────────────────────────────────┘
                         │
                         │
┌────────────────────────▼─────────────────────────────────┐
│              DATABASE (MongoDB)                          │
│  - LiveClass (class metadata)                            │
│  - Attendance (join/leave tracking)                      │
│  - Recordings (video links)                              │
│  - ChatMessages (chat history)                           │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 Folder Structure

```
Focalyt/
├── backend/
│   ├── controllers/
│   │   ├── models/
│   │   │   ├── liveClass.js              # LiveClass model
│   │   │   ├── classAttendance.js        # Attendance tracking model
│   │   │   ├── classRecording.js         # Recording metadata model
│   │   │   └── classChatMessage.js       # Chat message model
│   │   │
│   │   └── routes/
│   │       └── liveClass/
│   │           ├── index.js              # Main route file
│   │           ├── classManagement.js    # CRUD operations
│   │           ├── attendance.js         # Attendance endpoints
│   │           ├── recording.js          # Recording endpoints
│   │           └── chat.js               # Chat endpoints
│   │
│   ├── services/
│   │   ├── mediasoup/
│   │   │   ├── server.js                 # mediasoup server setup
│   │   │   ├── worker.js                 # Worker management
│   │   │   ├── room.js                   # Room management
│   │   │   ├── transport.js              # Transport handling
│   │   │   ├── producer.js               # Producer (send stream)
│   │   │   └── consumer.js               # Consumer (receive stream)
│   │   │
│   │   └── recording/
│   │       ├── recorder.js               # Recording service
│   │       └── ffmpeg.js                 # FFmpeg integration
│   │
│   ├── socket/
│   │   ├── liveClassSocket.js            # Socket.IO handlers
│   │   └── socketAuth.js                 # Socket authentication
│   │
│   └── mmt.js                            # Main server (already exists)
│
└── frontend/
    └── src/
        ├── Pages/
        │   └── App/
        │       ├── Trainer/
        │       │   └── LiveClass/
        │       │       ├── StartLiveClass.jsx        # Trainer view
        │       │       ├── LiveClassRoom.jsx         # Main room component
        │       │       └── components/
        │       │           ├── VideoGrid.jsx         # Video display
        │       │           ├── ChatPanel.jsx         # Chat UI
        │       │           ├── Controls.jsx          # Mute/camera controls
        │       │           ├── ScreenShare.jsx       # Screen sharing
        │       │           └── AttendancePanel.jsx   # Attendance display
        │       │
        │       └── Student/
        │           └── LiveClass/
        │               ├── JoinLiveClass.jsx         # Student join page
        │               └── LiveClassRoom.jsx         # Student room view
        │
        ├── services/
        │   ├── webrtc/
        │   │   ├── mediasoupClient.js    # mediasoup client wrapper
        │   │   ├── streamManager.js      # Stream management
        │   │   └── connection.js         # WebRTC connection
        │   │
        │   └── socket/
        │       └── liveClassSocket.js    # Socket.IO client for live class
        │
        └── utils/
            ├── webrtcUtils.js            # WebRTC utilities
            └── recordingUtils.js         # Recording utilities
```

---

## 🛠 Tech Stack

### Frontend
- **React** (already installed)
- **Socket.IO Client** (already installed: socket.io-client@4.8.1)
- **WebRTC APIs** (browser native)
- **Axios** (already installed)

### Backend
- **Node.js + Express** (already installed)
- **Socket.IO** (already installed: socket.io@4.8.1)
- **mediasoup** (needs installation)
- **MongoDB/Mongoose** (already installed)

### Media Server
- **mediasoup** - Industry standard WebRTC SFU (Selective Forwarding Unit)

### Infrastructure
- **TURN/STUN Server** - For NAT traversal (Coturn recommended)

---

## 🔌 Socket Events Reference

### Client → Server Events

#### Room Management
```javascript
// Join a live class room
socket.emit('live-class:join-room', {
  classId: 'class_id_here',
  userId: 'user_id',
  userName: 'User Name',
  role: 'trainer' | 'student',
  token: 'jwt_token' // For authentication
});

// Leave room
socket.emit('live-class:leave-room', {
  classId: 'class_id_here',
  userId: 'user_id'
});

// Create room (Trainer only)
socket.emit('live-class:create-room', {
  classId: 'class_id_here',
  batchId: 'batch_id',
  courseId: 'course_id'
});
```

#### WebRTC Signaling (mediasoup)
```javascript
// Create transport for sending media
socket.emit('live-class:create-transport', {
  classId: 'class_id',
  direction: 'send' | 'recv'
}, (response) => {
  // response contains transport parameters
});

// Connect transport
socket.emit('live-class:connect-transport', {
  transportId: 'transport_id',
  dtlsParameters: dtlsParameters
});

// Produce (send video/audio)
socket.emit('live-class:produce', {
  transportId: 'transport_id',
  kind: 'video' | 'audio',
  rtpParameters: rtpParameters
}, (producerId) => {
  // producerId received
});

// Consume (receive video/audio)
socket.emit('live-class:consume', {
  classId: 'class_id',
  rtpCapabilities: rtpCapabilities
}, (producers) => {
  // List of available producers
});

// Resume consumer
socket.emit('live-class:resume-consumer', {
  consumerId: 'consumer_id'
});
```

#### Media Controls
```javascript
// Mute/Unmute audio
socket.emit('live-class:toggle-audio', {
  classId: 'class_id',
  muted: true | false
});

// Enable/Disable video
socket.emit('live-class:toggle-video', {
  classId: 'class_id',
  enabled: true | false
});

// Start/Stop screen share
socket.emit('live-class:toggle-screenshare', {
  classId: 'class_id',
  enabled: true | false
});
```

#### Chat
```javascript
// Send chat message
socket.emit('live-class:chat-message', {
  classId: 'class_id',
  userId: 'user_id',
  userName: 'User Name',
  message: 'Hello everyone!',
  timestamp: new Date().toISOString()
});
```

#### Attendance
```javascript
// Mark attendance (automatic on join, but can be manual)
socket.emit('live-class:mark-attendance', {
  classId: 'class_id',
  userId: 'user_id'
});
```

#### Recording
```javascript
// Start recording (Trainer only)
socket.emit('live-class:start-recording', {
  classId: 'class_id'
});

// Stop recording (Trainer only)
socket.emit('live-class:stop-recording', {
  classId: 'class_id'
});
```

#### Admin Controls (Trainer only)
```javascript
// Mute a student
socket.emit('live-class:mute-user', {
  classId: 'class_id',
  targetUserId: 'student_id'
});

// Remove a student
socket.emit('live-class:remove-user', {
  classId: 'class_id',
  targetUserId: 'student_id'
});

// End class
socket.emit('live-class:end-class', {
  classId: 'class_id'
});
```

---

### Server → Client Events

#### Connection & Status
```javascript
// Connection successful
socket.on('live-class:connected', (data) => {
  // { socketId, classId }
});

// Error occurred
socket.on('live-class:error', (error) => {
  // { message, code }
});

// Class ended
socket.on('live-class:ended', (data) => {
  // { classId, endedBy }
});
```

#### Room Events
```javascript
// Room created
socket.on('live-class:room-created', (data) => {
  // { classId, roomId }
});

// User joined
socket.on('live-class:user-joined', (data) => {
  // { userId, userName, role, producerId }
});

// User left
socket.on('live-class:user-left', (data) => {
  // { userId, producerId }
});

// New producer available (new user started streaming)
socket.on('live-class:new-producer', (data) => {
  // { producerId, userId, userName, kind: 'video' | 'audio' }
});

// Producer closed
socket.on('live-class:producer-closed', (data) => {
  // { producerId }
});
```

#### WebRTC Signaling (mediasoup)
```javascript
// Transport created
socket.on('live-class:transport-created', (data) => {
  // { transportId, iceParameters, iceCandidates, dtlsParameters }
});

// Consumer created
socket.on('live-class:consumer-created', (data) => {
  // { consumerId, producerId, kind, rtpParameters }
});
```

#### Chat
```javascript
// New chat message
socket.on('live-class:chat-message', (data) => {
  // { userId, userName, message, timestamp }
});
```

#### Attendance
```javascript
// Attendance updated
socket.on('live-class:attendance-updated', (data) => {
  // { userId, status: 'present' | 'left', timestamp }
});

// Attendance list
socket.on('live-class:attendance-list', (data) => {
  // { attendance: [{ userId, userName, joinTime, status }] }
});
```

#### Recording
```javascript
// Recording started
socket.on('live-class:recording-started', (data) => {
  // { classId, recordingId }
});

// Recording stopped
socket.on('live-class:recording-stopped', (data) => {
  // { classId, recordingId, recordingUrl }
});
```

#### Admin Actions
```javascript
// User muted by admin
socket.on('live-class:user-muted', (data) => {
  // { userId, mutedBy }
});

// User removed
socket.on('live-class:user-removed', (data) => {
  // { userId, removedBy, reason }
});
```

---

## 📡 API Endpoints

### Class Management
```
POST   /api/live-class/create          # Create new live class
GET    /api/live-class/:classId        # Get class details
PUT    /api/live-class/:classId        # Update class
DELETE /api/live-class/:classId        # Delete class
GET    /api/live-class/batch/:batchId  # Get classes for batch
```

### Attendance
```
GET    /api/live-class/:classId/attendance        # Get attendance list
GET    /api/live-class/:classId/attendance/:userId # Get user attendance
POST   /api/live-class/:classId/attendance/manual # Manual attendance
GET    /api/live-class/:classId/attendance/export # Export attendance (CSV)
```

### Recordings
```
GET    /api/live-class/:classId/recordings        # Get all recordings
GET    /api/live-class/recording/:recordingId     # Get recording details
DELETE /api/live-class/recording/:recordingId     # Delete recording
```

### Chat
```
GET    /api/live-class/:classId/chat              # Get chat history
POST   /api/live-class/:classId/chat              # Send message (REST fallback)
```

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install mediasoup@3.11.20 --save
npm install @ffmpeg/ffmpeg @ffmpeg/util --save  # For recording
npm install fluent-ffmpeg --save                 # Alternative recording

# Frontend (no additional packages needed)
cd frontend
# Already has socket.io-client installed
```

### Step 2: Environment Variables

Add to `backend/.env`:
```env
# mediasoup Configuration
MEDIASOUP_LISTEN_IP=0.0.0.0
MEDIASOUP_ANNOUNCED_IP=YOUR_PUBLIC_IP  # Your server's public IP

# TURN/STUN Server (Optional but recommended)
TURN_SERVER_URL=turn:turn.example.com:3478
TURN_USERNAME=turn_user
TURN_PASSWORD=turn_pass

# Recording Storage
RECORDING_STORAGE_PATH=./recordings
S3_BUCKET_NAME=your-recordings-bucket  # If using S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### Step 3: Database Models

Create models for:
- LiveClass
- ClassAttendance
- ClassRecording
- ClassChatMessage

### Step 4: Start Development

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm start
```

---

## 📊 Development Timeline

| Phase | Time | Tasks |
|-------|------|-------|
| **Phase 1** | 1 week | Setup mediasoup, basic signaling, room creation |
| **Phase 2** | 2-3 weeks | WebRTC streaming, producer/consumer, video grid |
| **Phase 3** | 2 weeks | UI components, controls, chat |
| **Phase 4** | 1 week | Attendance tracking, recording |
| **Phase 5** | 1 week | Testing, optimization, scaling |

**Total: 6-8 weeks**

---

## 🔒 Security Considerations

1. **JWT Authentication** - All socket connections require valid JWT
2. **Role-based Access** - Trainer vs Student permissions
3. **Room Access Control** - Verify user enrollment before allowing join
4. **Rate Limiting** - Prevent socket spam
5. **Input Validation** - Sanitize all chat messages

---

## 🎯 Next Steps

1. ✅ Create folder structure
2. ⏳ Install mediasoup dependencies
3. ⏳ Setup mediasoup server
4. ⏳ Create Socket.IO handlers
5. ⏳ Build React components
6. ⏳ Implement attendance tracking
7. ⏳ Add recording functionality

---

**Note**: This is a production-grade implementation plan. Follow each step carefully for best results!
