import React from "react";

const formatParcelCharge = (parcelCharge) => {
  const charge = Number(parcelCharge);
  if (!charge || Number.isNaN(charge)) return null;
  return `+₹${Number.isInteger(charge) ? charge : charge.toFixed(0)} packaging`;
};

const OrderTypeStepper = ({
  type,
  label,
  sublabel,
  quantity,
  onIncrement,
  onDecrement,
  updating,
}) => {
  const isParcel = type === "parcel";

  return (
    <div
      className={`food-type-stepper food-type-stepper--${type}`}
      aria-label={`${label} quantity controls`}
    >
      <div className="food-type-stepper__info">
        <span className="food-type-stepper__icon" aria-hidden>
          {isParcel ? "🥡" : "🍽️"}
        </span>
        <div className="food-type-stepper__text">
          <span className="food-type-stepper__label">{label}</span>
          {sublabel && (
            <span className="food-type-stepper__sublabel">{sublabel}</span>
          )}
        </div>
      </div>

      <div className="food-type-stepper__controls">
        <button
          type="button"
          className="food-type-stepper__btn food-type-stepper__btn--minus"
          disabled={updating || quantity <= 0}
          onClick={onDecrement}
          aria-label={`Remove one ${label.toLowerCase()} item`}
        >
          −
        </button>
        <span
          className="food-type-stepper__qty"
          aria-live="polite"
          aria-label={`${label} quantity`}
        >
          {quantity}
        </span>
        <button
          type="button"
          className="food-type-stepper__btn food-type-stepper__btn--plus"
          disabled={updating}
          onClick={onIncrement}
          aria-label={`Add one ${label.toLowerCase()} item`}
        >
          +
        </button>
      </div>
    </div>
  );
};

const FoodItemCard = ({
  item,
  categoryName,
  dineInQty = 0,
  parcelQty = 0,
  onAddDineIn,
  onAddParcel,
  onRemoveDineIn,
  onRemoveParcel,
  updatingDineIn,
  updatingParcel,
}) => {
  const isVeg = item.foodType?.toLowerCase() === "veg";
  const foodTypeLabel = isVeg ? "Veg" : "Non-veg";
  const metaParts = [categoryName, foodTypeLabel].filter(Boolean);
  const parcelSublabel = formatParcelCharge(item.parcelCharge);
  const inCart = dineInQty > 0 || parcelQty > 0;

  return (
    <article className="food-card">
      <div className="food-card__media">
        {item.foodImage ? (
          <img src={item.foodImage} alt={item.name} loading="lazy" />
        ) : (
          <div className="food-card__placeholder" aria-hidden>
            🍴
          </div>
        )}
        <span
          className={`food-card__type ${isVeg ? "food-card__type--veg" : "food-card__type--nonveg"}`}
          title={foodTypeLabel}
        />
      </div>

      <div className="food-card__body">
        <div className="food-card__header-row">
          <h3 className="food-card__name">{item.name}</h3>
          <span className="food-card__price">₹{item.price}</span>
        </div>

        {item.isBestSeller && (
          <span className="food-card__badge food-card__badge--inline">Bestseller</span>
        )}

        {metaParts.length > 0 && (
          <p className="food-card__meta">{metaParts.join(" · ")}</p>
        )}

        {item.description && (
          <p className="food-card__desc">{item.description}</p>
        )}

        <div className="food-card__order-types">
          {inCart && (
            <p className="food-card__order-types-heading">Choose quantity by type</p>
          )}

          <OrderTypeStepper
            type="dinein"
            label="Dine-in"
            sublabel="Served at your table"
            quantity={dineInQty}
            onIncrement={() => onAddDineIn(item)}
            onDecrement={() => onRemoveDineIn(item)}
            updating={updatingDineIn}
          />

          <OrderTypeStepper
            type="parcel"
            label="Takeaway"
            sublabel={parcelSublabel || "Pack to go"}
            quantity={parcelQty}
            onIncrement={() => onAddParcel(item)}
            onDecrement={() => onRemoveParcel(item)}
            updating={updatingParcel}
          />
        </div>
      </div>
    </article>
  );
};

export default FoodItemCard;
