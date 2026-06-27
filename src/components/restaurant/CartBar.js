import React from "react";

const CartBar = ({ cart, visible }) => {
  if (!visible || !cart?.items?.length) return null;

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="cart-bar">
      <div className="cart-bar__inner">
        <span className="cart-bar__count">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
        <span className="cart-bar__total">
          ₹{cart.summary?.grandTotal ?? cart.summary?.subtotal ?? 0}
        </span>
      </div>
      <p className="cart-bar__hint">
        {cart.isParcel ? "Takeaway" : "Dine in"} · Cart saved for this visit
      </p>
    </div>
  );
};

export default CartBar;
