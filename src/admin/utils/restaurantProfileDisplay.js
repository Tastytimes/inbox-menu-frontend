import { formatBusinessTypeList } from "../constants/businessTypes";

export const getRestaurantDisplayName = (profile) =>
  profile?.basicInfo?.restaurantName ||
  profile?.verification?.restaurantName ||
  "Restaurant";

export const getRegistrationStatus = (profile) =>
  profile?.operational?.registrationStatus ||
  profile?.basicInfo?.status ||
  null;

export const getClientIdFromProfile = (profile) =>
  profile?.verification?.clientId || profile?.owner?.clientId || null;

export const getIsRestaurantActive = (profile) =>
  profile?.operational?.isActive ?? profile?.basicInfo?.isActive ?? false;

export const formatBusinessTypes = (basicInfo) => {
  const types = basicInfo?.businessType || basicInfo?.businessTypes || [];
  return formatBusinessTypeList(types);
};

export { formatBusinessTypeList, getBusinessTypeLabel } from "../constants/businessTypes";

export const displayValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return value;
};

export const buildMenuView = (menu) => {
  if (!menu) {
    return { categories: [], counters: [], foods: [] };
  }

  const categories = menu.categories || [];
  const counters = menu.counters || [];
  const foods = menu.foods || [];

  const categoriesWithFoods = categories.map((category) => ({
    ...category,
    foods: foods.filter((food) => food.categoryId === category.id),
  }));

  return { categories: categoriesWithFoods, counters, foods };
};

export const formatChargeValue = (charge) => {
  const type = charge.chargeType || charge.type || "";
  const value = charge.value ?? charge.amount ?? 0;
  if (type === "percentage" || type === "percent") {
    return `${value}%`;
  }
  return value;
};

export const formatPaymentAmount = (amountPaise, currency = "INR") => {
  const amount = Number(amountPaise);
  if (!Number.isFinite(amount)) return "—";
  const rupees = amount / 100;
  return currency === "INR" ? `₹${rupees.toLocaleString("en-IN")}` : `${rupees} ${currency}`;
};
