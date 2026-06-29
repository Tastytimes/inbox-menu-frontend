export const formatAdminAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? `₹${amount}` : "—";
};

export const formatAdminTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatOrderLabel = (order) => {
  if (order?.orderNo) return `#${order.orderNo}`;
  if (order?.orderReference) return order.orderReference;
  return "Order";
};

export const isValidIndianPhone = (phone) => /^[6-9]\d{9}$/.test(String(phone || ""));
