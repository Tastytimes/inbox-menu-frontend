import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { checkoutOrder } from "../api/orderApi";
import { getCart } from "../api/restaurantApi";
import { getStoredCartId, setStoredCartId } from "../utils/cartStorage";
import {
  getStoredCustomer,
  hasValidStoredCustomer,
} from "../utils/customerStorage";
import { launchPayment, getPaymentProviderLabel } from "../utils/paymentFlow";
import { unlockOrderUpdateSoundSync } from "../utils/orderNotificationSound";
import { routes } from "../utils/routes";
import OrderItemGroup from "./restaurant/OrderItemGroup";
import { groupOrderItems } from "../utils/orderItemGroups";
import CheckoutSummary from "./restaurant/CheckoutSummary";
import CustomerSummary from "./restaurant/CustomerSummary";
import OrderMixSummary from "./restaurant/OrderMixSummary";
import "./restaurant/RestaurantMenu.css";

const PAYMENT_PROVIDER = process.env.REACT_APP_PAYMENT_PROVIDER || "payu";
const PAYMENT_PROVIDER_LABEL = getPaymentProviderLabel(PAYMENT_PROVIDER);

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
      return null;
    }
    const cartData = await getCart(cartId, slug);
    setCart(cartData);
    setStoredCartId(slug, cartData.cartId);
    return cartData;
  }, [slug]);

  const clearStaleCart = useCallback(() => {
    setStoredCartId(slug, null);
    setCart(null);
    setCheckoutPricing(null);
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
    if (!customer) {
      showToast("Cart is empty", true);
      return;
    }

    setPaying(true);
    try {
      unlockOrderUpdateSoundSync();

      let freshCart;
      try {
        freshCart = await loadCart();
      } catch (err) {
        clearStaleCart();
        const message =
          err.response?.data?.message ||
          "Your cart expired. Go back to the menu and add items again.";
        setError(message);
        showToast(message, true);
        return;
      }

      if (!freshCart?.items?.length) {
        showToast("Cart is empty", true);
        return;
      }

      const checkout = await checkoutOrder({
        slug,
        cartId: freshCart.cartId,
        customerPhone: customer.customerPhone,
        customerName: customer.customerName,
        customerEmail: customer.customerEmail,
      });

      setCheckoutPricing(checkout.pricing);

      const result = await launchPayment({
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
      if (
        err.response?.status === 404 ||
        err.response?.status === 409 ||
        /cart not found|already placed|expired/i.test(message)
      ) {
        clearStaleCart();
        setError(message);
      }
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
          Secured by <strong>{PAYMENT_PROVIDER_LABEL}</strong>
        </p>
        <button
          type="button"
          className="checkout-page__place-btn"
          onClick={handlePay}
          disabled={paying}
        >
          {paying
            ? `Redirecting to ${PAYMENT_PROVIDER_LABEL}…`
            : `Pay ₹${payAmount} with ${PAYMENT_PROVIDER_LABEL}`}
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
