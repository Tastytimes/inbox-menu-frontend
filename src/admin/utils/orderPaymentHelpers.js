const PAID_PAYMENT_STATUSES = new Set(["SUCCESS", "PAID", "COMPLETED"]);
const FAILED_PAYMENT_STATUSES = new Set(["FAILED", "CANCELLED", "USER_DROPPED", "EXPIRED"]);

export const resolvePaymentStatus = (data) => {
  if (!data) return null;
  if (data.paymentStatus) return String(data.paymentStatus).toLowerCase();

  const cashfreePayment = String(data.cashfreePaymentStatus || "").toUpperCase();
  const cashfreeOrder = String(data.cashfreeOrderStatus || "").toUpperCase();

  if (PAID_PAYMENT_STATUSES.has(cashfreePayment) || PAID_PAYMENT_STATUSES.has(cashfreeOrder)) {
    return "paid";
  }
  if (FAILED_PAYMENT_STATUSES.has(cashfreePayment)) {
    return "failed";
  }
  if (cashfreePayment === "PENDING" || cashfreeOrder === "ACTIVE") {
    return "pending";
  }
  if (cashfreePayment) return cashfreePayment.toLowerCase();
  if (cashfreeOrder) return cashfreeOrder.toLowerCase();
  return null;
};

export const getPaymentStatusLabel = (data) => {
  const status = resolvePaymentStatus(data);
  if (status === "paid") return "Paid";
  if (status === "pending") return "Pending";
  if (status === "failed") return "Failed";
  return data?.paymentStatus ?? data?.cashfreePaymentStatus ?? data?.cashfreeOrderStatus ?? "—";
};

export const resolveCashfreeOrderId = (data) =>
  data?.cashfreeOrderId ?? data?.orderReference ?? null;

export const resolveCashfreePaymentId = (data) =>
  data?.cashfreePaymentId ?? data?.cashfreeRefund?.cf_payment_id ?? null;

/** Merge support order + refund candidate/detail into one view model. */
export const mergeOrderPaymentDetails = (order, refundDetail) => {
  if (!order && !refundDetail) return null;

  const refundOrder = refundDetail?.order;
  const refundRoot = refundDetail && !refundOrder ? refundDetail : null;

  const layers = [order, refundOrder, refundRoot, refundDetail].filter(Boolean);
  const merged = layers.reduce((acc, layer) => ({ ...acc, ...layer }), {});

  return {
    ...merged,
    pricing: order?.pricing ?? refundOrder?.pricing ?? refundDetail?.pricing ?? merged.pricing,
    summary: order?.summary ?? refundOrder?.summary ?? refundDetail?.summary ?? merged.summary,
    items: order?.items ?? refundOrder?.items ?? refundDetail?.items ?? merged.items,
    paymentStatus: resolvePaymentStatus(merged),
    cashfreeOrderId: resolveCashfreeOrderId(merged),
    cashfreePaymentId: resolveCashfreePaymentId(merged),
    cashfreePaymentStatus: merged.cashfreePaymentStatus ?? null,
    cashfreeOrderStatus: merged.cashfreeOrderStatus ?? null,
    paymentSessionId: merged.paymentSessionId ?? null,
    cashfreeRefundId: merged.cashfreeRefundId ?? null,
    refundStatus:
      merged.refundStatus ??
      merged.currentStatus ??
      merged.cashfreeRefundStatus ??
      null,
    refundAmount: merged.refundAmount ?? null,
    refundNote: merged.refundNote ?? null,
    refundedAt: merged.refundedAt ?? null,
    description: merged.description ?? refundDetail?.description ?? null,
  };
};

export const getOrderGatewayDetails = (order) => {
  if (!order) return [];

  const rows = [
    { label: "Payment status", type: "badge", value: resolvePaymentStatus(order), labelText: getPaymentStatusLabel(order) },
    { label: "Cashfree payment status", type: "badge", value: order.cashfreePaymentStatus, labelText: order.cashfreePaymentStatus },
    { label: "Cashfree order status", type: "badge", value: order.cashfreeOrderStatus, labelText: order.cashfreeOrderStatus },
    { label: "Cashfree order ID", type: "mono", value: order.cashfreeOrderId },
    { label: "Cashfree payment ID", type: "mono", value: order.cashfreePaymentId },
    { label: "Payment session ID", type: "mono", value: order.paymentSessionId },
    { label: "Razorpay payment ID", type: "mono", value: order.razorpayPaymentId },
    { label: "Cashfree refund ID", type: "mono", value: order.cashfreeRefundId },
    { label: "Refund status", type: "badge", value: order.refundStatus, labelText: order.refundStatus },
    { label: "Description", type: "text", value: order.description },
  ];

  return rows.filter((row) => row.value != null && row.value !== "");
};
