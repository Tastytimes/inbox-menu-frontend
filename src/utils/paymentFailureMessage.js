const FAILED_STATUSES = new Set(["failed", "expired"]);

const pickText = (...values) => {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return null;
};

const formatErrorReason = (reason) =>
  reason.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

/**
 * Resolve user-facing payment failure text from order API response.
 * Mirrors backend buildPaymentFailureReason + paymentFailureReason field.
 */
export const getPaymentFailureMessage = (order) => {
  if (!order) return null;

  const status = String(order.paymentStatus || "").toLowerCase();
  if (!FAILED_STATUSES.has(status)) return null;

  if (status === "expired") {
    return pickText(order.paymentFailureReason, "Payment session expired");
  }

  const backendReason = pickText(order.paymentFailureReason);
  if (backendReason) return backendReason;

  const error = order.cashfreePaymentError;
  const paymentStatus = String(order.cashfreePaymentStatus || "").toUpperCase();

  const fromError = pickText(
    error?.error_description,
    error?.error_description_raw
  );
  if (fromError) return fromError;

  if (paymentStatus === "USER_DROPPED") {
    return "Payment was not completed";
  }

  if (paymentStatus === "CANCELLED") {
    return "Payment was cancelled";
  }

  const errorReason = pickText(error?.error_reason);
  if (errorReason) return formatErrorReason(errorReason);

  const paymentMessage = pickText(order.payuPaymentMessage, order.cashfreePaymentMessage);
  if (paymentMessage && paymentMessage.toLowerCase() !== "simulated response message") {
    return paymentMessage;
  }

  if (paymentStatus === "FAILED") {
    return "Payment failed";
  }

  return "Payment failed. Please try again.";
};
