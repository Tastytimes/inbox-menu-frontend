import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { RESTAURANT_API_BASE_URL } from "../api/baseUrl";

export const useOrderTrackingSocket = (trackingToken, onUpdate) => {
  const [connected, setConnected] = useState(false);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!trackingToken) return undefined;

    const socket = io(`${RESTAURANT_API_BASE_URL}/orders/track`, {
      auth: { trackingToken },
      transports: ["websocket", "polling"],
    });

    const handlePayload = (payload) => {
      onUpdateRef.current?.(payload);
    };

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("order.tracking.snapshot", handlePayload);
    socket.on("order.tracking.updated", handlePayload);

    return () => {
      socket.off("order.tracking.snapshot", handlePayload);
      socket.off("order.tracking.updated", handlePayload);
      socket.disconnect();
      setConnected(false);
    };
  }, [trackingToken]);

  return { connected };
};
