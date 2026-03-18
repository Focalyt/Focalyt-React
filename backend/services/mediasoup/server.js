const mediasoup = require('mediasoup');
const os = require('os');

class MediaSoupServer {
  constructor() {
    this.workers = [];
    this.rooms = new Map(); // roomId -> mediasoup.Router
    this.currentWorkerIndex = 0;
  }

  /**
   * Initialize mediasoup workers
   * One worker per CPU core for optimal performance
   */
  async initialize() {
    const numWorkers = Math.min(os.cpus().length, 4); // Max 4 workers

    console.log(`🚀 Initializing ${numWorkers} mediasoup workers...`);

    for (let i = 0; i < numWorkers; i++) {
      const worker = await mediasoup.createWorker({
        logLevel: 'warn',
        logTags: [
          'info',
          'ice',
          'dtls',
          'rtp',
          'srtp',
          'rtcp',
          'rtx',
          'bwe',
          'score',
          'simulcast',
          'svc'
        ],
        rtcMinPort: 40000,
        rtcMaxPort: 49999
      });

      worker.on('died', () => {
        console.error(`❌ mediasoup worker ${worker.pid} died`);
        process.exit(1);
      });

      this.workers.push(worker);
      console.log(`✅ mediasoup worker ${i + 1}/${numWorkers} created (PID: ${worker.pid})`);
    }

    console.log(`✅ All mediasoup workers initialized`);
  }

  /**
   * Get next available worker (round-robin)
   */
  getNextWorker() {
    const worker = this.workers[this.currentWorkerIndex];
    this.currentWorkerIndex = (this.currentWorkerIndex + 1) % this.workers.length;
    return worker;
  }

  /**
   * Create a new room (mediasoup Router)
   */
  async createRoom(roomId) {
    if (this.rooms.has(roomId)) {
      console.log(`⚠️ Room ${roomId} already exists`);
      return this.rooms.get(roomId);
    }

    const worker = this.getNextWorker();
    
    const router = await worker.createRouter({
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000
        },
        {
          kind: 'video',
          mimeType: 'video/VP9',
          clockRate: 90000
        },
        {
          kind: 'video',
          mimeType: 'video/H264',
          clockRate: 90000,
          parameters: {
            'packetization-mode': 1,
            'profile-level-id': '4d0032',
            'level-asymmetry-allowed': 1
          }
        }
      ]
    });

    this.rooms.set(roomId, router);
    console.log(`✅ Room ${roomId} created on worker ${worker.pid}`);

    return router;
  }

  /**
   * Get existing room
   */
  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  /**
   * Delete a room
   */
  async deleteRoom(roomId) {
    const router = this.rooms.get(roomId);
    if (!router) {
      console.log(`⚠️ Room ${roomId} not found`);
      return;
    }

    router.close();
    this.rooms.delete(roomId);
    console.log(`✅ Room ${roomId} deleted`);
  }

  /**
   * Get router capabilities
   */
  getRouterCapabilities(roomId) {
    const router = this.rooms.get(roomId);
    if (!router) {
      return null;
    }

    return router.rtpCapabilities;
  }

  /**
   * Create a transport (send or receive)
   */
  async createTransport(roomId, direction = 'send') {
    const router = this.rooms.get(roomId);
    if (!router) {
      throw new Error(`Room ${roomId} not found`);
    }

    const transport = await router.createWebRtcTransport({
      listenIps: [
        {
          ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
          announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || null
        }
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 1000000 // 1 Mbps
    });

    console.log(`✅ ${direction} transport created for room ${roomId}: ${transport.id}`);

    return transport;
  }

  /**
   * Create a producer (publish media)
   */
  async createProducer(transport, rtpParameters, kind) {
    const producer = await transport.produce({
      kind,
      rtpParameters
    });

    console.log(`✅ Producer created: ${producer.id} (kind: ${kind})`);

    return producer;
  }

  /**
   * Create a consumer (subscribe to media)
   */
  async createConsumer(transport, producerId, rtpCapabilities) {
    const producer = transport.router.producers.get(producerId);
    if (!producer) {
      throw new Error(`Producer ${producerId} not found`);
    }

    if (!transport.router.canConsume({
      producerId,
      rtpCapabilities
    })) {
      throw new Error(`Cannot consume producer ${producerId}`);
    }

    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: false
    });

    console.log(`✅ Consumer created: ${consumer.id} for producer ${producerId}`);

    return consumer;
  }

  /**
   * Get all producers in a room
   */
  getRoomProducers(roomId) {
    const router = this.rooms.get(roomId);
    if (!router) {
      return [];
    }

    const producers = [];
    router.producers.forEach((producer, producerId) => {
      producers.push({
        id: producerId,
        kind: producer.kind,
        appData: producer.appData
      });
    });

    return producers;
  }

  /**
   * Close all workers (cleanup)
   */
  async close() {
    console.log('🔄 Closing all mediasoup workers...');
    
    // Close all rooms
    for (const [roomId, router] of this.rooms) {
      router.close();
    }
    this.rooms.clear();

    // Close all workers
    for (const worker of this.workers) {
      worker.close();
    }
    this.workers = [];

    console.log('✅ All mediasoup workers closed');
  }
}

// Singleton instance
const mediaSoupServer = new MediaSoupServer();

module.exports = mediaSoupServer;
