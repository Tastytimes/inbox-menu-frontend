import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  getFineDineTableContext,
  placeFineDineOrder,
  requestFineDineBill,
  updateFineDineSessionItem,
} from "../api/restaurantApi";
import { formatInr } from "../constants/pricing";
import { routes } from "../utils/routes";
import {
  formatOrderTime,
  getBillCharges,
  getBillLines,
  getChargeLabel,
  getGuestLabel,
  getHeldCartItems,
  getOrderItems,
  getOrderLabel,
  getOrderStatus,
  getOrderStatusLabel,
  getOrderTime,
  getSessionItemFoodType,
  getSessionItemName,
  getSessionItemNote,
  getSessionItemQty,
  getSessionItemTotal,
  getSessionItemUnitPrice,
  getSessionOrders,
  isBillRequested,
  isCancelledOrder,
  isStaffOrder,
  sumItemQuantities,
} from "../utils/fineDineSession";
import "./restaurant/RestaurantMenu.css";

const PAY_OPTIONS = [
  { id: "cash", label: "Cash", hint: "Pay the captain at the table" },
  { id: "card", label: "Card", hint: "Captain will bring a card machine" },
];

const VegDot = ({ foodType }) => {
  const type = String(foodType || "").toLowerCase();
  if (!type) return null;
  const isVeg = type === "veg";
  return (
    <span
      className={`table-ticket__dot ${isVeg ? "table-ticket__dot--veg" : "table-ticket__dot--nonveg"}`}
      title={isVeg ? "Veg" : "Non-veg"}
    />
  );
};

const OrderItemRow = ({ item, showQtyControls, busy, onQty }) => (
  <div className="table-ticket__item">
    <div className="table-ticket__item-name">
      <VegDot foodType={getSessionItemFoodType(item)} />
      <div>
        <strong>{getSessionItemName(item)}</strong>
        {getSessionItemNote(item) ? (
          <span className="table-ticket__note">{getSessionItemNote(item)}</span>
        ) : null}
      </div>
    </div>
    {showQtyControls ? (
      <div className="table-cart-line__qty">
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => onQty(item, getSessionItemQty(item) - 1)}
          aria-label="Remove one"
        >
          −
        </button>
        <span>{getSessionItemQty(item)}</span>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => onQty(item, getSessionItemQty(item) + 1)}
          aria-label="Add one"
        >
          +
        </button>
      </div>
    ) : (
      <span className="table-ticket__qty">Qty: {getSessionItemQty(item)}</span>
    )}
  </div>
);

const FineDineCartPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const menuHref = `${routes.restaurant(slug)}${location.search}`;

  const [session, setSession] = useState(null);
  const [tableNo, setTableNo] = useState(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState(null);
  const [payMethod, setPayMethod] = useState("");
  const [screen, setScreen] = useState("orders");
  const [showPay, setShowPay] = useState(false);

  const showToast = useCallback((message, isError = false) => {
    setToast({ message, isError });
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const loadSession = useCallback(async () => {
    const requestedTable = new URLSearchParams(location.search).get("table");
    const context = await getFineDineTableContext(slug, requestedTable);
    setSession(context.session || null);
    setTableNo(context.tableNo || context.session?.tableNo || null);
    setRestaurantName(context.restaurantName || context.restaurant?.name || "");
    return context;
  }, [slug, location.search]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        await loadSession();
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Could not load your table cart.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [loadSession]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadSession().catch(() => {});
    }, 5000);
    return () => window.clearInterval(timer);
  }, [loadSession]);

  const cartItems = useMemo(() => getHeldCartItems(session), [session]);
  const orders = useMemo(() => getSessionOrders(session), [session]);
  const guestOrders = useMemo(() => orders.filter((order) => !isStaffOrder(order)), [orders]);
  const staffOrders = useMemo(() => orders.filter((order) => isStaffOrder(order)), [orders]);
  const billRequested = isBillRequested(session);
  const billLines = useMemo(() => getBillLines(session), [session]);
  const bill = useMemo(() => getBillCharges(session), [session]);
  const cartCount = sumItemQuantities(cartItems);
  const canPlace = cartItems.length > 0;
  const canCheckout = (cartItems.length > 0 || orders.length > 0) && !billRequested;

  const handleQty = async (item, nextQty) => {
    setBusy(`item-${item.id}`);
    try {
      const next = await updateFineDineSessionItem(slug, item.id, nextQty);
      setSession(next.session || next);
    } catch (err) {
      showToast(err.response?.data?.message || "Could not update item.", true);
    } finally {
      setBusy("");
    }
  };

  const handlePlaceOrder = async () => {
    setBusy("place");
    try {
      const next = await placeFineDineOrder(slug);
      setSession(next.session || next);
      showToast("Order placed. The kitchen will start preparing it.");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not place order.", true);
    } finally {
      setBusy("");
    }
  };

  const handleCheckout = async (method) => {
    if (method === "online") return;
    setPayMethod(method);
    setBusy("pay");
    try {
      const next = await requestFineDineBill(slug, { paymentMethod: method });
      setSession(next.session || next);
      setShowPay(false);
      showToast(
        method === "card"
          ? "Bill requested. The captain will collect card payment."
          : "Bill requested. Pay cash to the captain."
      );
    } catch (err) {
      showToast(err.response?.data?.message || "Could not start checkout.", true);
    } finally {
      setBusy("");
    }
  };

  if (loading) {
    return (
      <div className="checkout-page d-flex align-items-center justify-content-center">
        <p className="text-muted">Loading cart…</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="checkout-page checkout-page--empty">
        <p>{error || "No table session found. Scan the table QR and sit first."}</p>
        <Link to={menuHref} className="checkout-page__back">
          ← Back to menu
        </Link>
      </div>
    );
  }

  const renderOrderGroup = (title, group) => {
    if (!group.length) return null;
    return (
      <section className="table-ticket-group">
        <div className="table-ticket-group__head">
          <strong>{title}</strong>
        </div>
        {group.map((order, index) => {
          const status = getOrderStatus(order);
          const time = formatOrderTime(getOrderTime(order));
          return (
            <article
              key={order.id || order.orderId || `${title}-${index}`}
              className={`table-ticket table-ticket--${isCancelledOrder(order) ? "cancelled" : "ok"}`}
            >
              <header className={`table-ticket__banner table-ticket__banner--${status}`}>
                <strong>{getOrderLabel(order, index)}</strong>
                <span>
                  {getOrderStatusLabel(status)}
                  {time ? ` at ${time}` : ""}
                </span>
              </header>
              <div className="table-ticket__body">
                {getOrderItems(order).length ? (
                  getOrderItems(order).map((item, itemIndex) => (
                    <OrderItemRow
                      key={item.id || `${item.foodId}-${itemIndex}`}
                      item={item}
                    />
                  ))
                ) : (
                  <p className="table-cart-empty">Items sent to kitchen</p>
                )}
              </div>
            </article>
          );
        })}
      </section>
    );
  };

  return (
    <div
      className={`table-cart-page${
        canPlace && screen === "orders" ? " table-cart-page--has-place" : " table-cart-page--has-nav"
      }`}
    >
      <header className="table-cart-top">
        <Link to={menuHref} className="checkout-page__back">
          ← Menu
        </Link>
        <div>
          <p className="table-cart-top__eyebrow">{restaurantName || "Table"}</p>
          <h1>{screen === "bill" ? "Bill" : getGuestLabel(session)}</h1>
          <p className="table-cart-page__meta">
            {tableNo ? `Table ${tableNo}` : "Your current orders"}
          </p>
        </div>
      </header>

      {screen === "orders" ? (
        <>
          {cartItems.length ? (
            <article className="table-ticket table-ticket--cart">
              <header className="table-ticket__banner table-ticket__banner--cart">
                <strong>In cart</strong>
                <span>Not sent to kitchen yet</span>
              </header>
              <div className="table-ticket__body">
                {cartItems.map((item) => (
                  <OrderItemRow
                    key={item.id}
                    item={item}
                    showQtyControls
                    busy={busy}
                    onQty={(line, qty) => void handleQty(line, qty)}
                  />
                ))}
              </div>
            </article>
          ) : null}

          {renderOrderGroup("Your orders", guestOrders)}
          {renderOrderGroup("Restaurant staff", staffOrders)}
          {!orders.length && !cartItems.length ? (
            <p className="table-cart-empty">No orders yet. Add items from the menu.</p>
          ) : null}
        </>
      ) : (
        <>
          <section className="table-bill">
            <div className="table-bill__row table-bill__row--head">
              <span>Item</span>
              <span>Qty</span>
              <span>Rate</span>
              <span>Amount</span>
            </div>
            {billLines.length ? (
              billLines.map((item, index) => (
                <div key={item.id || `${item.foodId}-${index}`} className="table-bill__row">
                  <span>
                    {getSessionItemName(item)}
                    {getSessionItemNote(item) ? (
                      <small>{getSessionItemNote(item)}</small>
                    ) : null}
                  </span>
                  <span>{getSessionItemQty(item)}</span>
                  <span>{formatInr(getSessionItemUnitPrice(item))}</span>
                  <span>{formatInr(getSessionItemTotal(item))}</span>
                </div>
              ))
            ) : (
              <p className="table-cart-empty">No billed items yet.</p>
            )}
            {cartItems.length ? (
              <p className="table-bill__pending">
                {cartCount} item{cartCount === 1 ? "" : "s"} still in cart — place the order to add
                them to this bill.
              </p>
            ) : null}

            <div className="table-bill__totals">
              <div>
                <span>Gross amount</span>
                <strong>{formatInr(bill.foodSubtotal)}</strong>
              </div>
              {bill.extraCharges.map((charge, index) => (
                <div key={charge.id || charge.name || index} className="table-bill__muted">
                  <span>{getChargeLabel(charge)}</span>
                  <span>{formatInr(charge.amount)}</span>
                </div>
              ))}
              {bill.taxTotal > 0 ? (
                <div className="table-bill__muted">
                  <span>Tax total</span>
                  <span>{formatInr(bill.taxTotal)}</span>
                </div>
              ) : null}
              <div className="table-bill__pay">
                <span>Net amount to pay</span>
                <strong>{formatInr(bill.grandTotal)}</strong>
              </div>
            </div>
          </section>

          {showPay ? (
            <section className="table-cart-pay-wrap">
              {billRequested ? (
                <p className="table-cart-pay-note">
                  Bill requested
                  {payMethod ? ` · ${payMethod === "card" ? "Card" : "Cash"}` : ""}. The captain
                  will collect payment at the table.
                </p>
              ) : (
                <div className="table-cart-pay">
                  {PAY_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`table-cart-pay__btn${
                        payMethod === option.id ? " table-cart-pay__btn--active" : ""
                      }`}
                      disabled={busy === "pay"}
                      onClick={() => void handleCheckout(option.id)}
                    >
                      <strong>{option.label}</strong>
                      <span>{option.hint}</span>
                    </button>
                  ))}
                  <button type="button" className="table-cart-pay__btn table-cart-pay__btn--soon" disabled>
                    <strong>Online</strong>
                    <span>Coming soon</span>
                  </button>
                </div>
              )}
            </section>
          ) : null}
        </>
      )}

      {screen === "orders" && canPlace ? (
        <footer className="table-cart-nav">
          <button type="button" className="table-cart-nav__btn" onClick={() => setScreen("bill")}>
            View bill
          </button>
          <button
            type="button"
            className="table-cart-nav__btn table-cart-nav__btn--primary"
            onClick={() => void handlePlaceOrder()}
            disabled={busy === "place"}
          >
            {busy === "place" ? "Placing…" : "Place order"}
          </button>
        </footer>
      ) : (
        <footer className="table-cart-nav">
          {screen === "bill" ? (
            <button
              type="button"
              className="table-cart-nav__btn"
              onClick={() => {
                setShowPay(false);
                setScreen("orders");
              }}
            >
              Go back
            </button>
          ) : (
            <Link to={menuHref} className="table-cart-nav__btn">
              View menu
            </Link>
          )}
          {screen === "bill" ? (
            <button
              type="button"
              className="table-cart-nav__btn table-cart-nav__btn--primary"
              onClick={() => {
                if (!canCheckout && billRequested) return;
                setShowPay(true);
              }}
              disabled={!canCheckout && !billRequested}
            >
              {billRequested ? "Bill requested" : "Proceed to pay"}
            </button>
          ) : (
            <button
              type="button"
              className="table-cart-nav__btn table-cart-nav__btn--primary"
              onClick={() => setScreen("bill")}
            >
              View bill
            </button>
          )}
        </footer>
      )}

      {toast ? (
        <div
          className={`toast-message ${toast.isError ? "toast-message--error" : ""}`}
          role="status"
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
};

export default FineDineCartPage;
