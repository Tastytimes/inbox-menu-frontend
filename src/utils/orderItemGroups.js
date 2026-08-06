import { isTakeawayItem } from "./parcelHelpers";

const formatAmount = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return "0";
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
};

export const formatCounterStatus = (label) => {
  if (!label) return "In progress";
  return String(label)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
};

export const getCounterStatusTone = (label) => {
  const normalized = String(label || "").toLowerCase();
  if (normalized.includes("ready")) return "ready";
  if (normalized.includes("wait") || normalized.includes("pending")) return "waiting";
  if (normalized.includes("prepar") || normalized.includes("progress")) return "preparing";
  if (normalized.includes("cancel") || normalized.includes("declin")) return "cancelled";
  return "default";
};

export const classifyCounter = (counterName) => {
  const name = String(counterName || "").toLowerCase();
  if (/parcel|takeaway|pack|tog[o0]|pickup/.test(name)) return "parcel";
  if (/dine|table|hall|serve|counter(?!.*parcel)/.test(name)) return "dinein";
  return "other";
};

/** Map kitchen counter tickets to dine-in vs takeaway lanes. */
export const resolveCounterStatuses = (counterTickets = []) => {
  const mapped = { dinein: null, parcel: null, other: [] };

  counterTickets.forEach((ticket) => {
    const kind = classifyCounter(ticket.counterName);
    if (kind === "parcel" && !mapped.parcel) {
      mapped.parcel = ticket;
    } else if (kind === "dinein" && !mapped.dinein) {
      mapped.dinein = ticket;
    } else {
      mapped.other.push(ticket);
    }
  });

  return mapped;
};

/** Group cart/order lines by food — one card per dish with dine-in & takeaway rows. */
export const groupOrderItems = (items = []) => {
  const map = new Map();

  items.forEach((item) => {
    const key = item.foodId ?? item.name;
    if (!map.has(key)) {
      map.set(key, {
        key,
        foodId: item.foodId,
        name: item.name,
        categoryName: item.categoryName,
        foodType: item.foodType,
        dineIn: null,
        parcel: null,
      });
    }

    const group = map.get(key);
    if (isTakeawayItem(item)) {
      group.parcel = item;
    } else {
      group.dineIn = item;
    }

    if (!group.categoryName && item.categoryName) {
      group.categoryName = item.categoryName;
    }
  });

  return Array.from(map.values());
};

export const getGroupFoodTotal = (group) => {
  let total = 0;
  [group.dineIn, group.parcel].forEach((line) => {
    if (line?.lineFoodTotal != null) {
      total += Number(line.lineFoodTotal);
    }
  });
  return total;
};

export const formatLineAmount = formatAmount;
