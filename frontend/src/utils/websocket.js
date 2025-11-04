import { useEffect, useState } from "react";
import { io } from "socket.io-client";

function useWebsocket(userId) {
  const [messages, setMessages] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const backendUrl = process.env.REACT_APP_WEBSOCKET_URL;
 

  useEffect(() => {
    if(!backendUrl) {
      console.error('❌ backendUrl is not set. Please check REACT_APP_MIPIE_BACKEND_URL in .env file');
      return;
    }
    
    console.log('🔗 Attempting to connect to:', backendUrl);
    
    // Socket.io configuration with better options for production
    const socket = io(backendUrl, { 
      query: { userId },
      transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
      autoConnect: true,
      forceNew: false,
      withCredentials: false, // Set to true if you need cookies
    });

    // Connection events
    socket.on("connect", () => {
      console.log("✅ WebSocket Connected:", socket.id);
      console.log("   - Transport:", socket.io.engine.transport.name);
      setIsConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ WebSocket Disconnected:", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("🔴 Connection Error:", error.message);
      console.error("   - Backend URL:", backendUrl);
      console.error("   - Error details:", error);
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
    });

    socket.on("reconnect_failed", () => {
      console.error("🔴 Reconnection failed after all attempts");
    });

    // Data events
    socket.on("message", (data) => {
      console.log("📩 Message received:", data);
      setMessages(prev => [...prev, data]);
    });

    socket.on("productUpdate", (data) => {
      console.log("🆕 Product update received:", data);
      setUpdates(prev => [...prev, data]);
    });

    socket.on("missedFollowup", (data) => {
      console.log("⚠️ Missed followup received:", data);
      setUpdates(prev => [...prev, data]);
    });

    socket.on("whatsapp_message_status_update", (data) => {
      console.log("⚠️ WhatsApp message status update received:", data);
      setUpdates(prev => [...prev, data]);
    });

    socket.on("whatsapp_incoming_message", (data) => {
      console.log("📬 WhatsApp incoming message received:", data);
      setMessages(prev => [...prev, data]);
    });

    return () => {
      console.log("🔌 Disconnecting socket...");
      socket.disconnect();
    };
  }, [userId, backendUrl]);

  return { messages, updates, isConnected };
}

export default useWebsocket;
