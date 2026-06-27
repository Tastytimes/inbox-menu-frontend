import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { lookupOrdersByPhone } from "../api/orderApi";
import { unlockOrderUpdateSound } from "../utils/orderNotificationSound";
import { useFulfillmentPolling } from "../hooks/useFulfillmentPolling";
import { useOrderNotifications } from "../hooks/useOrderNotifications";
import {
  getLastCustomerPhone,
  getLastRestaurantSlug,
  isValidPhone,
  setLastCustomerPhone,
} from "../utils/customerStorage";
import { getPollableOrders, formatOrderLabel } from "../utils/fulfillmentStatus";
import { routes } from "../utils/routes";
import OrderHistoryCard from "./restaurant/OrderHistoryCard";
import OrderNotificationPrompt from "./restaurant/OrderNotificationPrompt";
import OrderUpdateBanner from "./restaurant/OrderUpdateBanner";
import "./restaurant/RestaurantMenu.css";

const OrderLookupPage = () => {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [updateBanner, setUpdateBanner] = useState("");

  const {
    notificationPermission,
    enabling,
    enableMessage,
    enableNotifications,
    dismissPrompt,
    handleOrderNotify,
    notificationsEnabled,
    showNotificationBanner,
  } = useOrderNotifications();

  const lastSlug = getLastRestaurantSlug();
  const backLink = lastSlug ? routes.restaurant(lastSlug) : routes.home;

  const pollableOrders = useMemo(() => getPollableOrders(orders), [orders]);
  const pollableOrderIds = useMemo(
    () => pollableOrders.map((order) => order.orderId),
    [pollableOrders]
  );
  const pollableOrderLabels = useMemo(
    () => pollableOrders.map((order) => formatOrderLabel(order)).join(", "),
    [pollableOrders]
  );

  useEffect(() => {
    const savedPhone = getLastCustomerPhone();
    if (savedPhone) {
      setPhone(savedPhone);
    }
  }, []);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!isValidPhone(phone)) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(false);
    await unlockOrderUpdateSound();

    try {
      const data = await lookupOrdersByPhone(phone);
      setOrders(data.orders ?? []);
      setCount(data.count ?? 0);
      setSearched(true);
      setLastCustomerPhone(phone);
    } catch (err) {
      const message =
        err.response?.data?.message || "Could not fetch orders. Please try again.";
      setError(message);
      setOrders([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderUpdate = useCallback((updated) => {
    if (!updated?.orderId) return;

    setOrders((prev) => {
      const index = prev.findIndex((order) => order.orderId === updated.orderId);
      if (index === -1) return prev;

      const current = prev[index];
      const nextOrder = { ...current, ...updated };

      if (
        current.fulfillmentStatus === nextOrder.fulfillmentStatus &&
        current.updatedAt === nextOrder.updatedAt
      ) {
        return prev;
      }

      const next = [...prev];
      next[index] = nextOrder;
      return next;
    });
  }, []);

  const handleFulfillmentNotify = useCallback(
    (payload) => {
      handleOrderNotify(payload);
      setUpdateBanner(payload.message);
    },
    [handleOrderNotify]
  );

  useFulfillmentPolling({
    orderIds: pollableOrderIds,
    orders,
    enabled: searched && !loading && pollableOrderIds.length > 0,
    onOrderUpdate: handleOrderUpdate,
    onNotify: handleFulfillmentNotify,
  });

  return (
    <div className="order-lookup-page">
      <OrderUpdateBanner
        message={updateBanner}
        onDismiss={() => setUpdateBanner("")}
      />

      <header className="checkout-page__header">
        <Link to={backLink} className="checkout-page__back">
          ← Back to menu
        </Link>
        <h1>Track your orders</h1>
        <p className="contact-details__subtitle">
          Enter your mobile number to view all orders placed with this number.
        </p>
      </header>

      <OrderNotificationPrompt
        show={searched && pollableOrderIds.length > 0 && showNotificationBanner}
        enabling={enabling}
        notificationPermission={notificationPermission}
        enableMessage={enableMessage}
        onEnable={enableNotifications}
        onDismiss={dismissPrompt}
      />

      <form className="order-lookup-form" onSubmit={handleSearch}>
        <label className="checkout-customer__field">
          <span>
            Mobile number <span className="checkout-customer__required">*</span>
          </span>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, ""));
              setError("");
            }}
            disabled={loading}
          />
        </label>
        <button
          type="submit"
          className="checkout-page__place-btn"
          disabled={loading || !isValidPhone(phone)}
        >
          {loading ? "Searching…" : "Find my orders"}
        </button>
      </form>

      {error && <p className="contact-details__error">{error}</p>}

      {searched && !loading && (
        <section className="order-lookup-results">
          <p className="order-lookup-results__count">
            {count === 0
              ? "No orders found for this number."
              : `${count} order${count !== 1 ? "s" : ""} found`}
          </p>
          {pollableOrderIds.length > 0 && (
            <p className="order-lookup-results__hint">
              Live updates for {pollableOrderLabels} every 5 seconds
              {notificationsEnabled ? " · notifications on" : ""}.
            </p>
          )}
          <div className="order-lookup-results__list">
            {orders.map((order) => (
              <OrderHistoryCard
                key={order.orderId}
                order={order}
                onOrderUpdate={handleOrderUpdate}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default OrderLookupPage;
