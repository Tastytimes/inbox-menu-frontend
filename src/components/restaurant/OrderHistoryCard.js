import React, { useState } from "react";
import { canRetryPayment } from "../../utils/paymentFlow";
import OrderDetailsCard from "./OrderDetailsCard";
import FulfillmentStatusBadge from "./FulfillmentStatusBadge";
import PaymentFailureReason from "./PaymentFailureReason";
import RetryPaymentButton from "./RetryPaymentButton";

const formatAmount = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return "0";
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
};

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const OrderHistoryCard = ({ order, onOrderUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");
  const itemCount = (order.items ?? []).reduce(
    (sum, item) => sum + (item.quantity ?? 0),
    0
  );
  const status = order.paymentStatus || "pending";
  const showFulfillment =
    status === "paid" && Boolean(order.fulfillmentStatus);

  return (
    <article className="order-history-card">
      <button
        type="button"
        className="order-history-card__header"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
      >
        <div className="order-history-card__main">
          <div className="order-history-card__top">
            {order.orderNo ? (
              <strong className="order-history-card__no">#{order.orderNo}</strong>
            ) : (
              <strong className="order-history-card__no">{order.orderReference}</strong>
            )}
            <span className={`payment-status__badge payment-status__badge--${status}`}>
              {status}
            </span>
            {showFulfillment && (
              <FulfillmentStatusBadge status={order.fulfillmentStatus} />
            )}
          </div>
          <p className="order-history-card__meta">
            {formatDate(order.createdAt)} · {itemCount} item{itemCount !== 1 ? "s" : ""}
          </p>
          <PaymentFailureReason
            order={order}
            className="order-history-card__failure-reason"
          />
        </div>
        <div className="order-history-card__right">
          <strong>₹{formatAmount(order.pricing?.customerPayAmount)}</strong>
          <span className="order-history-card__toggle">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {canRetryPayment(status) && (
        <div className="order-history-card__retry">
          <RetryPaymentButton
            order={order}
            className="order-history-card__retry-btn"
            onSuccess={onOrderUpdate}
            onError={setError}
          />
          {error && <p className="contact-details__error">{error}</p>}
        </div>
      )}

      {expanded && (
        <div className="order-history-card__details">
          <OrderDetailsCard order={order} />
        </div>
      )}
    </article>
  );
};

export default OrderHistoryCard;
