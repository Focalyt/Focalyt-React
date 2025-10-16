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
    console.log('🔌 Connecting to Socket.io with userId:', userId);
    console.log('🔌 Backend URL:', backendUrl);
    
    const socket = io(backendUrl, { query: { userId } });

    socket.on("connect", () => {
      console.log("✅ Socket.io Connected - Socket ID:", socket.id);
      console.log("✅ User ID:", userId);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket.io Disconnected - Socket ID:", socket.id);
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
