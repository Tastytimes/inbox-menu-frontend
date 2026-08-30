export const REFUND_REASON_LABELS = {
  payment_mismatch: "Payment mismatch",
  cancelled_unrefunded: "Cancelled without refund",
  manual_admin: "Manual admin",
};

export const getRefundReasonLabel = (reason) =>
  REFUND_REASON_LABELS[reason] || reason || "—";

export const SUBSCRIPTION_STATUS_FILTERS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
  { value: "pending", label: "Pending" },
];

export const PRICING_MODEL_OPTIONS = [
  { value: "flat", label: "Flat" },
];

export const GST_SPLIT_OPTIONS = [
  { value: "cgst_sgst", label: "CGST + SGST (same state)" },
  { value: "igst", label: "IGST (inter-state)" },
];

export const PLATFORM_FEE_TYPE_OPTIONS = [
  { value: "flat", label: "Flat amount (₹)" },
  { value: "percent", label: "Percentage (%)" },
];

export const planToForm = (plan = {}) => ({
  code: plan.code || plan.planCode || "",
  name: plan.name || plan.planName || "",
  coveredTypes: [...(plan.coveredTypes || (plan.businessType ? [plan.businessType] : []))],
  pricingModel: plan.pricingModel || "flat",
  price:
    plan.price != null
      ? String(plan.price)
      : plan.priceInPaise
        ? String(plan.priceInPaise / 100)
        : "",
  durationDays: plan.durationDays != null ? String(plan.durationDays) : "",
  sacCode: plan.sacCode || "",
  gstRatePercent: plan.gstRatePercent != null ? String(plan.gstRatePercent) : "",
  platformFee: plan.platformFee != null ? String(plan.platformFee) : "",
  platformFeeType: plan.platformFeeType || "flat",
  isActive: plan.isActive !== false,
});

export const formToPlanPayload = (form, { isUpdate = false } = {}) => {
  const payload = {
    name: form.name.trim(),
    coveredTypes: form.coveredTypes || [],
    pricingModel: form.pricingModel,
    price: Number(form.price),
    durationDays: Number(form.durationDays),
    isActive: form.isActive,
    sacCode: form.sacCode.trim() || undefined,
    gstRatePercent:
      form.gstRatePercent.trim() === "" ? undefined : Number(form.gstRatePercent),
    platformFee:
      form.platformFee.trim() === "" ? undefined : Number(form.platformFee),
    platformFeeType: form.platformFeeType || "flat",
  };

  if (!isUpdate) {
    payload.code = form.code.trim();
  }

  return payload;
};

export const subscriptionGrantToForm = () => ({
  clientId: "",
  planCode: "",
  quantity: "1",
  status: "active",
});

export const formToSubscriptionGrant = (form) => ({
  clientId: Number(form.clientId),
  planCode: form.planCode.trim(),
  quantity: Number(form.quantity) || 1,
  status: form.status,
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const getSubscriptionExpiryInfo = (subscription) => {
  if (subscription?.daysUntilExpiry != null && Number.isFinite(subscription.daysUntilExpiry)) {
    const daysUntilExpiry = subscription.daysUntilExpiry;
    return {
      daysUntilExpiry,
      tier: getExpiryTier(daysUntilExpiry),
      sortKey: daysUntilExpiry,
    };
  }

  if (!subscription?.endDate) {
    return { daysUntilExpiry: null, tier: "none", sortKey: Infinity };
  }

  const endDate = new Date(subscription.endDate);
  if (Number.isNaN(endDate.getTime())) {
    return { daysUntilExpiry: null, tier: "none", sortKey: Infinity };
  }

  const daysUntilExpiry = Math.ceil((endDate.getTime() - Date.now()) / MS_PER_DAY);
  return {
    daysUntilExpiry,
    tier: getExpiryTier(daysUntilExpiry),
    sortKey: daysUntilExpiry,
  };
};

export const getExpiryTier = (daysUntilExpiry) => {
  if (daysUntilExpiry == null || !Number.isFinite(daysUntilExpiry)) return "none";
  if (daysUntilExpiry < 0) return "expired";
  if (daysUntilExpiry < 3) return "urgent";
  if (daysUntilExpiry < 7) return "warning";
  return "normal";
};

export const getSubscriptionRowClass = (tier) => {
  if (tier === "expired") return "admin-sub-row--expired";
  if (tier === "urgent") return "admin-sub-row--urgent";
  if (tier === "warning") return "admin-sub-row--warning";
  return "";
};

export const getExpiryLabel = (daysUntilExpiry) => {
  if (daysUntilExpiry == null) return null;
  if (daysUntilExpiry < 0) return `Expired ${Math.abs(daysUntilExpiry)}d ago`;
  if (daysUntilExpiry === 0) return "Expires today";
  return `${daysUntilExpiry}d left`;
};

export const sortSubscriptionsByExpiry = (subscriptions) =>
  [...subscriptions].sort((a, b) => {
    const infoA = getSubscriptionExpiryInfo(a);
    const infoB = getSubscriptionExpiryInfo(b);

    if (infoA.sortKey === Infinity && infoB.sortKey === Infinity) return 0;
    if (infoA.sortKey === Infinity) return 1;
    if (infoB.sortKey === Infinity) return -1;

    return infoA.sortKey - infoB.sortKey;
  });
