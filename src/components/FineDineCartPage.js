import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  createFineDineTableRequest,
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
  getGuestsOnSession,
  getHeldCartItems,
  getOrdererInfo,
  getOrderItems,
  getOrderLabel,
  getOrderStatus,
  getOrderStatusLabel,
  getOrderTime,
  getSessionItemDisplayName,
  getSessionItemFoodType,
  getSessionItemNote,
  getSessionItemQty,
  getSessionItemTotal,
  getSessionItemUnitPrice,
  getSessionOrders,
  isActiveFineDineSession,
  isBillRequested,
  isCancelledOrder,
  isStaffOrder,
  sumItemQuantities,
} from "../utils/fineDineSession";
import { getStoredFineDineGuest, matchSessionGuest } from "../utils/fineDineGuestStorage";
import TableRequestModal from "./TableRequestModal";
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

const OrderItemRow = ({ item, session, order, showQtyControls, busy, onQty }) => {
  const orderer = getOrdererInfo(item, session, order);
  return (
  <div className="table-ticket__item">
    <div className="table-ticket__item-name">
      <VegDot foodType={getSessionItemFoodType(item)} />
      <div>
        <strong>{getSessionItemDisplayName(item)}</strong>
        {orderer ? (
          <span className="table-ticket__note">
            {orderer.prefix || "Ordered by"} {orderer.label}
            {orderer.detail ? (
              <em className="table-ticket__invite">{orderer.detail}</em>
            ) : null}
          </span>
        ) : null}
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
};

const FineDineCartPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const menuHref = `${routes.restaurant(slug)}${location.search}`;
  const hadSessionRef = useRef(false);

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
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestBusy, setRequestBusy] = useState(false);

  const showToast = useCallback((message, isError = false) => {
    setToast({ message, isError });
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const returnToRequestCode = useCallback(
    (cleared) => {
      navigate(menuHref, { replace: true, state: cleared ? { tableCleared: true } : {} });
    },
    [navigate, menuHref]
  );

  const loadSession = useCallback(async () => {
    const requestedTable = new URLSearchParams(location.search).get("table");
    const context = await getFineDineTableContext(slug, requestedTable);
    const nextSession = isActiveFineDineSession(context.session) ? context.session : null;
    if (nextSession) hadSessionRef.current = true;
    setSession(nextSession);
    setTableNo(context.tableNo || nextSession?.tableNo || null);
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
    if (loading) return;
    if (isActiveFineDineSession(session)) return;
    returnToRequestCode(hadSessionRef.current);
  }, [loading, session, returnToRequestCode]);

  useEffect(() => {
    const poll = () => {
      void loadSession().catch((err) => {
        const status = err?.response?.status;
        const message = String(err?.response?.data?.message || "");
        const sessionGone =
          status === 404 || /session|cleared|closed|not found/i.test(message);
        if (sessionGone && hadSessionRef.current) {
          returnToRequestCode(true);
        }
      });
    };
    const timer = window.setInterval(poll, 4000);
    const onVisible = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadSession, returnToRequestCode]);

  const currentGuest = useMemo(
    () => matchSessionGuest(session, getStoredFineDineGuest(slug)),
    [session, slug]
  );
  const isHost = currentGuest?.role === "host";
  const guestActor = currentGuest
    ? { guestId: currentGuest.id || currentGuest.guestId, guestPhone: currentGuest.phone }
    : {};

  useEffect(() => {
    if (loading || !isActiveFineDineSession(session)) return;
    if (currentGuest) return;
    navigate(menuHref, { replace: true });
  }, [loading, session, currentGuest, navigate, menuHref]);

  const allCartItems = useMemo(() => getHeldCartItems(session), [session]);
  const cartItems = useMemo(() => {
    if (!currentGuest || isHost) return allCartItems;
    return allCartItems.filter(
      (item) => !item.orderedByGuestId || item.orderedByGuestId === currentGuest.id
    );
  }, [allCartItems, currentGuest, isHost]);
  const orders = useMemo(() => getSessionOrders(session), [session]);
  const guestOrders = useMemo(() => orders.filter((order) => !isStaffOrder(order)), [orders]);
  const staffOrders = useMemo(() => orders.filter((order) => isStaffOrder(order)), [orders]);
  const billRequested = isBillRequested(session);
  const billLines = useMemo(() => getBillLines(session), [session]);
  const bill = useMemo(() => getBillCharges(session), [session]);
  const cartCount = sumItemQuantities(cartItems);
  const canPlace = cartItems.length > 0;
  const canCheckout = isHost && (cartItems.length > 0 || orders.length > 0) && !billRequested;

  const handleQty = async (item, nextQty) => {
    setBusy(`item-${item.id}`);
    try {
      const next = await updateFineDineSessionItem(slug, item.id, nextQty, guestActor);
      const nextSession = next.session || next;
      if (!isActiveFineDineSession(nextSession)) {
        returnToRequestCode(true);
        return;
      }
      setSession(nextSession);
    } catch (err) {
      showToast(err.response?.data?.message || "Could not update item.", true);
      void loadSession().catch(() => {});
    } finally {
      setBusy("");
    }
  };

  const handleTableRequest = async ({ type, note }) => {
    setRequestBusy(true);
    try {
      const result = await createFineDineTableRequest(slug, {
        type,
        note,
        guestId: guestActor.guestId,
        guestPhone: guestActor.guestPhone,
      });
      setRequestOpen(false);
      showToast(result.message || "Request sent to the captain.");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not send that request.", true);
    } finally {
      setRequestBusy(false);
    }
  };

  const handlePlaceOrder = async () => {
    setBusy("place");
    try {
      const next = await placeFineDineOrder(slug, guestActor);
      const nextSession = next.session || next;
      if (!isActiveFineDineSession(nextSession)) {
        returnToRequestCode(true);
        return;
      }
      setSession(nextSession);
      showToast("Order placed. The kitchen will start preparing it.");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not place order.", true);
      void loadSession().catch(() => {});
    } finally {
      setBusy("");
    }
  };

  const handleCheckout = async (method) => {
    if (method === "online" || !isHost) return;
    setPayMethod(method);
    setBusy("pay");
    try {
      const next = await requestFineDineBill(slug, guestActor);
      const nextSession = next.session || next;
      if (!isActiveFineDineSession(nextSession)) {
        returnToRequestCode(true);
        return;
      }
      setSession(nextSession);
      setShowPay(false);
      showToast(
        method === "card"
          ? "Bill requested. The captain will collect card payment."
          : "Bill requested. Pay cash to the captain."
      );
    } catch (err) {
      showToast(err.response?.data?.message || "Could not start checkout.", true);
      void loadSession().catch(() => {});
    } finally {
      setBusy("");
    }
  };

  if (loading || !isActiveFineDineSession(session)) {
    return (
      <div className="checkout-page d-flex align-items-center justify-content-center">
        <p className="text-muted">{error || "Loading cart…"}</p>
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
                      session={session}
                      order={order}
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
        <button
          type="button"
          className="restaurant-page__orders-link table-cart-request-link"
          onClick={() => setRequestOpen(true)}
        >
          Request
        </button>
        <div>
          <p className="table-cart-top__eyebrow">{restaurantName || "Table"}</p>
          <h1>{screen === "bill" ? "Bill" : getGuestLabel(session)}</h1>
          <p className="table-cart-page__meta">
            {tableNo ? `Table ${tableNo}` : "Your current orders"}
            {getGuestsOnSession(session).length > 1
              ? ` · ${getGuestsOnSession(session).length} guests on one bill`
              : ""}
            {currentGuest?.name ? ` · ordering as ${currentGuest.name}` : ""}
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
                    session={session}
                    showQtyControls
                    busy={busy}
                    onQty={(line, qty) => void handleQty(line, qty)}
                  />
                ))}
              </div>
            </article>
          ) : null}

          {renderOrderGroup(isHost ? "Table orders" : "Your orders", guestOrders)}
          {renderOrderGroup("Ordered through restaurant staff", staffOrders)}
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
              billLines.map((item, index) => {
                const orderer = getOrdererInfo(item, session, item.__order);
                return (
                <div key={item.id || `${item.foodId}-${index}`} className="table-bill__row">
                  <span>
                    {getSessionItemDisplayName(item)}
                    {orderer ? (
                      <small>
                        {orderer.prefix || "Ordered by"} {orderer.label}
                        {orderer.detail ? ` · ${orderer.detail}` : ""}
                      </small>
                    ) : null}
                    {getSessionItemNote(item) ? (
                      <small>{getSessionItemNote(item)}</small>
                    ) : null}
                  </span>
                  <span>{getSessionItemQty(item)}</span>
                  <span>{formatInr(getSessionItemUnitPrice(item))}</span>
                  <span>{formatInr(getSessionItemTotal(item))}</span>
                </div>
                );
              })
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
          {screen === "bill" && isHost ? (
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
          ) : screen === "bill" ? (
            <span className="table-cart-nav__note">
              {billRequested
                ? "Bill requested. The host will settle payment."
                : "You can view this bill. Only the host can request payment."}
            </span>
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

      <TableRequestModal
        open={requestOpen}
        busy={requestBusy}
        onClose={() => setRequestOpen(false)}
        onSubmit={(payload) => void handleTableRequest(payload)}
      />

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
