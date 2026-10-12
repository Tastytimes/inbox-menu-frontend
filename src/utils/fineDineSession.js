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
  const items = getOrderItems(order);
  const allStaffItems =
    items.length > 0 &&
    items.every((item) => {
      const role = String(item?.orderedByRole || "").toLowerCase();
      return ["staff", "captain", "owner", "manager"].includes(role);
    });
  if (allStaffItems) return true;

  const source = String(
    order?.source || order?.orderSource || order?.placedByRole || order?.placedBy || ""
  ).toLowerCase();
  if (
    source.includes("staff") ||
    source.includes("captain") ||
    source.includes("owner") ||
    source.includes("manager") ||
    source.includes("waiter")
  ) {
    return !items.some((item) => {
      const role = String(item?.orderedByRole || "").toLowerCase();
      return role === "guest" || role === "host" || item?.orderedByGuestId || item?.orderedByEmail;
    });
  }

  const anyGuest = items.some(
    (item) =>
      item?.orderedByGuestId ||
      item?.orderedByEmail ||
      item?.orderedByRole === "guest" ||
      item?.orderedByRole === "host" ||
      /\([^)]+\)\s*$/.test(String(item?.name || ""))
  );
  return Boolean(order?.placedByName || order?.placedByStaffId) && !anyGuest;
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

const CLOSED_SESSION_STATUSES = new Set([
  "closed",
  "cleared",
  "completed",
  "ended",
  "cancelled",
  "canceled",
  "inactive",
]);

const CAPACITY_KEYS = [
  "maxSeatingCapacity",
  "seatingCapacity",
  "maxCapacity",
  "capacity",
  "maxGuests",
  "guestCapacity",
  "seats",
  "maxSeats",
];

const readCapacity = (source) => {
  if (!source || typeof source !== "object") return null;
  for (const key of CAPACITY_KEYS) {
    const value = Number(source[key]);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
};

export const getMaxSeatingCapacity = (...sources) => {
  for (const source of sources) {
    const direct = readCapacity(source);
    if (direct) return direct;
    if (!source || typeof source !== "object") continue;
    for (const nestedKey of ["table", "tableInfo", "qr", "context", "restaurant"]) {
      const nested = readCapacity(source[nestedKey]);
      if (nested) return nested;
    }
  }
  return null;
};

export const parseGuestCount = (value) => {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isInteger(parsed) ? parsed : NaN;
};

export const isActiveFineDineSession = (session) => {
  if (!session) return false;
  const status = String(session.status || session.sessionStatus || "").toLowerCase();
  if (CLOSED_SESSION_STATUSES.has(status)) return false;
  if (session.isClosed || session.isCleared || session.closedAt || session.clearedAt) {
    return false;
  }
  return true;
};

export const isBillRequested = (session) => {
  const billStatus = String(session?.billStatus || "").toLowerCase();
  const status = String(session?.status || "").toLowerCase();
  return billStatus === "requested" || status === "billing" || status === "billed";
};

export const getBillLines = (session) =>
  getSessionOrders(session).flatMap((order) =>
    isCancelledOrder(order)
      ? []
      : getOrderItems(order).map((item) => ({ ...item, __order: order }))
  );

export const getChargeLabel = (charge) => {
  if (!charge) return "Charge";
  if (charge.chargeType === "percentage") {
    return `${charge.name} (${charge.value}%)`;
  }
  return charge.name || "Charge";
};

const collectOrderExtraCharges = (session) => {
  const totals = new Map();
  getSessionOrders(session).forEach((order) => {
    if (isCancelledOrder(order)) return;
    const charges = order?.summary?.extraCharges;
    if (!Array.isArray(charges)) return;
    charges.forEach((charge) => {
      const key = `${charge.id ?? charge.name}|${charge.chargeType}|${charge.value}`;
      const amount = Number(charge.amount) || 0;
      const existing = totals.get(key);
      if (existing) {
        existing.amount += amount;
        return;
      }
      totals.set(key, { ...charge, amount });
    });
  });
  return [...totals.values()];
};

export const getBillCharges = (session) => {
  const summary = session?.summary || session?.bill || {};
  const summaryCharges = Array.isArray(summary.extraCharges) ? summary.extraCharges : [];
  const extraCharges = summaryCharges.length
    ? summaryCharges
    : Array.isArray(session?.extraCharges) && session.extraCharges.length
      ? session.extraCharges
      : collectOrderExtraCharges(session);
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
  session?.hostName || session?.guestName || session?.customerName || session?.guestPhone || "Your table";

export const getItemOrderedBy = (item) =>
  item?.orderedByName || item?.guestName || item?.orderedBy || "";

export const getGuestsOnSession = (session) =>
  Array.isArray(session?.guests) ? session.guests : [];

export const getSessionItemDisplayName = (item) =>
  String(getSessionItemName(item) || "").replace(/\s*\([^)]+\)\s*$/, "").trim() ||
  getSessionItemName(item);

const emailFromNameSuffix = (item) => {
  const match = String(item?.name || "").match(/\(([^)]+)\)\s*$/);
  return String(match?.[1] || "").trim();
};

export const getOrdererInfo = (item, session, order) => {
  const guests = getGuestsOnSession(session);
  const suffix = emailFromNameSuffix(item);
  const guest =
    guests.find((row) => row.id && row.id === (item?.orderedByGuestId || item?.guestId)) ||
    guests.find((row) => {
      const email = String(row.email || "").trim().toLowerCase();
      const itemEmail = String(item?.orderedByEmail || "").trim().toLowerCase();
      if (email && itemEmail && email === itemEmail) return true;
      if (email && (email === suffix.toLowerCase() || email.split("@")[0] === suffix.toLowerCase())) {
        return true;
      }
      return String(row.name || "").trim() === suffix;
    }) ||
    null;

  const email = item?.orderedByEmail || guest?.email || (suffix.includes("@") ? suffix : "");
  const role = String(item?.orderedByRole || guest?.role || "").toLowerCase();
  const name = item?.orderedByName || guest?.name || suffix;

  if (role === "host" || guest?.role === "host") {
    return { label: name || "Host", detail: "Table host", invitedByEmail: false };
  }
  if (email || role === "guest" || guest) {
    return {
      label: email || name,
      detail: email || guest?.email ? "Invited by email" : null,
      invitedByEmail: Boolean(email || guest?.email),
    };
  }

  const staffRole = String(item?.orderedByRole || order?.placedByRole || "").toLowerCase();
  const looksLikeGuestLabel = Boolean(suffix);
  if (
    ["captain", "staff", "owner", "manager"].includes(staffRole) ||
    order?.placedByStaffId ||
    order?.placedByName ||
    !looksLikeGuestLabel
  ) {
    return {
      label: "restaurant staff",
      prefix: "Ordered through",
      detail: null,
      invitedByEmail: false,
    };
  }
  return null;
};
