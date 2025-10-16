import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";

function useWebsocket(userId) {
  const [messages, setMessages] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [whatsappMessages, setWhatsappMessages] = useState([]);
  const [whatsappTemplates, setWhatsappTemplates] = useState([]);

  useEffect(() => {
    // Use environment variable for backend URL
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL || 'http://localhost:8080';
    console.log('🔌 [WebSocket Hook] Initializing connection...');
    console.log('🔌 [WebSocket Hook] UserId:', userId);
    console.log('🔌 [WebSocket Hook] Backend URL:', backendUrl);
    
    if (!userId) {
      console.warn('⚠️ [WebSocket Hook] No userId provided, connection will use guestUser');
    }
    
    const socket = io(backendUrl, { 
      query: { userId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on("connect", () => {
      console.log("✅ [WebSocket Hook] Socket.io Connected!");
      console.log("✅ [WebSocket Hook] Socket ID:", socket.id);
      console.log("✅ [WebSocket Hook] User ID:", userId);
      console.log("✅ [WebSocket Hook] Connected to:", backendUrl);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ [WebSocket Hook] Connection error:", error.message);
      console.error("❌ [WebSocket Hook] Backend URL:", backendUrl);
      console.error("❌ [WebSocket Hook] User ID:", userId);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ [WebSocket Hook] Disconnected - Socket ID:", socket.id);
      console.log("❌ [WebSocket Hook] Reason:", reason);
    });

    // Server welcome message
    socket.on("connected", (data) => {
      console.log("🎉 [WebSocket Hook] Server welcome message:", data);
    });

    // Chat messages
    socket.on("message", (data) => {
      console.log("📩 Message received:", data);
      setMessages(prev => [...prev, data]);
    });

    // Product updates
    socket.on("productUpdate", (data) => {
      console.log("🆕 Product update received:", data);
      setUpdates(prev => [...prev, data]);
    });

    // Missed followup notifications
    socket.on("missedFollowup", (data) => {
      console.log("⚠️ Missed followup received:", data);
      setUpdates(prev => [...prev, data]);
    });

    // WhatsApp message status updates
    socket.on("whatsapp_message_update", (data) => {
      console.log("📱 WhatsApp message update received:", data);
      setWhatsappMessages(prev => [...prev, data]);
    });

    // WhatsApp template status updates
    socket.on("whatsapp_template_update", (data) => {
      console.log("📋 WhatsApp template update received:", data);
      setWhatsappTemplates(prev => [...prev, data]);
    });

    return () => {
      console.log("🔌 Disconnecting socket...");
      socket.disconnect();
    };
  }, [userId]);

  // Return data and helper functions
  return { 
    messages, 
    updates, 
    whatsappMessages,
    whatsappTemplates,
    clearWhatsappMessages: () => setWhatsappMessages([]),
    clearWhatsappTemplates: () => setWhatsappTemplates([])
  };
}

export default useWebsocket;
