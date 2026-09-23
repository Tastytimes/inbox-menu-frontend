export const getHeldCartItems = (session) =>
  (session?.heldItems ?? []).filter((item) => !item.fired);

export const getSessionOrders = (session) =>
  Array.isArray(session?.orders) ? session.orders : [];

export const getSessionItemName = (item) =>
  item?.name || item?.foodName || item?.food?.name || item?.itemName || "Item";

export const getSessionItemQty = (item) => Number(item?.quantity) || 0;

export const getSessionItemTotal = (item) => {
  const explicit = Number(item?.lineFoodTotal ?? item?.total ?? item?.amount);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const unit = Number(item?.unitPrice ?? item?.price ?? item?.food?.price) || 0;
  return unit * getSessionItemQty(item);
};

export const getSessionItemUnitPrice = (item) => {
  const unit = Number(item?.unitPrice ?? item?.price ?? item?.food?.price);
  if (Number.isFinite(unit) && unit > 0) return unit;
  const qty = getSessionItemQty(item) || 1;
  return getSessionItemTotal(item) / qty;
};

export const getSessionItemFoodType = (item) =>
  String(item?.foodType || item?.food?.foodType || "").toLowerCase();

export const getSessionItemNote = (item) =>
  item?.note || item?.notes || item?.addonLabel || item?.variation || "";

export const getOrderItems = (order) =>
  order?.items ?? order?.heldItems ?? order?.lines ?? [];

export const getOrderLabel = (order, index) =>
  order?.orderNo
    ? `Order No: ${String(order.orderNo).padStart(2, "0")}`
    : order?.orderReference || `Order ${index + 1}`;

export const getOrderStatus = (order) =>
  String(order?.status || order?.fulfillmentStatus || "placed").toLowerCase();

export const getOrderStatusLabel = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "accepted":
    case "confirmed":
      return "Confirmed";
    case "preparing":
      return "Preparing";
    case "ready":
      return "Ready";
    case "delivered":
    case "served":
      return "Served";
    case "cancelled":
    case "canceled":
    case "declined":
      return "Cancelled";
    case "placed":
    default:
      return "Placed";
  }
};

export const isCancelledOrder = (order) => {
  const status = getOrderStatus(order);
  return status === "cancelled" || status === "canceled" || status === "declined";
};

export const isStaffOrder = (order) => {
  const source = String(
    order?.source || order?.placedBy || order?.createdByRole || ""
  ).toLowerCase();
  return source.includes("staff") || source.includes("captain") || source.includes("waiter");
};

export const getOrderTime = (order) =>
  order?.confirmedAt ||
  order?.acceptedAt ||
  order?.placedAt ||
  order?.createdAt ||
  order?.updatedAt;

export const formatOrderTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

export const sumItemQuantities = (items) =>
  (items ?? []).reduce((sum, item) => sum + getSessionItemQty(item), 0);

export const sumItemTotals = (items) =>
  (items ?? []).reduce((sum, item) => sum + getSessionItemTotal(item), 0);

export const isBillRequested = (session) => {
  const billStatus = String(session?.billStatus || "").toLowerCase();
  const status = String(session?.status || "").toLowerCase();
  return billStatus === "requested" || status === "billing" || status === "billed";
};

export const getBillLines = (session) =>
  getSessionOrders(session).flatMap((order) =>
    isCancelledOrder(order) ? [] : getOrderItems(order)
  );

export const getChargeLabel = (charge) => {
  if (!charge) return "Charge";
  if (charge.chargeType === "percentage") {
    return `${charge.name} (${charge.value}%)`;
  }
  return charge.name || "Charge";
};

export const getBillCharges = (session) => {
  const summary = session?.summary || session?.bill || {};
  const extraCharges = Array.isArray(summary.extraCharges)
    ? summary.extraCharges
    : Array.isArray(session?.extraCharges)
      ? session.extraCharges
      : [];
  const lines = getBillLines(session);
  const foodSubtotal =
    Number(summary.foodSubtotal ?? summary.subtotal ?? summary.grossAmount) ||
    sumItemTotals(lines);
  const extraChargesTotal =
    Number(summary.extraChargesTotal) ||
    extraCharges.reduce((sum, charge) => sum + (Number(charge.amount) || 0), 0);
  const taxTotal = Number(summary.taxTotal ?? summary.gstAmount) || 0;
  const grandTotal =
    Number(summary.grandTotal ?? summary.netAmount ?? session?.totalAmount) ||
    foodSubtotal + extraChargesTotal + taxTotal;

  return {
    foodSubtotal,
    extraCharges,
    extraChargesTotal,
    taxTotal,
    grandTotal: grandTotal > 0 ? grandTotal : getSessionBillTotal(session),
  };
};

export const getSessionBillTotal = (session) => {
  const explicit = Number(session?.totalAmount ?? session?.billAmount ?? session?.grandTotal);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const ordersTotal = getSessionOrders(session).reduce((sum, order) => {
    if (isCancelledOrder(order)) return sum;
    return sum + (Number(order.totalAmount) || sumItemTotals(getOrderItems(order)));
  }, 0);
  return ordersTotal;
};

export const getGuestLabel = (session) =>
  session?.guestName || session?.customerName || session?.guestPhone || "Your table";
