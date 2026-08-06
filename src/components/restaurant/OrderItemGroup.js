import React from "react";
import { getItemParcelTotal } from "../../utils/parcelHelpers";
import {
  formatCounterStatus,
  formatLineAmount,
  getCounterStatusTone,
} from "../../utils/orderItemGroups";

const CounterStatusBadge = ({ ticket }) => {
  if (!ticket?.statusLabel) return null;

  const tone = getCounterStatusTone(ticket.statusLabel);

  return (
    <span className={`order-item-group__status order-item-group__status--${tone}`}>
      {formatCounterStatus(ticket.statusLabel)}
    </span>
  );
};

const OrderTypeLine = ({
  type,
  item,
  counterTicket,
  showPrices,
}) => {
  if (!item) return null;

  const isParcel = type === "parcel";
  const parcelTotal = getItemParcelTotal(item);

  return (
    <div
      className={`order-item-group__type order-item-group__type--${
        isParcel ? "parcel" : "dinein"
      }`}
    >
      <div className="order-item-group__type-head">
        <div className="order-item-group__type-label">
          <span className="order-item-group__type-icon" aria-hidden>
            {isParcel ? "🥡" : "🍽️"}
          </span>
          <span>
            {isParcel ? "Takeaway" : "Dine-in"} · {item.quantity}
          </span>
        </div>
        <CounterStatusBadge ticket={counterTicket} />
      </div>

      {showPrices && (
        <div className="order-item-group__type-pricing">
          <span className="order-item-group__type-qty-price">
            {item.quantity} × ₹{formatLineAmount(item.unitPrice)}
          </span>
          <span className="order-item-group__type-total">
            ₹{formatLineAmount(item.lineFoodTotal)}
          </span>
        </div>
      )}

      {isParcel && parcelTotal > 0 && showPrices && (
        <p className="order-item-group__type-note order-item-group__type-note--parcel">
          Packaging: ₹{formatLineAmount(item.parcelCharge)} × {item.quantity} = ₹
          {formatLineAmount(parcelTotal)}
        </p>
      )}

      {!isParcel && showPrices && (
        <p className="order-item-group__type-note">Served at the restaurant</p>
      )}

      {counterTicket?.counterName && (
        <p className="order-item-group__type-counter">
          Station: {counterTicket.counterName}
        </p>
      )}
    </div>
  );
};

const OrderItemGroup = ({
  group,
  counterStatuses,
  showPrices = true,
  showCounterStatus = false,
}) => {
  const hasBoth = group.dineIn && group.parcel;

  return (
    <li className={`order-item-group ${hasBoth ? "order-item-group--mixed" : ""}`}>
      <div className="order-item-group__header">
        <div className="order-item-group__title-row">
          <strong className="order-item-group__name">{group.name}</strong>
          {group.foodType && (
            <span
              className={`checkout-page__veg-dot checkout-page__veg-dot--${group.foodType.toLowerCase()}`}
              title={group.foodType}
            />
          )}
        </div>
        {group.categoryName && (
          <span className="order-item-group__category">{group.categoryName}</span>
        )}
        {hasBoth && (
          <span className="order-item-group__mixed-tag">Dine-in &amp; takeaway</span>
        )}
      </div>

      <OrderTypeLine
        type="dinein"
        item={group.dineIn}
        counterTicket={showCounterStatus ? counterStatuses?.dinein : null}
        showPrices={showPrices}
      />
      <OrderTypeLine
        type="parcel"
        item={group.parcel}
        counterTicket={showCounterStatus ? counterStatuses?.parcel : null}
        showPrices={showPrices}
      />
    </li>
  );
};

export default OrderItemGroup;
