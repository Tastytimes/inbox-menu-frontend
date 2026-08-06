import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { checkoutOrder } from "../api/orderApi";
import { getCart } from "../api/restaurantApi";
import { getStoredCartId, setStoredCartId } from "../utils/cartStorage";
import {
  getStoredCustomer,
  hasValidStoredCustomer,
} from "../utils/customerStorage";
import { launchCashfreePayment } from "../utils/paymentFlow";
import { routes } from "../utils/routes";
import OrderItemGroup from "./restaurant/OrderItemGroup";
import { groupOrderItems } from "../utils/orderItemGroups";
import CheckoutSummary from "./restaurant/CheckoutSummary";
import CustomerSummary from "./restaurant/CustomerSummary";
import OrderMixSummary from "./restaurant/OrderMixSummary";
import "./restaurant/RestaurantMenu.css";

const CheckoutPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [checkoutPricing, setCheckoutPricing] = useState(null);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3200);
  };

  const loadCart = useCallback(async () => {
    const cartId = getStoredCartId(slug);
    if (!cartId) {
      setError("Your cart is empty");
      setCart(null);
      return;
    }
    const cartData = await getCart(cartId, slug);
    setCart(cartData);
    setStoredCartId(slug, cartData.cartId);
  }, [slug]);

  useEffect(() => {
    if (!hasValidStoredCustomer(slug)) {
      navigate(routes.checkoutContact(slug), { replace: true });
      return;
    }

    setCustomer(getStoredCustomer(slug));

    loadCart()
      .catch(() => setError("Could not load cart"))
      .finally(() => setLoading(false));
  }, [slug, loadCart, navigate]);

  const handlePay = async () => {
    const cartId = getStoredCartId(slug);
    if (!cartId || !cart || !customer) {
      showToast("Cart is empty", true);
      return;
    }

    setPaying(true);
    try {
      const checkout = await checkoutOrder({
        slug,
        cartId,
        customerPhone: customer.customerPhone,
        customerName: customer.customerName,
        customerEmail: customer.customerEmail,
      });

      setCheckoutPricing(checkout.pricing);

      const result = await launchCashfreePayment({
        ...checkout,
        slug,
      });

      if (result.paid) {
        window.location.href = routes.paymentStatus;
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Checkout failed. Please try again.";
      showToast(message, true);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="checkout-page d-flex align-items-center justify-content-center">
        <p className="text-muted">Loading checkout…</p>
      </div>
    );
  }

  if (error || !cart?.items?.length) {
    return (
      <div className="checkout-page checkout-page--empty">
        <p>{error || "Your cart is empty"}</p>
        <Link to={routes.restaurant(slug)} className="checkout-page__back">
          ← Back to menu
        </Link>
      </div>
    );
  }

  const pricing = checkoutPricing ?? cart?.pricing ?? null;
  const payAmount =
    pricing?.customerPayAmount ?? cart.summary?.grandTotal ?? 0;

  return (
    <div className="checkout-page">
      <header className="checkout-page__header">
        <Link to={routes.restaurant(slug)} className="checkout-page__back">
          ← Back to menu
        </Link>
        <h1>Checkout</h1>
      </header>

      {customer && <CustomerSummary customer={customer} slug={slug} />}

      <OrderMixSummary
        items={cart.items}
        tableNo={cart.tableNo}
        businessType={cart.businessType}
      />

      <section className="checkout-page__section">
        <h2 className="checkout-page__section-title">Your items</h2>
        <ul className="checkout-page__items checkout-page__items--grouped">
          {groupOrderItems(cart.items).map((group) => (
            <OrderItemGroup key={group.key} group={group} showCounterStatus={false} />
          ))}
        </ul>
      </section>

      <CheckoutSummary
        summary={cart.summary}
        items={cart.items}
        pricing={pricing}
      />

      <div className="checkout-pay">
        <p className="checkout-pay__secure">
          Secured by <strong>Cashfree Payments</strong>
        </p>
        <button
          type="button"
          className="checkout-page__place-btn"
          onClick={handlePay}
          disabled={paying}
        >
          {paying ? "Redirecting to Cashfree…" : `Pay ₹${payAmount} with Cashfree`}
        </button>
      </div>

      {toast && (
        <div
          className={`toast-message ${toast.isError ? "toast-message--error" : ""}`}
          role="status"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
