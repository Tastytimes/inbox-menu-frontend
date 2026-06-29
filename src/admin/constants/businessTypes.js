export const BUSINESS_TYPES = {
  FINE_DINING: "fine_dining",
  QUICK_DINING: "quick_dining",
  EXPRESS_DELIVERY: "express_delivery",
};

export const BUSINESS_TYPE_OPTIONS = [
  { value: BUSINESS_TYPES.FINE_DINING, label: "Fine dining" },
  { value: BUSINESS_TYPES.QUICK_DINING, label: "Quick dining" },
  { value: BUSINESS_TYPES.EXPRESS_DELIVERY, label: "Express delivery" },
];

export const getBusinessTypeLabel = (value) =>
  BUSINESS_TYPE_OPTIONS.find((option) => option.value === value)?.label || value;

export const formatBusinessTypeList = (types) => {
  const list = Array.isArray(types) ? types : types ? [types] : [];
  const labels = list.map(getBusinessTypeLabel).filter(Boolean);
  return labels.length ? labels.join(", ") : "—";
};
