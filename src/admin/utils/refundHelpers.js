export const normalizeRefundCandidates = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.candidates)) return response.candidates;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

export const getRefundCandidateOrderId = (item) =>
  item?.orderId ?? item?.id ?? item?.order?.orderId ?? null;

export const getRefundCandidateAmount = (item) =>
  item?.refundAmount ??
  item?.amount ??
  item?.pricing?.customerPayAmount ??
  item?.order?.pricing?.customerPayAmount ??
  item?.paymentAmount;

export const buildRefundCandidateIdSet = (candidates) =>
  new Set(candidates.map(getRefundCandidateOrderId).filter(Boolean));

export const isRefundComplete = (status) => {
  const value = String(status || "").toLowerCase();
  return value === "success" || value === "refunded" || value === "completed";
};

export const isRefundFailedStatus = (status) => {
  const value = String(status || "").toLowerCase();
  return value === "failed" || value === "failure" || value === "error";
};

export const isRefundFailed = (data) => {
  if (!data) return false;
  const status = resolveRefundStatus(data);
  const gateway = resolveGatewayRefundStatus(data);
  return isRefundFailedStatus(status) || isRefundFailedStatus(gateway);
};

export const getPaymentProviderLabel = (provider) => {
  switch (String(provider || "").toLowerCase()) {
    case "payu":
      return "PayU";
    case "cashfree":
      return "Cashfree";
    default:
      return "Payment gateway";
  }
};

export const resolveRefundProvider = (data) =>
  data?.paymentProvider ??
  data?.order?.paymentProvider ??
  data?.order?.paymentMethod ??
  data?.paymentMethod ??
  null;

export const resolveRefundStatus = (data) => {
  if (!data) return null;
  return (
    data.currentStatus ??
    data.payuRefundStatus ??
    data.cashfreeRefundStatus ??
    data.refundStatus ??
    data.order?.refundStatus ??
    null
  );
};

export const resolveGatewayRefundStatus = (data) =>
  data?.payuRefundStatus ?? data?.cashfreeRefundStatus ?? null;

export const isSyncedFromGateway = (data) =>
  data?.syncedFromGateway ?? data?.syncedFromCashfree ?? null;

/** Maps GET /refunds/candidates/:orderId/status (and related) into UI fields. */
export const normalizeRefundStatusResponse = (data) => {
  if (!data) return null;

  const order = data.order;
  const cashfreeRefund = data.cashfreeRefund;
  const payuRefund = data.payuRefund;
  const paymentProvider = resolveRefundProvider(data);

  return {
    paymentProvider,
    refundStatus: resolveRefundStatus(data),
    previousStatus: data.previousStatus ?? null,
    cashfreeRefundStatus: data.cashfreeRefundStatus ?? null,
    payuRefundStatus: data.payuRefundStatus ?? order?.payuRefundStatus ?? null,
    payuRefundMessage: data.payuRefundMessage ?? order?.payuRefundMessage ?? null,
    currentStatus: data.currentStatus ?? null,
    message: data.message ?? null,
    syncedFromGateway: isSyncedFromGateway(data),
    syncedFromCashfree: data.syncedFromCashfree ?? null,
    refundAmount:
      data.refundAmount ??
      order?.refundAmount ??
      payuRefund?.amt ??
      cashfreeRefund?.refund_amount ??
      cashfreeRefund?.refundAmount ??
      null,
    refundNote: data.refundNote ?? order?.refundNote ?? null,
    refundedAt:
      data.refundedAt ??
      order?.refundedAt ??
      cashfreeRefund?.processed_at ??
      cashfreeRefund?.refund_date ??
      null,
    cashfreeRefundId:
      data.cashfreeRefundId ??
      order?.cashfreeRefundId ??
      cashfreeRefund?.refund_id ??
      cashfreeRefund?.cf_refund_id ??
      null,
    payuRefundId:
      data.payuRefundId ?? order?.payuRefundId ?? payuRefund?.token ?? null,
    cashfreePaymentId:
      data.cashfreePaymentId ??
      order?.cashfreePaymentId ??
      cashfreeRefund?.cf_payment_id ??
      null,
    payuPaymentId: data.payuPaymentId ?? order?.payuPaymentId ?? null,
    order,
    cashfreeRefund,
    payuRefund,
  };
};

export const normalizeRefundRecord = (source) => {
  if (!source) return {};
  if (
    source.currentStatus != null ||
    source.cashfreeRefundStatus != null ||
    source.payuRefundStatus != null ||
    source.syncedFromGateway != null ||
    source.syncedFromCashfree != null ||
    source.previousStatus != null
  ) {
    return normalizeRefundStatusResponse(source) || {};
  }

  const order = source.order;
  return {
    paymentProvider: resolveRefundProvider(source),
    refundStatus: source.refundStatus ?? order?.refundStatus ?? null,
    refundAmount: source.refundAmount ?? order?.refundAmount ?? null,
    refundNote: source.refundNote ?? order?.refundNote ?? null,
    refundedAt: source.refundedAt ?? order?.refundedAt ?? null,
    cashfreeRefundId: source.cashfreeRefundId ?? order?.cashfreeRefundId ?? null,
    payuRefundId: source.payuRefundId ?? order?.payuRefundId ?? null,
    payuRefundStatus: source.payuRefundStatus ?? order?.payuRefundStatus ?? null,
    payuRefundMessage: source.payuRefundMessage ?? order?.payuRefundMessage ?? null,
    cashfreePaymentId: source.cashfreePaymentId ?? order?.cashfreePaymentId ?? null,
    payuPaymentId: source.payuPaymentId ?? order?.payuPaymentId ?? null,
    refundReason: source.refundReason ?? source.reason ?? null,
  };
};

export const hasRefundStarted = (data) =>
  Boolean(
    resolveRefundStatus(data) ||
      data?.previousStatus ||
      data?.cashfreeRefundId ||
      data?.payuRefundId ||
      data?.cashfreeRefund ||
      data?.payuRefund ||
      data?.refundAmount != null ||
      data?.refundedAt
  );

export const getRefundStatusLabel = (status) => {
  if (!status) return "Not initiated";
  const value = String(status);
  const lower = value.toLowerCase();
  if (isRefundComplete(value)) return "Completed";
  if (lower === "success") return "Success";
  if (lower === "pending" || lower === "queued" || lower === "requested") return "Pending";
  if (lower === "failed") return "Failed";
  return value;
};

export const mergeRefundSnapshot = (...sources) =>
  sources.reduce((merged, source) => {
    const normalized = normalizeRefundRecord(source);
    const next = { ...merged };
    Object.entries(normalized).forEach(([key, value]) => {
      if (value != null && value !== "") {
        next[key] = value;
      }
    });
    return next;
  }, {});

export const getDefaultRefundAmount = (orderData, refundData) => {
  const amount =
    refundData?.refundAmount ??
    refundData?.order?.pricing?.customerPayAmount ??
    refundData?.amount ??
    orderData?.pricing?.customerPayAmount ??
    orderData?.customerPayAmount;
  return amount != null ? String(amount) : "";
};
