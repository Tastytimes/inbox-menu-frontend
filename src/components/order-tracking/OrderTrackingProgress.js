import React from "react";
import { getFulfillmentLabel } from "../../utils/fulfillmentStatus";

const TRACKING_STEPS = ["placed", "accepted", "preparing", "ready"];

const STEP_LABELS = {
  placed: "Placed",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
};

const OrderTrackingProgress = ({ status }) => {
  const normalized = String(status || "placed").toLowerCase();
  const isTerminal = ["delivered", "cancelled", "declined"].includes(normalized);
  const activeIndex = isTerminal
    ? TRACKING_STEPS.length - 1
    : Math.max(0, TRACKING_STEPS.indexOf(normalized));

  if (isTerminal && normalized !== "delivered") {
    return (
      <div className={`order-track-progress order-track-progress--${normalized}`}>
        <span className="order-track-progress__terminal-icon" aria-hidden>
          {normalized === "cancelled" ? "✕" : "!"}
        </span>
        <p className="order-track-progress__terminal-label">
          {getFulfillmentLabel(normalized)}
        </p>
      </div>
    );
  }

  return (
    <ol className="order-track-progress" aria-label="Order progress">
      {TRACKING_STEPS.map((step, index) => {
        const isComplete = index < activeIndex || normalized === "delivered";
        const isCurrent = index === activeIndex && normalized !== "delivered";
        const isUpcoming = index > activeIndex && normalized !== "delivered";

        return (
          <li
            key={step}
            className={[
              "order-track-progress__step",
              isComplete ? "order-track-progress__step--complete" : "",
              isCurrent ? "order-track-progress__step--current" : "",
              isUpcoming ? "order-track-progress__step--upcoming" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="order-track-progress__dot" aria-hidden>
              {isComplete ? "✓" : index + 1}
            </span>
            <span className="order-track-progress__label">{STEP_LABELS[step]}</span>
          </li>
        );
      })}
    </ol>
  );
};

export default OrderTrackingProgress;
