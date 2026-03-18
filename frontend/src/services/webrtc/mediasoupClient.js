import * as mediasoupClient from 'mediasoup-client';

class MediaSoupClientService {
  constructor() {
    this.device = null;
    this.sendTransport = null;
    this.recvTransport = null;
    this.producers = new Map(); // kind -> Producer
    this.consumers = new Map(); // producerId -> Consumer
    this.localStream = null;
    this.remoteStreams = new Map(); // producerId -> MediaStream
  }

  /**
   * Initialize mediasoup device with router capabilities
   */
  async initializeDevice(rtpCapabilities) {
    try {
      this.device = new mediasoupClient.Device();
      await this.device.load({ routerRtpCapabilities: rtpCapabilities });
      console.log('✅ mediasoup device initialized');
      return this.device;
    } catch (error) {
      console.error('❌ Error initializing device:', error);
      throw error;
    }
  }

  /**
   * Check if device is initialized
   */
  isDeviceReady() {
    return this.device !== null && this.device.loaded;
  }

  /**
   * Get RTP capabilities
   */
  getRtpCapabilities() {
    if (!this.isDeviceReady()) {
      throw new Error('Device not initialized');
    }
    return this.device.rtpCapabilities;
  }

  /**
   * Get user media (camera/microphone)
   */
  async getUserMedia(audio = true, video = true) {
    try {
      const constraints = {
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false,
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      return stream;
    } catch (error) {
      console.error('❌ Error getting user media:', error);
      throw error;
    }
  }

  /**
   * Get display media (screen share)
   */
  async getDisplayMedia() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });
      return stream;
    } catch (error) {
      console.error('❌ Error getting display media:', error);
      throw error;
    }
  }

  /**
   * Create send transport
   */
  async createSendTransport(socketService, transportParams) {
    if (!this.isDeviceReady()) {
      throw new Error('Device not initialized');
    }

    this.sendTransport = this.device.createSendTransport({
      id: transportParams.id,
      iceParameters: transportParams.iceParameters,
      iceCandidates: transportParams.iceCandidates,
      dtlsParameters: transportParams.dtlsParameters
    });

    // Handle connection
    this.sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        socketService.connectTransport(this.sendTransport.id, dtlsParameters, (response) => {
          if (response.error) {
            errback(new Error(response.error));
          } else {
            callback();
          }
        });
      } catch (error) {
        errback(error);
      }
    });

    // Handle producer creation
    this.sendTransport.on('produce', async (parameters, callback, errback) => {
      try {
        socketService.produce(
          this.sendTransport.id,
          parameters.kind,
          parameters.rtpParameters,
          (response) => {
            if (response.error) {
              errback(new Error(response.error));
            } else {
              callback({ id: response.producerId });
            }
          }
        );
      } catch (error) {
        errback(error);
      }
    });

    console.log('✅ Send transport created:', this.sendTransport.id);
    return this.sendTransport;
  }

  /**
   * Create receive transport
   */
  async createRecvTransport(socketService, transportParams) {
    if (!this.isDeviceReady()) {
      throw new Error('Device not initialized');
    }

    this.recvTransport = this.device.createRecvTransport({
      id: transportParams.id,
      iceParameters: transportParams.iceParameters,
      iceCandidates: transportParams.iceCandidates,
      dtlsParameters: transportParams.dtlsParameters
    });

    // Handle connection
    this.recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        socketService.connectTransport(this.recvTransport.id, dtlsParameters, (response) => {
          if (response.error) {
            errback(new Error(response.error));
          } else {
            callback();
          }
        });
      } catch (error) {
        errback(error);
      }
    });

    console.log('✅ Receive transport created:', this.recvTransport.id);
    return this.recvTransport;
  }

  /**
   * Produce (publish) audio/video stream
   */
  async produceAudio(socketService) {
    if (!this.localStream) {
      throw new Error('No local stream available');
    }

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (!audioTrack) {
      throw new Error('No audio track available');
    }

    const producer = await this.sendTransport.produce({
      track: audioTrack,
      codecOptions: {
        opusStereo: true,
        opusFec: true,
        opusDtx: true,
        opusMaxPlaybackRate: 48000
      }
    });

    this.producers.set('audio', producer);
    console.log('✅ Audio producer created:', producer.id);
    return producer;
  }

  async produceVideo(socketService) {
    if (!this.localStream) {
      throw new Error('No local stream available');
    }

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) {
      throw new Error('No video track available');
    }

    const producer = await this.sendTransport.produce({
      track: videoTrack,
      codecOptions: {
        videoGoogleStartBitrate: 1000
      }
    });

    this.producers.set('video', producer);
    console.log('✅ Video producer created:', producer.id);
    return producer;
  }

  /**
   * Produce screen share
   */
  async produceScreen(socketService, stream) {
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      throw new Error('No video track in screen stream');
    }

    const producer = await this.sendTransport.produce({
      track: videoTrack,
      codecOptions: {
        videoGoogleStartBitrate: 2500
      }
    });

    // Replace video producer with screen producer
    if (this.producers.has('video')) {
      const oldProducer = this.producers.get('video');
      oldProducer.close();
    }
    this.producers.set('screen', producer);
    console.log('✅ Screen producer created:', producer.id);
    return producer;
  }

  /**
   * Consume (subscribe to) remote producer
   */
  async consume(socketService, producerId, rtpCapabilities) {
    if (!this.recvTransport) {
      throw new Error('Receive transport not created');
    }

    try {
      socketService.consume(producerId, rtpCapabilities, async (response) => {
        if (response.error) {
          throw new Error(response.error);
        }

        const consumer = await this.recvTransport.consume({
          id: response.consumerId,
          producerId: response.producerId,
          kind: response.kind,
          rtpParameters: response.rtpParameters
        });

        this.consumers.set(producerId, consumer);

        // Create MediaStream from consumer track
        const stream = new MediaStream([consumer.track]);
        this.remoteStreams.set(producerId, stream);

        console.log('✅ Consumer created:', consumer.id, 'for producer:', producerId);

        // Resume consumer
        socketService.emit('live-class:resume-consumer', {
          consumerId: consumer.id
        });

        return { consumer, stream };
      });
    } catch (error) {
      console.error('❌ Error consuming producer:', error);
      throw error;
    }
  }

  /**
   * Enable/Disable audio
   */
  async setAudioEnabled(enabled) {
    const producer = this.producers.get('audio');
    if (producer) {
      producer.pause();
      if (enabled) {
        producer.resume();
      }
    }
  }

  /**
   * Enable/Disable video
   */
  async setVideoEnabled(enabled) {
    const producer = this.producers.get('video') || this.producers.get('screen');
    if (producer) {
      if (enabled) {
        producer.resume();
      } else {
        producer.pause();
      }
    }
  }

  /**
   * Stop screen share and resume camera
   */
  async stopScreenShare() {
    const screenProducer = this.producers.get('screen');
    if (screenProducer) {
      screenProducer.close();
      this.producers.delete('screen');
    }

    // Resume video producer if exists
    const videoProducer = this.producers.get('video');
    if (videoProducer && videoProducer.paused) {
      videoProducer.resume();
    }
  }

  /**
   * Close all producers
   */
  closeProducers() {
    this.producers.forEach(producer => {
      producer.close();
    });
    this.producers.clear();
  }

  /**
   * Close all consumers
   */
  closeConsumers() {
    this.consumers.forEach(consumer => {
      consumer.close();
    });
    this.consumers.clear();
    this.remoteStreams.clear();
  }

  /**
   * Close transports
   */
  closeTransports() {
    if (this.sendTransport) {
      this.sendTransport.close();
      this.sendTransport = null;
    }
    if (this.recvTransport) {
      this.recvTransport.close();
      this.recvTransport = null;
    }
  }

  /**
   * Stop local stream
   */
  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  /**
   * Cleanup everything
   */
  cleanup() {
    this.closeProducers();
    this.closeConsumers();
    this.closeTransports();
    this.stopLocalStream();
    this.device = null;
  }
}

// Export singleton instance
const mediaSoupClientService = new MediaSoupClientService();
export default mediaSoupClientService;
