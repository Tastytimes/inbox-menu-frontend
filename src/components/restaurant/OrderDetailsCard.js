import React from "react";
import { countOrderTypes } from "../../utils/parcelHelpers";
import CheckoutItemRow from "./CheckoutItemRow";
import CheckoutSummary from "./CheckoutSummary";

const formatAmount = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return "0";
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
};

const OrderDetailsCard = ({ order }) => {
  if (!order) return null;

  const { takeaway, dineIn } = countOrderTypes(order.items ?? []);
  const items = order.items ?? [];

  return (
    <section className="order-details-card" aria-label="Order details">
      <h2 className="order-details-card__heading">Order details</h2>

      <div className="order-details-card__meta">
        {order.orderNo && (
          <div className="order-details-card__meta-row">
            <span>Order no</span>
            <strong className="order-details-card__order-no">{order.orderNo}</strong>
          </div>
        )}
        <div className="order-details-card__meta-row">
          <span>Order ref</span>
          <strong>{order.orderReference}</strong>
        </div>
        {order.tableNo && (
          <div className="order-details-card__meta-row">
            <span>Table</span>
            <strong>{order.tableNo}</strong>
          </div>
        )}
        {(takeaway > 0 || dineIn > 0) && (
          <div className="order-details-card__meta-row">
            <span>Order type</span>
            <span className="order-details-card__mix">
              {takeaway > 0 && (
                <span className="checkout-page__type-chip checkout-page__type-chip--takeaway">
                  {takeaway} takeaway
                </span>
              )}
              {dineIn > 0 && (
                <span className="checkout-page__type-chip checkout-page__type-chip--dinein">
                  {dineIn} dine in
                </span>
              )}
            </span>
          </div>
        )}
        <div className="order-details-card__meta-row">
          <span>Amount paid</span>
          <strong>₹{formatAmount(order.pricing?.customerPayAmount)}</strong>
        </div>
      </div>

      {items.length > 0 && (
        <>
          <h3 className="order-details-card__subheading">Items</h3>
          <ul className="checkout-page__items order-details-card__items">
            {items.map((item) => (
              <CheckoutItemRow key={item.foodId} item={item} />
            ))}
          </ul>
        </>
      )}

      {order.summary && (
        <CheckoutSummary
          summary={order.summary}
          items={items}
          pricing={order.pricing}
        />
      )}
    </section>
  );
};

export default OrderDetailsCard;
