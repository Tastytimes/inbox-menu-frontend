import React from "react";
import { isTakeawayItem, getItemParcelTotal } from "../../utils/parcelHelpers";

const formatAmount = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return "0";
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
};

const CheckoutItemRow = ({ item }) => {
  const takeaway = isTakeawayItem(item);
  const itemParcel = getItemParcelTotal(item);

  return (
    <li
      className={`checkout-page__item checkout-page__item--${
        takeaway ? "takeaway" : "dinein"
      }`}
    >
      <div className="checkout-page__item-info">
        <div className="checkout-page__item-name-row">
          <strong>{item.name}</strong>
          {item.foodType && (
            <span
              className={`checkout-page__veg-dot checkout-page__veg-dot--${item.foodType.toLowerCase()}`}
              title={item.foodType}
            />
          )}
          <span
            className={`checkout-page__type-chip ${
              takeaway
                ? "checkout-page__type-chip--takeaway"
                : "checkout-page__type-chip--dinein"
            }`}
          >
            {takeaway ? "Takeaway" : "Dine in"}
          </span>
        </div>
        {item.categoryName && (
          <span className="checkout-page__category">{item.categoryName}</span>
        )}
        <span className="checkout-page__qty">
          {item.quantity} × ₹{formatAmount(item.unitPrice)}
        </span>
        {takeaway && itemParcel > 0 && (
          <span className="checkout-page__parcel-line">
            Packaging: ₹{formatAmount(item.parcelCharge)} × {item.quantity} = ₹
            {formatAmount(itemParcel)}
          </span>
        )}
        {!takeaway && (
          <span className="checkout-page__dinein-only">Served at the restaurant</span>
        )}
      </div>
      <div className="checkout-page__item-prices">
        <span className="checkout-page__item-total">₹{formatAmount(item.lineFoodTotal)}</span>
        {itemParcel > 0 && (
          <span className="checkout-page__item-parcel-total">
            + ₹{formatAmount(itemParcel)} pack
          </span>
        )}
      </div>
    </li>
  );
};

export default CheckoutItemRow;
