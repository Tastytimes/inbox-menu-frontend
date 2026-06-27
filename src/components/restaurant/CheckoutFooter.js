import React from "react";
import { useNavigate } from "react-router-dom";
import { routes } from "../../utils/routes";

const CheckoutFooter = ({ cart, slug, visible }) => {
  const navigate = useNavigate();

  if (!visible || !cart?.items?.length) return null;

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.summary?.grandTotal ?? cart.summary?.subtotal ?? 0;

  return (
    <footer className="checkout-footer">
      <div className="checkout-footer__inner">
        <div className="checkout-footer__summary">
          <span className="checkout-footer__count">
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </span>
          <span className="checkout-footer__total">₹{total}</span>
        </div>
        <button
          type="button"
          className="checkout-footer__btn"
          onClick={() => navigate(routes.checkoutContact(slug))}
        >
          Proceed to checkout
        </button>
      </div>
    </footer>
  );
};

export default CheckoutFooter;
