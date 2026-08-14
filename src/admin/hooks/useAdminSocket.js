import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getAdminApiBaseUrl } from "../api/adminApi";
import { getStoredAdminAuth } from "../utils/adminAuthStorage";

const MAX_EVENTS = 20;

function notifySupportMessage(payload) {
  window.dispatchEvent(
    new CustomEvent("admin-support-message", { detail: payload ?? null })
  );

  const message = payload?.message;
  if (!message || message.direction !== "inbound") {
    return;
  }

  const customerLabel =
    payload?.conversation?.customerName ||
    payload?.conversation?.customerPhone ||
    "Customer";
  const preview = message.body || "New WhatsApp message";

  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    const notification = new Notification(`WhatsApp: ${customerLabel}`, {
      body: preview,
      tag: `support-${payload?.conversation?.id ?? "new"}`,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  try {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUrvT18="
    );
    audio.volume = 0.35;
    void audio.play();
  } catch {
    // Audio optional.
  }
}

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
    socket.on("support.message.created", (payload) => {
      notifySupportMessage(payload);
    });
    socket.on("support.conversation.updated", () => {
      window.dispatchEvent(new CustomEvent("admin-support-message"));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

  const clearEvents = () => setEvents([]);

  return { connected, events, clearEvents };
};

export const requestSupportNotifications = async () => {
  if (typeof Notification === "undefined") {
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  return Notification.requestPermission();
};
