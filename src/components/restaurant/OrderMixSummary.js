import React from "react";
import { countOrderTypes } from "../../utils/parcelHelpers";

const OrderMixSummary = ({ items, tableNo, businessType }) => {
  const { takeaway, dineIn } = countOrderTypes(items);
  const isMixed = takeaway > 0 && dineIn > 0;

  return (
    <div className="order-mix-summary">
      <div className="order-mix-summary__counts">
        {takeaway > 0 && (
          <span className="order-mix-summary__chip order-mix-summary__chip--takeaway">
            🥡 {takeaway} takeaway
          </span>
        )}
        {dineIn > 0 && (
          <span className="order-mix-summary__chip order-mix-summary__chip--dinein">
            🍽️ {dineIn} dine in
          </span>
        )}
      </div>
      <p className="order-mix-summary__hint">
        {isMixed
          ? "Some items are for takeaway and others for dining in."
          : takeaway > 0
            ? "All items are packed for takeaway."
            : "All items are for dining in at the restaurant."}
      </p>
      {tableNo && (
        <span className="order-mix-summary__meta">Table {tableNo}</span>
      )}
      {businessType && (
        <span className="order-mix-summary__meta order-mix-summary__meta--muted">
          {String(businessType).replace(/_/g, " ")}
        </span>
      )}
    </div>
  );
};

export default OrderMixSummary;
