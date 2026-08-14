import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { trackOrderByToken } from "../api/orderApi";
import { useOrderTrackingSocket } from "../hooks/useOrderTrackingSocket";
import WhatsAppChatButton from "./support/WhatsAppChatButton";
import { getFulfillmentLabel } from "../utils/fulfillmentStatus";
import { routes } from "../utils/routes";
import OrderUpdateBanner from "./restaurant/OrderUpdateBanner";
import CounterStatusPanel from "./restaurant/CounterStatusPanel";
import OrderItemGroup from "./restaurant/OrderItemGroup";
import OrderTrackingProgress from "./order-tracking/OrderTrackingProgress";
import { groupOrderItems, resolveCounterStatuses } from "../utils/orderItemGroups";
import "./restaurant/RestaurantMenu.css";
import "./order-tracking/OrderTracking.css";

const STATUS_HERO = {
  placed: {
    icon: "📋",
    title: "Order placed",
    subtitle: "Waiting for the kitchen to accept your order",
  },
  accepted: {
    icon: "✓",
    title: "Order accepted",
    subtitle: "The kitchen has received your order",
  },
  preparing: {
    icon: "👨‍🍳",
    title: "Being prepared",
    subtitle: "Your food is being made fresh",
  },
  ready: {
    icon: "🎉",
    title: "Ready for pickup!",
    subtitle: "Head to the counter and collect your order",
  },
  delivered: {
    icon: "✅",
    title: "Enjoy your meal!",
    subtitle: "Your order has been served",
  },
  cancelled: {
    icon: "✕",
    title: "Order cancelled",
    subtitle: "This order was cancelled",
  },
  declined: {
    icon: "!",
    title: "Order declined",
    subtitle: "The kitchen could not accept this order",
  },
};

const getErrorMessage = (err) => {
  const message = err?.response?.data?.message;
  if (Array.isArray(message)) return message.join(" ");
  if (typeof message === "string" && message.trim()) return message;
  return "Unable to load this order. The link may be invalid or expired.";
};

const OrderTrackingPage = () => {
  const { token } = useParams();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updateBanner, setUpdateBanner] = useState("");

  const loadTracking = useCallback(async () => {
    if (!token) {
      setError("Invalid tracking link.");
      setLoading(false);
      return;
    }

    try {
      const data = await trackOrderByToken(token);
      setTracking(data);
      setError("");
    } catch (err) {
      setTracking(null);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    loadTracking();
  }, [loadTracking]);

  const handleTrackingUpdate = useCallback((next) => {
    setTracking((current) => {
      if (current && current.fulfillmentStatus !== next.fulfillmentStatus) {
        setUpdateBanner(next.statusLabel || "Order status updated");
      }
      return next;
    });
  }, []);

  const { connected } = useOrderTrackingSocket(token, handleTrackingUpdate);

  const fulfillmentStatus = String(tracking?.fulfillmentStatus || "placed").toLowerCase();
  const hero = useMemo(() => {
    const base = STATUS_HERO[fulfillmentStatus] || STATUS_HERO.placed;
    if (tracking?.statusLabel && tracking.statusLabel !== tracking.fulfillmentStatus) {
      return { ...base, subtitle: tracking.statusLabel };
    }
    return base;
  }, [fulfillmentStatus, tracking?.statusLabel, tracking?.fulfillmentStatus]);

  const groupedItems = useMemo(
    () => groupOrderItems(tracking?.items ?? []),
    [tracking?.items]
  );
  const counterStatuses = useMemo(
    () => resolveCounterStatuses(tracking?.counterTickets ?? []),
    [tracking?.counterTickets]
  );
  const hasCounterTickets = (tracking?.counterTickets ?? []).length > 0;
  const isMixedOrder =
    (tracking?.items ?? []).some((item) => item.isParcel) &&
    (tracking?.items ?? []).some((item) => !item.isParcel);

  if (loading) {
    return (
      <div className="order-track-page">
        <div className="order-track-loading" aria-busy="true" aria-label="Loading order">
          <div className="order-track-loading__pulse order-track-loading__pulse--lg" />
          <div className="order-track-loading__pulse" />
          <div className="order-track-loading__pulse" />
          <div className="order-track-loading__pulse order-track-loading__pulse--md" />
        </div>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="order-track-page">
        <div className="order-track-error">
          <div className="order-track-error__icon" aria-hidden>
            🔍
          </div>
          <h1>Order not found</h1>
          <p>{error || "This tracking link is not valid."}</p>
          <Link to={routes.home} className="order-track-error__btn">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-track-page">
      <div className="order-track-page__inner">
        <div className="order-track-page__topbar">
          <Link to={routes.home} className="order-track-page__back">
            ← Home
          </Link>
          <span
            className={`order-track-live ${connected ? "order-track-live--on" : ""}`}
            role="status"
          >
            <span className="order-track-live__dot" aria-hidden />
            {connected ? "Live" : "Reconnecting"}
          </span>
        </div>

        {updateBanner ? (
          <OrderUpdateBanner message={updateBanner} onDismiss={() => setUpdateBanner("")} />
        ) : null}

        <header className="order-track-hero">
          {tracking.restaurantName ? (
            <p className="order-track-hero__restaurant">{tracking.restaurantName}</p>
          ) : null}
          <h1 className="order-track-hero__title">Track your order</h1>
          <p className="order-track-hero__subtitle">
            {getFulfillmentLabel(fulfillmentStatus)}
          </p>
          {tracking.orderNo ? (
            <div className="order-track-token">
              <span className="order-track-token__label">Order token</span>
              <span className="order-track-token__value">#{tracking.orderNo}</span>
            </div>
          ) : null}
        </header>

        <section
          className={`order-track-status-card order-track-status-card--${fulfillmentStatus}`}
          aria-label="Current order status"
        >
          <div className="order-track-status-card__head">
            <span className="order-track-status-card__icon" aria-hidden>
              {hero.icon}
            </span>
            <div className="order-track-status-card__head-text">
              <h2>{hero.title}</h2>
              <p>{hero.subtitle}</p>
            </div>
          </div>

          <OrderTrackingProgress status={fulfillmentStatus} />

          {(tracking.tableNo || isMixedOrder) && (
            <div className="order-track-meta">
              {tracking.tableNo ? (
                <span className="order-track-meta__chip">
                  Table <strong>{tracking.tableNo}</strong>
                </span>
              ) : null}
              {isMixedOrder ? (
                <span className="order-track-meta__chip">🍽️ + 🥡 Mixed order</span>
              ) : tracking.isParcel ? (
                <span className="order-track-meta__chip">🥡 Takeaway</span>
              ) : (
                <span className="order-track-meta__chip">🍽️ Dine-in</span>
              )}
            </div>
          )}
        </section>

        {hasCounterTickets && (
          <CounterStatusPanel
            counterTickets={tracking.counterTickets}
            title="Counter status"
          />
        )}

        {groupedItems.length > 0 ? (
          <section className="order-track-section" aria-label="Order items">
            <h2 className="order-track-section__title">Your items</h2>
            {isMixedOrder && (
              <p className="order-track-section__hint">
                Status per counter is shown for dine-in and takeaway separately.
              </p>
            )}
            <ul className="checkout-page__items checkout-page__items--grouped order-track-items--grouped">
              {groupedItems.map((group) => (
                <OrderItemGroup
                  key={group.key}
                  group={group}
                  counterStatuses={counterStatuses}
                  showCounterStatus={hasCounterTickets}
                  showPrices={false}
                />
              ))}
            </ul>
          </section>
        ) : null}

        <p className="order-track-footnote">
          Status updates automatically as the kitchen progresses your order.
        </p>

        <WhatsAppChatButton
          className="order-track-whatsapp-btn"
          label="Need help? Chat with us"
          prefillMessage={
            tracking?.orderNo
              ? `Hi, I need help with order ${tracking.orderNo}.`
              : "Hi, I need help with my order."
          }
        />
      </div>
    </div>
  );
};

export default OrderTrackingPage;
