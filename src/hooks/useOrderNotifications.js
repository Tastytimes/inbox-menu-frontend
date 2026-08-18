import { useCallback, useEffect, useState } from "react";
import {
  bindOrderUpdateSoundUnlock,
  playOrderUpdateSound,
  unlockOrderUpdateSound,
} from "../utils/orderNotificationSound";
import {
  getEnableNotificationMessage,
  getNotificationPermission,
  isNotificationSupported,
  notifyOrderStatusChange,
  refreshNotificationPermission,
  requestNotificationPermission,
  showNotificationEnabledTest,
} from "../utils/orderNotifications";

export const useOrderNotifications = () => {
  const [permission, setPermission] = useState(getNotificationPermission);
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [enableMessage, setEnableMessage] = useState("");

  const syncPermission = useCallback(async () => {
    const next = await refreshNotificationPermission();
    setPermission(next);
    if (next !== "granted") {
      setPromptDismissed(false);
    }
    return next;
  }, []);

  useEffect(() => {
    syncPermission();

    const handleRefresh = () => {
      syncPermission();
    };

    const unbindSoundUnlock = bindOrderUpdateSoundUnlock();

    document.addEventListener("visibilitychange", handleRefresh);
    window.addEventListener("focus", handleRefresh);

    return () => {
      document.removeEventListener("visibilitychange", handleRefresh);
      window.removeEventListener("focus", handleRefresh);
      unbindSoundUnlock();
    };
  }, [syncPermission]);

  const enableNotifications = useCallback(async () => {
    await unlockOrderUpdateSound();

    if (!isNotificationSupported()) {
      setEnableMessage(getEnableNotificationMessage("unsupported"));
      return "unsupported";
    }

    setEnabling(true);
    setEnableMessage("");

    try {
      const latest = getNotificationPermission();

      if (latest === "granted") {
        setPermission("granted");
        setPromptDismissed(true);
        setEnableMessage(getEnableNotificationMessage("granted"));
        return "granted";
      }

      if (latest === "denied") {
        const refreshed = await refreshNotificationPermission();
        setPermission(refreshed);
        if (refreshed === "granted") {
          setPromptDismissed(true);
          showNotificationEnabledTest();
          setEnableMessage(getEnableNotificationMessage("granted"));
          return "granted";
        }
        setEnableMessage(getEnableNotificationMessage("denied"));
        return refreshed;
      }

      const result = await requestNotificationPermission();
      setPermission(result);

      if (result === "granted") {
        setPromptDismissed(true);
        showNotificationEnabledTest();
        await playOrderUpdateSound("accepted");
        setEnableMessage(getEnableNotificationMessage("granted"));
      } else {
        setEnableMessage(getEnableNotificationMessage(result));
      }

      return result;
    } finally {
      setEnabling(false);
    }
  }, []);

  const dismissPrompt = useCallback(() => {
    setPromptDismissed(true);
    setEnableMessage("");
  }, []);

  const handleOrderNotify = useCallback((payload) => {
    playOrderUpdateSound(payload?.status);
    notifyOrderStatusChange(payload);
    return payload?.message || "";
  }, []);

  return {
    notificationPermission: permission,
    enabling,
    enableMessage,
    enableNotifications,
    dismissPrompt,
    handleOrderNotify,
    notificationsEnabled: permission === "granted",
    showNotificationBanner:
      isNotificationSupported() && permission !== "granted" && !promptDismissed,
  };
};
