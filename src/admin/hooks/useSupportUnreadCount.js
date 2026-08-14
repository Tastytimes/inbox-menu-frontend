import { useCallback, useEffect, useState } from "react";
import { getSupportUnreadCount } from "../api/adminApi";

export const useSupportUnreadCount = (enabled = true) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    try {
      const data = await getSupportUnreadCount();
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Ignore badge fetch errors silently.
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return undefined;

    const handleUpdate = () => {
      void refresh();
    };

    window.addEventListener("admin-support-message", handleUpdate);
    return () => window.removeEventListener("admin-support-message", handleUpdate);
  }, [enabled, refresh]);

  return { unreadCount, refreshUnreadCount: refresh };
};
