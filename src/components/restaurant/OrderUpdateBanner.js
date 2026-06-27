import React, { useEffect } from "react";

const OrderUpdateBanner = ({ message, onDismiss }) => {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => onDismiss?.(), 8000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="order-update-banner" role="status" aria-live="polite">
      <p className="order-update-banner__text">{message}</p>
      <button
        type="button"
        className="order-update-banner__close"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
};

export default OrderUpdateBanner;
