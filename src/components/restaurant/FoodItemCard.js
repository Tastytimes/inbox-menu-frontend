import React from "react";

const FoodItemCard = ({
  item,
  quantity = 0,
  onAddToCart,
  onIncrement,
  onDecrement,
  updating,
}) => {
  const isVeg = item.foodType?.toLowerCase() === "veg";
  const inCart = quantity > 0;

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
          title={isVeg ? "Vegetarian" : "Non-vegetarian"}
        />
      </div>

      <div className="food-card__body">
        <div className="food-card__top">
          <h3 className="food-card__name">{item.name}</h3>
          {item.isBestSeller && (
            <span className="food-card__badge">Bestseller</span>
          )}
        </div>
        {item.description && (
          <p className="food-card__desc">{item.description}</p>
        )}
        <div className="food-card__footer">
          <span className="food-card__price">₹{item.price}</span>
          {inCart ? (
            <div className="qty-stepper" aria-label={`Quantity for ${item.name}`}>
              <button
                type="button"
                className="qty-stepper__btn"
                disabled={updating}
                onClick={() => onDecrement(item)}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="qty-stepper__value">{quantity}</span>
              <button
                type="button"
                className="qty-stepper__btn"
                disabled={updating}
                onClick={() => onIncrement(item)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="food-card__add-btn"
              disabled={updating}
              onClick={() => onAddToCart(item)}
            >
              {updating ? "Adding…" : "Add"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default FoodItemCard;
