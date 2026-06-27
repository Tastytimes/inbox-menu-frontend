import React, { useState } from "react";
import { retryOrderPayment } from "../../api/orderApi";
import { canRetryPayment, launchCashfreePayment } from "../../utils/paymentFlow";

const RetryPaymentButton = ({
  order,
  onSuccess,
  onError,
  className = "payment-status__retry-btn",
  label = "Retry payment",
}) => {
  const [retrying, setRetrying] = useState(false);

  if (!order?.orderId || !canRetryPayment(order.paymentStatus)) {
    return null;
  }

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const response = await retryOrderPayment(order.orderId);
      const result = await launchCashfreePayment({
        ...response,
        slug: response.slug || order.slug,
      });

      if (result.paid) {
        onSuccess?.(response);
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Could not retry payment. Please try again.";
      onError?.(message);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleRetry}
      disabled={retrying}
    >
      {retrying ? "Redirecting to Cashfree…" : label}
    </button>
  );
};

export default RetryPaymentButton;
