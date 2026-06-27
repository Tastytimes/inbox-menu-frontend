import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getOrder, syncOrderPayment } from "../api/orderApi";
import { setStoredCartId } from "../utils/cartStorage";
import { clearStoredCustomer } from "../utils/customerStorage";
import { canRetryPayment } from "../utils/paymentFlow";
import {
  clearPendingOrderId,
  getPendingOrderContext,
  getPendingOrderId,
} from "../utils/orderStorage";
import OrderDetailsCard from "./restaurant/OrderDetailsCard";
import FulfillmentStatusBadge from "./restaurant/FulfillmentStatusBadge";
import OrderUpdateBanner from "./restaurant/OrderUpdateBanner";
import PaymentFailureReason from "./restaurant/PaymentFailureReason";
import RetryPaymentButton from "./restaurant/RetryPaymentButton";
import OrderNotificationPrompt from "./restaurant/OrderNotificationPrompt";
import { useFulfillmentPolling } from "../hooks/useFulfillmentPolling";
import { useOrderNotifications } from "../hooks/useOrderNotifications";
import { getPaymentFailureMessage } from "../utils/paymentFailureMessage";
import { isTerminalFulfillment } from "../utils/fulfillmentStatus";
import { routes } from "../utils/routes";
import "./restaurant/RestaurantMenu.css";

const POLL_MS = 3000;
const MAX_POLLS = 40;

const STATUS_CONFIG = {
  paid: {
    title: "Payment successful",
    message: null,
    className: "payment-status--success",
    icon: "✓",
  },
  pending: {
    title: "Payment pending",
    message: "We are waiting for confirmation from Cashfree. This may take a moment.",
    className: "payment-status--pending",
    icon: "…",
  },
  in_progress: {
    title: "Payment in progress",
    message: "Your payment is being processed. You can retry if it does not complete.",
    className: "payment-status--pending",
    icon: "…",
  },
  failed: {
    title: "Payment failed",
    message: "The payment did not go through. Retry payment to complete your order.",
    className: "payment-status--failed",
    icon: "✕",
  },
  expired: {
    title: "Payment expired",
    message: "This payment session has expired. Retry payment to continue with the same order.",
    className: "payment-status--failed",
    icon: "⏱",
  },
};

const formatAmount = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return "0";
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
};

const clearOrderSession = (slug) => {
  if (slug) {
    setStoredCartId(slug, null);
    clearPendingOrderId(slug);
    clearStoredCustomer(slug);
  }
};

const PaymentStatusPage = () => {
  const { slug: slugParam } = useParams();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [resolvedSlug, setResolvedSlug] = useState(slugParam || null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [updateBanner, setUpdateBanner] = useState("");
  const pollCount = useRef(0);

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

  const pendingContext = getPendingOrderContext();
  const slug = slugParam || pendingContext.slug || order?.slug || null;

  const orderId =
    pendingContext.orderId ||
    (slug ? getPendingOrderId(slug) : null) ||
    searchParams.get("orderId") ||
    searchParams.get("order_id");

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setError("Order not found");
      return null;
    }
    const data = await getOrder(orderId);
    setOrder(data);
    if (data.slug) {
      setResolvedSlug(data.slug);
    }
    return data;
  }, [orderId]);

  const handleSync = useCallback(async () => {
    if (!orderId) return;
    setSyncing(true);
    try {
      const data = await syncOrderPayment(orderId);
      setOrder(data);
      if (data.paymentStatus === "paid") {
        clearOrderSession(data.slug || slug);
      }
    } catch {
      setError("Could not sync payment status");
    } finally {
      setSyncing(false);
    }
  }, [orderId, slug]);

  const handleRetrySuccess = useCallback(
    (updatedOrder) => {
      setOrder(updatedOrder);
      clearOrderSession(updatedOrder.slug || slug);
      setToast("");
    },
    [slug]
  );

  const shouldPollFulfillment =
    order?.paymentStatus === "paid" &&
    order?.orderId &&
    !isTerminalFulfillment(order.fulfillmentStatus);

  useFulfillmentPolling({
    orderIds: shouldPollFulfillment ? [order.orderId] : [],
    orders: order ? [order] : [],
    enabled: Boolean(shouldPollFulfillment),
    onOrderUpdate: (data) => setOrder((prev) => (prev ? { ...prev, ...data } : data)),
    onNotify: (payload) => {
      handleOrderNotify(payload);
      setUpdateBanner(payload.message);
    },
  });

  useEffect(() => {
    let cancelled = false;
    let timer;

    const init = async () => {
      if (!orderId) {
        setError("No order to track. Start from checkout.");
        setLoading(false);
        return;
      }

      try {
        await syncOrderPayment(orderId);
        if (!cancelled) {
          const data = await fetchOrder();
          if (data?.paymentStatus === "paid") {
            clearOrderSession(data.slug || slug);
          }
        }
      } catch {
        if (!cancelled) {
          setError("Could not load order status");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    init();

    timer = setInterval(async () => {
      if (cancelled || pollCount.current >= MAX_POLLS) return;
      pollCount.current += 1;
      try {
        const data = await fetchOrder();
        if (data?.paymentStatus === "paid") {
          clearOrderSession(data.slug || slug);
          clearInterval(timer);
        }
        if (data?.paymentStatus === "failed" || data?.paymentStatus === "expired") {
          clearInterval(timer);
        }
      } catch {
        /* keep polling */
      }
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [orderId, slug, fetchOrder]);

  const menuSlug = resolvedSlug || slug;

  if (loading) {
    return (
      <div className="payment-status-page d-flex align-items-center justify-content-center">
        <p className="text-muted">Checking payment status…</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="payment-status-page payment-status-page--empty">
        <p>{error}</p>
        {menuSlug ? (
          <Link to={routes.checkout(menuSlug)} className="checkout-page__back">
            Back to checkout
          </Link>
        ) : (
          <Link to={routes.home} className="checkout-page__back">
            Go home
          </Link>
        )}
      </div>
    );
  }

  const status = order?.paymentStatus || "pending";
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const displayOrderNo = order?.orderNo || order?.orderReference;
  const showRetry = order && canRetryPayment(status);
  const failureMessage = getPaymentFailureMessage(order);
  const showNotificationPrompt = Boolean(
    shouldPollFulfillment && showNotificationBanner
  );

  return (
    <div className="payment-status-page">
      <OrderUpdateBanner
        message={updateBanner}
        onDismiss={() => setUpdateBanner("")}
      />

      <OrderNotificationPrompt
        show={showNotificationPrompt}
        enabling={enabling}
        notificationPermission={notificationPermission}
        enableMessage={enableMessage}
        onEnable={enableNotifications}
        onDismiss={dismissPrompt}
      />

      <div className={`payment-status ${config.className}`}>
        <span className="payment-status__icon" aria-hidden>
          {config.icon}
        </span>
        <h1>{config.title}</h1>
        {status === "paid" && displayOrderNo ? (
          <div className="payment-status__order-msg">
            <p className="payment-status__order-text">
              Your order no is{" "}
              <strong className="payment-status__order-no">{displayOrderNo}</strong>
              {" "}and collect your food at the respective counter.
            </p>
            {order.fulfillmentStatus && (
              <p className="payment-status__fulfillment-hint">
                Order status:{" "}
                <FulfillmentStatusBadge status={order.fulfillmentStatus} />
                {order.fulfillmentStatus === "ready"
                  ? " — collect at the counter now."
                  : notificationsEnabled
                    ? " — we'll notify you when it updates."
                    : " — we'll update you here when it changes."}
              </p>
            )}
          </div>
        ) : (
          <>
            {failureMessage ? (
              <PaymentFailureReason order={order} className="payment-status__failure-reason" />
            ) : (
              config.message && <p>{config.message}</p>
            )}
            {failureMessage && config.message && (
              <p className="payment-status__hint">{config.message}</p>
            )}
          </>
        )}
      </div>

      {order && (
        <div className="payment-status__details">
          <div className="payment-status__row">
            <span>Payment status</span>
            <strong className={`payment-status__badge payment-status__badge--${status}`}>
              {status}
            </strong>
          </div>
          <div className="payment-status__row">
            <span>Amount</span>
            <strong>₹{formatAmount(order.pricing?.customerPayAmount)}</strong>
          </div>
          {status === "paid" && order.fulfillmentStatus && (
            <div className="payment-status__row">
              <span>Order status</span>
              <FulfillmentStatusBadge status={order.fulfillmentStatus} />
            </div>
          )}
          {order.orderReference && (
            <div className="payment-status__row">
              <span>Order ref</span>
              <strong>{order.orderReference}</strong>
            </div>
          )}
          {failureMessage && (
            <div className="payment-status__row payment-status__row--failure">
              <span>Failure reason</span>
              <strong>{failureMessage}</strong>
            </div>
          )}
        </div>
      )}

      {showRetry && (
        <RetryPaymentButton
          order={order}
          onSuccess={handleRetrySuccess}
          onError={setToast}
        />
      )}

      {order && status === "paid" && <OrderDetailsCard order={order} />}

      {status === "pending" && (
        <button
          type="button"
          className="payment-status__sync-btn"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? "Syncing…" : "Refresh payment status"}
        </button>
      )}

      {toast && <p className="contact-details__error">{toast}</p>}

      <div className="payment-status__actions">
        {menuSlug && (
          <>
            <Link to={routes.trackOrders} className="payment-status__link">
              Track all my orders
            </Link>
            <Link to={routes.restaurant(menuSlug)} className="payment-status__link">
              Back to menu
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentStatusPage;
