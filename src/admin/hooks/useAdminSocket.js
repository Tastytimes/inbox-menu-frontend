import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getAdminApiBaseUrl } from "../api/adminApi";
import { getStoredAdminAuth } from "../utils/adminAuthStorage";

const MAX_EVENTS = 20;

export const useAdminSocket = (enabled = true) => {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const socketRef = useRef(null);

  const pushEvent = (type, payload) => {
    setEvents((current) =>
      [{ id: `${type}-${Date.now()}`, type, payload, at: new Date().toISOString() }, ...current].slice(
        0,
        MAX_EVENTS
      )
    );
  };

  useEffect(() => {
    if (!enabled) return undefined;

    const token = getStoredAdminAuth()?.token;
    if (!token) return undefined;

    const socket = io(`${getAdminApiBaseUrl()}/admin`, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("registration.created", (payload) => pushEvent("registration.created", payload));
    socket.on("registration.approved", (payload) => pushEvent("registration.approved", payload));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

  const clearEvents = () => setEvents([]);

  return { connected, events, clearEvents };
};
