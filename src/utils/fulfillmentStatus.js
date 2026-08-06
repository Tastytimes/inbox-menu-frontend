export const ACTIVE_FULFILLMENT_STATUSES = ["placed", "accepted", "preparing", "ready"];

export const TERMINAL_FULFILLMENT_STATUSES = [
  "delivered",
  "cancelled",
  "declined",
];

export const MAX_POLLABLE_ORDERS = 3;

const FULFILLMENT_LABELS = {
  placed: "Placed",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
  declined: "Declined",
};

const getIstDateKey = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
};

export const isOrderFromToday = (createdAt) =>
  getIstDateKey(createdAt) === getIstDateKey(new Date());

export const isActiveFulfillment = (status) =>
  ACTIVE_FULFILLMENT_STATUSES.includes(String(status || "").toLowerCase());

export const isTerminalFulfillment = (status) =>
  TERMINAL_FULFILLMENT_STATUSES.includes(String(status || "").toLowerCase());

export const getFulfillmentLabel = (status) => {
  const key = String(status || "").toLowerCase();
  return FULFILLMENT_LABELS[key] || status || "Unknown";
};

/** Paid + in-progress orders from today only (newest first, capped). */
export const getPollableOrders = (orders, limit = MAX_POLLABLE_ORDERS) =>
  (orders ?? [])
    .filter(
      (order) =>
        order?.orderId &&
        order.paymentStatus === "paid" &&
        isActiveFulfillment(order.fulfillmentStatus) &&
        isOrderFromToday(order.createdAt)
    )
    .slice(0, limit);

export const formatOrderLabel = (order) => {
  if (order?.orderNo) return `#${order.orderNo}`;
  if (order?.orderReference) return order.orderReference;
  return "Your order";
};

export const getFulfillmentUpdateMessage = (order, previousStatus, nextStatus) => {
  const label = formatOrderLabel(order);
  const next = String(nextStatus || "").toLowerCase();

  if (previousStatus === nextStatus || !next) return null;

  switch (next) {
    case "accepted":
      return `${label} — Kitchen has accepted your order`;
    case "preparing":
      return `${label} — Your food is being prepared`;
    case "ready":
      return `${label} is ready! Collect your food at the counter.`;
    case "delivered":
      return `${label} has been served. Enjoy!`;
    case "cancelled":
      return `${label} was cancelled.`;
    case "declined":
      return `${label} was declined by the kitchen.`;
    case "placed":
      return `${label} has been placed with the kitchen.`;
    default:
      return `${label} status updated to ${getFulfillmentLabel(next)}.`;
  }
};
