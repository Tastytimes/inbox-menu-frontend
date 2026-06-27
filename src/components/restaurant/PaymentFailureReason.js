import React from "react";
import { getPaymentFailureMessage } from "../../utils/paymentFailureMessage";

const PaymentFailureReason = ({ order, className = "payment-failure-reason" }) => {
  const message = getPaymentFailureMessage(order);
  if (!message) return null;

  return (
    <p className={className} role="alert">
      <span className="payment-failure-reason__label">Reason:</span> {message}
    </p>
  );
};

export default PaymentFailureReason;
