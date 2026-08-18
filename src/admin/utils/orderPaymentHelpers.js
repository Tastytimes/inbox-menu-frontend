const PAID_PAYMENT_STATUSES = new Set(["SUCCESS", "PAID", "COMPLETED"]);
const FAILED_PAYMENT_STATUSES = new Set(["FAILED", "CANCELLED", "USER_DROPPED", "EXPIRED"]);

export const getPaymentProviderLabel = (provider) => {
  switch (String(provider || "").toLowerCase()) {
    case "payu":
      return "PayU";
    case "cashfree":
      return "Cashfree";
    default:
      return "—";
  }
};

export const resolvePaymentProvider = (data) =>
  data?.paymentProvider ?? data?.paymentMethod ?? null;

export const resolvePaymentStatus = (data) => {
  if (!data) return null;
  if (data.paymentStatus) return String(data.paymentStatus).toLowerCase();

  const payuPayment = String(data.payuPaymentStatus || "").toUpperCase();
  const cashfreePayment = String(data.cashfreePaymentStatus || "").toUpperCase();
  const cashfreeOrder = String(data.cashfreeOrderStatus || "").toUpperCase();

  if (
    PAID_PAYMENT_STATUSES.has(payuPayment) ||
    PAID_PAYMENT_STATUSES.has(cashfreePayment) ||
    PAID_PAYMENT_STATUSES.has(cashfreeOrder)
  ) {
    return "paid";
  }
  if (FAILED_PAYMENT_STATUSES.has(payuPayment) || FAILED_PAYMENT_STATUSES.has(cashfreePayment)) {
    return "failed";
  }
  if (payuPayment === "PENDING" || cashfreePayment === "PENDING" || cashfreeOrder === "ACTIVE") {
    return "pending";
  }
  if (payuPayment) return payuPayment.toLowerCase();
  if (cashfreePayment) return cashfreePayment.toLowerCase();
  if (cashfreeOrder) return cashfreeOrder.toLowerCase();
  return null;
};

export const getPaymentStatusLabel = (data) => {
  const status = resolvePaymentStatus(data);
  if (status === "paid") return "Paid";
  if (status === "pending") return "Pending";
  if (status === "failed") return "Failed";
  return (
    data?.paymentStatus ??
    data?.payuPaymentStatus ??
    data?.cashfreePaymentStatus ??
    data?.cashfreeOrderStatus ??
    "—"
  );
};

export const resolveCashfreeOrderId = (data) =>
  data?.cashfreeOrderId ?? data?.orderReference ?? null;

export const resolveCashfreePaymentId = (data) =>
  data?.cashfreePaymentId ?? data?.cashfreeRefund?.cf_payment_id ?? null;

export const resolvePayUPaymentId = (data) => data?.payuPaymentId ?? null;

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
    paymentProvider: resolvePaymentProvider(merged),
    paymentStatus: resolvePaymentStatus(merged),
    cashfreeOrderId: resolveCashfreeOrderId(merged),
    cashfreePaymentId: resolveCashfreePaymentId(merged),
    cashfreePaymentStatus: merged.cashfreePaymentStatus ?? null,
    cashfreeOrderStatus: merged.cashfreeOrderStatus ?? null,
    payuPaymentId: resolvePayUPaymentId(merged),
    payuPaymentStatus: merged.payuPaymentStatus ?? null,
    payuPaymentMessage: merged.payuPaymentMessage ?? null,
    paymentSessionId: merged.paymentSessionId ?? null,
    cashfreeRefundId: merged.cashfreeRefundId ?? null,
    payuRefundId: merged.payuRefundId ?? null,
    payuRefundStatus: merged.payuRefundStatus ?? null,
    refundStatus:
      merged.refundStatus ??
      merged.currentStatus ??
      merged.payuRefundStatus ??
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

  const provider = resolvePaymentProvider(order);
  const providerLabel = getPaymentProviderLabel(provider);

  const rows = [
    {
      label: "Payment gateway",
      type: "text",
      value: provider,
      labelText: providerLabel,
    },
    {
      label: "Payment status",
      type: "badge",
      value: resolvePaymentStatus(order),
      labelText: getPaymentStatusLabel(order),
    },
  ];

  if (provider === "payu" || order.payuPaymentId || order.payuPaymentStatus) {
    rows.push(
      {
        label: "PayU payment status",
        type: "badge",
        value: order.payuPaymentStatus,
        labelText: order.payuPaymentStatus,
      },
      { label: "PayU payment ID", type: "mono", value: order.payuPaymentId },
      { label: "PayU refund ID", type: "mono", value: order.payuRefundId },
      {
        label: "PayU refund status",
        type: "badge",
        value: order.payuRefundStatus,
        labelText: order.payuRefundStatus,
      }
    );
  }

  if (provider === "cashfree" || order.cashfreeOrderId || order.cashfreePaymentStatus) {
    rows.push(
      {
        label: "Cashfree payment status",
        type: "badge",
        value: order.cashfreePaymentStatus,
        labelText: order.cashfreePaymentStatus,
      },
      {
        label: "Cashfree order status",
        type: "badge",
        value: order.cashfreeOrderStatus,
        labelText: order.cashfreeOrderStatus,
      },
      { label: "Cashfree order ID", type: "mono", value: order.cashfreeOrderId },
      { label: "Cashfree payment ID", type: "mono", value: order.cashfreePaymentId },
      { label: "Payment session ID", type: "mono", value: order.paymentSessionId },
      { label: "Cashfree refund ID", type: "mono", value: order.cashfreeRefundId }
    );
  }

  rows.push(
    { label: "Razorpay payment ID", type: "mono", value: order.razorpayPaymentId },
    {
      label: "Refund status",
      type: "badge",
      value: order.refundStatus,
      labelText: order.refundStatus,
    },
    { label: "Description", type: "text", value: order.description }
  );

  return rows.filter((row) => row.value != null && row.value !== "");
};
