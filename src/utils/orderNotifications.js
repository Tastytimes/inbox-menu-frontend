import { formatOrderLabel } from "./fulfillmentStatus";

export const isNotificationSupported = () =>
  typeof window !== "undefined" && "Notification" in window;

export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
};

export const isNotificationBlocked = () =>
  getNotificationPermission() === "denied";

export const canRequestNotificationPermission = () =>
  getNotificationPermission() === "default";

/** Sync browser permission into app state (handles settings changes). */
export const refreshNotificationPermission = async () => {
  if (!isNotificationSupported()) return "unsupported";

  if (navigator.permissions?.query) {
    try {
      const status = await navigator.permissions.query({ name: "notifications" });
      const map = { granted: "granted", denied: "denied", prompt: "default" };
      return map[status.state] || getNotificationPermission();
    } catch {
      /* fall through */
    }
  }

  return getNotificationPermission();
};

export const requestNotificationPermission = () => {
  if (!isNotificationSupported()) return Promise.resolve("unsupported");
  if (Notification.permission === "granted") return Promise.resolve("granted");
  if (Notification.permission === "denied") return Promise.resolve("denied");
  return Notification.requestPermission();
};

export const getEnableNotificationMessage = (permission) => {
  if (permission === "granted") {
    return "Notifications are on. You'll get alerts when your order updates.";
  }
  if (permission === "denied") {
    return "Notifications are blocked. Open your browser site settings for localhost, allow Notifications, then tap the button again.";
  }
  if (permission === "default") {
    return "Tap Allow in the browser popup to turn on notifications.";
  }
  return "Notifications are not supported in this browser.";
};

export const getOrderNotificationContent = ({ order, status, message }) => {
  const label = formatOrderLabel(order);

  switch (String(status || "").toLowerCase()) {
    case "ready":
      return {
        title: `${label} is ready!`,
        body: "Collect your food at the counter.",
      };
    case "accepted":
      return {
        title: `${label} accepted`,
        body: "The kitchen has started preparing your order.",
      };
    case "delivered":
      return {
        title: `${label} served`,
        body: "Enjoy your meal!",
      };
    case "cancelled":
      return {
        title: `${label} cancelled`,
        body: "Contact the restaurant if you need help.",
      };
    case "declined":
      return {
        title: `${label} declined`,
        body: "Contact the restaurant if you need help.",
      };
    default:
      return {
        title: "Order update",
        body: message || `${label} status has changed.`,
      };
  }
};

export const showOrderNotification = ({ title, body, tag }) => {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return false;
  }

  try {
    const notification = new Notification(title, {
      body,
      tag: tag || "order-update",
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch {
    return false;
  }
};

export const notifyOrderStatusChange = ({ order, status, message }) => {
  const content = getOrderNotificationContent({ order, status, message });
  return showOrderNotification({
    ...content,
    tag: order?.orderId ? `order-${order.orderId}-${status}` : undefined,
  });
};

export const showNotificationEnabledTest = () =>
  showOrderNotification({
    title: "Notifications enabled",
    body: "You'll be alerted when your order status changes.",
    tag: "notification-enabled-test",
  });
