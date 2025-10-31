import { useEffect, useState } from "react";
import { io } from "socket.io-client";

function useWebsocket(userId) {
  const [messages, setMessages] = useState([]);
  const [updates, setUpdates] = useState([]);
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

  useEffect(() => {
    const socket = io(`${backendUrl}`, { query: { userId } });

    socket.on("connect", () => console.log("✅ Connected:", socket.id));

    // Chat messages
    socket.on("message", (data) => {
      console.log("📩 Message received:", data);
      setMessages(prev => [...prev, data]); // update messages state
    });

    // Product updates
    socket.on("productUpdate", (data) => {
      console.log("🆕 Product update received:", data);
      setUpdates(prev => [...prev, data]); // update product updates state
    });

    // Missed followup notifications
    socket.on("missedFollowup", (data) => {
      console.log("⚠️ Missed followup received:", data);
      setUpdates(prev => [...prev, data]); // ya alag state maintain kar sakte ho
    });

    socket.on("whatsapp_message_status_update", (data) => {
      console.log("⚠️ WhatsApp message status update received:", data);
      setUpdates(prev => [...prev, data]); // ya alag state maintain kar sakte ho
    });

    return () => socket.disconnect();
  }, [userId]);

  // Return data so component can use it
  return { messages, updates };
}

export default useWebsocket;
