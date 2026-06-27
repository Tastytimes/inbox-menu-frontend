import React from "react";

const ORDER_TYPES = {
  parcel: {
    label: "Takeaway",
    description: "Your order will be packed to go",
    icon: "🥡",
  },
  dineIn: {
    label: "Dine in",
    description: "Enjoy your meal at the restaurant",
    icon: "🍽️",
  },
};

const OrderTypeBadge = ({ isParcel, tableNo, businessType }) => {
  const type = isParcel ? ORDER_TYPES.parcel : ORDER_TYPES.dineIn;

  return (
    <div
      className={`order-type-badge ${isParcel ? "order-type-badge--parcel" : "order-type-badge--dinein"}`}
    >
      <span className="order-type-badge__icon" aria-hidden>
        {type.icon}
      </span>
      <div className="order-type-badge__text">
        <span className="order-type-badge__label">{type.label}</span>
        <span className="order-type-badge__desc">{type.description}</span>
        {tableNo && (
          <span className="order-type-badge__meta">Table {tableNo}</span>
        )}
        {businessType && (
          <span className="order-type-badge__meta order-type-badge__meta--muted">
            {formatBusinessType(businessType)}
          </span>
        )}
      </div>
      <span
        className={`order-type-badge__pill ${isParcel ? "order-type-badge__pill--yes" : "order-type-badge__pill--no"}`}
      >
        {isParcel ? "Parcel" : "Not parcel"}
      </span>
    </div>
  );
};

const formatBusinessType = (type) =>
  String(type)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default OrderTypeBadge;
