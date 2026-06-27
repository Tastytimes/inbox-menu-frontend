import React from "react";
import { getFulfillmentLabel } from "../../utils/fulfillmentStatus";

const FulfillmentStatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = String(status).toLowerCase();

  return (
    <span
      className={`fulfillment-status-badge fulfillment-status-badge--${normalized}`}
    >
      {getFulfillmentLabel(status)}
    </span>
  );
};

export default FulfillmentStatusBadge;
