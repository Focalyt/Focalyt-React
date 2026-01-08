import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const WhatsAppContext = createContext(null);

export const useWhatsAppContext = () => {
  const context = useContext(WhatsAppContext);
  // Return null instead of throwing error to allow conditional usage
  return context;
};

export const WhatsAppProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const processedMessageIdsRef = useRef(new Set());
  const messageListenersRef = useRef([]);
  const updateListenersRef = useRef([]);

  // Callbacks for components to register listeners
  const onMessage = useCallback((callback) => {
    messageListenersRef.current.push(callback);
    return () => {
      messageListenersRef.current = messageListenersRef.current.filter(cb => cb !== callback);
    };
  }, []);

  const onUpdate = useCallback((callback) => {
    updateListenersRef.current.push(callback);
    return () => {
      updateListenersRef.current = updateListenersRef.current.filter(cb => cb !== callback);
    };
  }, []);

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const userId = userData._id;
    const backendUrl = process.env.REACT_APP_WEBSOCKET_URL || process.env.REACT_APP_MIPIE_BACKEND_URL;

    if (!backendUrl) {
      console.error('❌ backendUrl is not set. Please check REACT_APP_WEBSOCKET_URL or REACT_APP_MIPIE_BACKEND_URL in .env file');
      return;
    }

    if (!userId) {
      console.warn('⚠️ No user ID found, skipping WebSocket connection');
      return;
    }

    console.log('🔗 [WhatsAppContext] Attempting to connect to:', backendUrl);

    // Create socket connection
    const socket = io(backendUrl, {
      query: { userId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity, // Keep trying to reconnect
      timeout: 20000,
      autoConnect: true,
      forceNew: false,
      withCredentials: false,
    });

    socketRef.current = socket;

    // Connection events
    socket.on("connect", () => {
      console.log("✅ [WhatsAppContext] WebSocket Connected:", socket.id);
      console.log("   - Transport:", socket.io.engine.transport.name);
      setIsConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ [WhatsAppContext] WebSocket Disconnected:", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("🔴 [WhatsAppContext] Connection Error:", error.message);
      console.error("   - Backend URL:", backendUrl);
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`🔄 [WhatsAppContext] Reconnection attempt ${attemptNumber}...`);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`✅ [WhatsAppContext] Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
    });

    socket.on("reconnect_failed", () => {
      console.error("🔴 [WhatsAppContext] Reconnection failed after all attempts");
    });

    // Data events - Store messages and notify listeners
    socket.on("message", (data) => {
      console.log("📩 [WhatsAppContext] Message received:", data);
      setMessages(prev => {
        // Check if already processed
        const messageId = data.whatsappMessageId || data.messageId || data.id || `${data.from}-${data.sentAt || Date.now()}`;
        if (processedMessageIdsRef.current.has(messageId)) {
          return prev;
        }
        processedMessageIdsRef.current.add(messageId);
        const newMessages = [...prev, data];
        // Notify all listeners
        messageListenersRef.current.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error('Error in message listener:', error);
          }
        });
        return newMessages;
      });
    });

    socket.on("productUpdate", (data) => {
      console.log("🆕 [WhatsAppContext] Product update received:", data);
      setUpdates(prev => {
        const newUpdates = [...prev, data];
        // Notify all listeners
        updateListenersRef.current.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error('Error in update listener:', error);
          }
        });
        return newUpdates;
      });
    });

    socket.on("missedFollowup", (data) => {
      console.log("⚠️ [WhatsAppContext] Missed followup received:", data);
      setUpdates(prev => {
        const newUpdates = [...prev, data];
        updateListenersRef.current.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error('Error in update listener:', error);
          }
        });
        return newUpdates;
      });
    });

    socket.on("whatsapp_message_status_update", (data) => {
      console.log("⚠️ [WhatsAppContext] WhatsApp message status update received:", data);
      setUpdates(prev => {
        const newUpdates = [...prev, data];
        updateListenersRef.current.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error('Error in update listener:', error);
          }
        });
        return newUpdates;
      });
    });

    socket.on("whatsapp_incoming_message", (data) => {
      console.log("📬 [WhatsAppContext] WhatsApp incoming message received:", data);
      setMessages(prev => {
        // Check if already processed
        const messageId = data.whatsappMessageId || data.messageId || data.id || `${data.from}-${data.sentAt || Date.now()}`;
        if (processedMessageIdsRef.current.has(messageId)) {
          return prev;
        }
        processedMessageIdsRef.current.add(messageId);
        const newMessages = [...prev, data];
        // Notify all listeners
        messageListenersRef.current.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error('Error in message listener:', error);
          }
        });
        return newMessages;
      });
    });

    // Cleanup on unmount
    return () => {
      console.log("🔌 [WhatsAppContext] Disconnecting socket...");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // Empty dependency array - only connect once when provider mounts

  const value = {
    messages,
    updates,
    isConnected,
    onMessage,
    onUpdate,
    socket: socketRef.current,
  };

  return (
    <WhatsAppContext.Provider value={value}>
      {children}
    </WhatsAppContext.Provider>
  );
};
