import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  addFineDineSessionItem,
  addToCart,
  getCart,
  getFineDineTableContext,
  getRestaurantBySlug,
  createFineDineTableRequest,
  inviteFineDineGroupGuest,
  requestFineDineOtp,
  verifyFineDineOtp,
  updateCartQuantity,
  updateFineDineSessionItem,
} from "../api/restaurantApi";
import TableRequestModal from "./TableRequestModal";
import CheckoutFooter from "./restaurant/CheckoutFooter";
import FoodItemCard from "./restaurant/FoodItemCard";
import MenuAccordion from "./restaurant/MenuAccordion";
import MenuCategoryJump from "./restaurant/MenuCategoryJump";
import MenuSearch from "./restaurant/MenuSearch";
import RestaurantHeader from "./restaurant/RestaurantHeader";
import { getStoredCartId, setStoredCartId } from "../utils/cartStorage";
import { findCartLine, getFoodCartCounts } from "../utils/parcelHelpers";
import { setLastRestaurantSlug } from "../utils/customerStorage";
import {
  clearStoredFineDineGuest,
  getStoredFineDineGuest,
  matchSessionGuest,
  setStoredFineDineGuest,
  toStoredFineDineGuest,
} from "../utils/fineDineGuestStorage";
import {
  getMaxSeatingCapacity,
  isActiveFineDineSession,
  parseGuestCount,
} from "../utils/fineDineSession";
import { countMenuItems, filterMenuCategories } from "../utils/menuSearch";
import { routes } from "../utils/routes";
import "./restaurant/RestaurantMenu.css";

const getRestaurantLoadError = (err) => {
  const status = err?.response?.status;
  const message = err?.response?.data?.message;

  if (status === 400 && /closed/i.test(String(message || ""))) {
    return {
      title: "Restaurant is currently closed",
      detail: "This table QR is valid, but the restaurant is not taking orders right now. Please try again during opening hours.",
    };
  }

  if (status === 404) {
    const isMissingTableQr = /has not been created/i.test(String(message || ""));
    return {
      title: isMissingTableQr ? "Table QR not created" : "Menu not found",
      detail: message || "This QR link is inactive or does not exist.",
    };
  }

  if (!err?.response) {
    return {
      title: "Could not load menu",
      detail: "Check your internet connection and try again.",
    };
  }

  return {
    title: "Could not load menu",
    detail: message || "Please try again in a moment.",
  };
};

const RestaurantPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const requestedTable = new URLSearchParams(location.search).get("table");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [menuQuery, setMenuQuery] = useState("");
  const [openCategoryIds, setOpenCategoryIds] = useState(() => new Set());
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const pendingScrollRef = useRef(null);
  const skipObserverRef = useRef(false);
  const [cart, setCart] = useState(null);
  const [updatingKey, setUpdatingKey] = useState(null);
  const [toast, setToast] = useState(null);
  const [tableContext, setTableContext] = useState(null);
  const [seatingStep, setSeatingStep] = useState("loading");
  const [otpCode, setOtpCode] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestCount, setGuestCount] = useState("2");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestBusy, setRequestBusy] = useState(false);
  const [currentGuest, setCurrentGuest] = useState(null);
  const [sessionTab, setSessionTab] = useState(null);
  const [seatingBusy, setSeatingBusy] = useState(false);
  const seatingStepRef = useRef("loading");

  const isFineDining = Boolean(data?.context?.isFineDining);
  const tableNo = tableContext?.tableNo || data?.context?.tableNo;
  const maxSeatingCapacity = useMemo(() => {
    const direct = Number(tableContext?.capacity ?? data?.context?.capacity);
    if (Number.isFinite(direct) && direct > 0) return direct;
    return getMaxSeatingCapacity(tableContext, data?.context, data?.restaurant);
  }, [tableContext, data]);

  useEffect(() => {
    seatingStepRef.current = seatingStep;
  }, [seatingStep]);

  const showToast = useCallback((message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const loadCart = useCallback(async () => {
    const cartId = getStoredCartId(slug);
    if (!cartId) return;
    try {
      const cartData = await getCart(cartId, slug);
      setCart(cartData);
    } catch {
      setStoredCartId(slug, null);
      setCart(null);
    }
  }, [slug]);

  const syncCart = useCallback(
    async (cartResponse) => {
      setStoredCartId(slug, cartResponse.cartId);
      setCart(cartResponse);
    },
    [slug]
  );

  const runCartUpdate = useCallback(
    async (key, foodId, updater) => {
      setUpdatingKey(key);
      try {
        const response = await updater();
        await syncCart(response);
      } catch (err) {
        const message =
          err.response?.data?.message || "Could not update cart. Please try again.";
        showToast(message, true);
      } finally {
        setUpdatingKey(null);
      }
    },
    [syncCart, showToast]
  );

  const resetToRequestCode = useCallback(
    (message) => {
      setSessionTab(null);
      setCurrentGuest(null);
      clearStoredFineDineGuest(slug);
      setOtpCode("");
      setSeatingStep("otp");
      if (message) showToast(message);
    },
    [slug, showToast]
  );

  const seatMatchedGuest = useCallback(
    (session, stored = getStoredFineDineGuest(slug)) => {
      const matched = matchSessionGuest(session, stored);
      if (!matched) return null;
      const next = toStoredFineDineGuest(session, {
        ...stored,
        ...matched,
        id: matched.id || stored?.guestId,
        phone: matched.phone || stored?.phone || session?.guestPhone,
        email: matched.email || stored?.email,
        role: matched.role || stored?.role,
      });
      setStoredFineDineGuest(slug, next);
      setCurrentGuest(next);
      setSeatingStep("seated");
      return next;
    },
    [slug]
  );

  const refreshTableContext = useCallback(async () => {
    const context = await getFineDineTableContext(slug, requestedTable);
    setTableContext(context);
    if (isActiveFineDineSession(context.session)) {
      setSessionTab(context.session);
      if (!seatMatchedGuest(context.session)) {
        setSeatingStep((current) => (current === "pending" ? current : "occupied"));
      }
      return context;
    }

    const wasSeated = seatingStepRef.current === "seated" || seatingStepRef.current === "occupied";
    setSessionTab(null);
    setCurrentGuest(null);
    if (wasSeated) {
      resetToRequestCode("This table was cleared. Ask the captain for a new seating code.");
    } else if (context.requiresSeating) {
      setSeatingStep((current) => (current === "pending" ? current : "otp"));
    }
    return context;
  }, [slug, requestedTable, resetToRequestCode, seatMatchedGuest]);

  useEffect(() => {
    let cancelled = false;

    const fetchRestaurant = async () => {
      setLoading(true);
      setError("");
      setData(null);

      try {
        const response = await getRestaurantBySlug(slug, requestedTable);
        if (cancelled) return;
        setData(response);
        const firstCategory = response.categories?.find(
          (category) => (category.foodItems ?? []).length > 0
        );
        setOpenCategoryIds(firstCategory ? new Set([firstCategory.id]) : new Set());
        setActiveCategoryId(firstCategory?.id ?? null);
        setMenuQuery("");

        if (response.context?.isFineDining) {
          try {
            await refreshTableContext();
          } catch {
            setSeatingStep("otp");
          }
        } else {
          setSeatingStep("open");
          await loadCart();
        }
      } catch (err) {
        if (!cancelled) {
          setError(getRestaurantLoadError(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (slug) {
      setLastRestaurantSlug(slug);
      fetchRestaurant();
    } else {
      setError({
        title: "Menu not found",
        detail: "This QR link is missing a restaurant or table slug.",
      });
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [slug, requestedTable, loadCart, refreshTableContext]);

  useEffect(() => {
    if (!location.state?.tableCleared) return;
    resetToRequestCode("This table was cleared. Ask the captain for a new seating code.");
    navigate(`${location.pathname}${location.search}`, { replace: true, state: {} });
  }, [
    location.state,
    location.pathname,
    location.search,
    navigate,
    resetToRequestCode,
  ]);

  useEffect(() => {
    if (
      !isFineDining ||
      (seatingStep !== "pending" && seatingStep !== "seated" && seatingStep !== "join")
    ) {
      return undefined;
    }

    const poll = () => {
      void refreshTableContext().catch((err) => {
        const status = err?.response?.status;
        const message = String(err?.response?.data?.message || "");
        const sessionGone =
          status === 404 || /session|cleared|closed|not found/i.test(message);
        if (seatingStepRef.current === "seated" && sessionGone) {
          resetToRequestCode("This table was cleared. Ask the captain for a new seating code.");
        }
      });
    };

    poll();
    const timer = setInterval(poll, 4000);
    const onVisible = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isFineDining, seatingStep, refreshTableContext, resetToRequestCode]);

  const categories = useMemo(
    () => data?.categories?.filter((c) => (c.foodItems ?? []).length > 0) ?? [],
    [data]
  );

  const visibleCategories = useMemo(
    () => filterMenuCategories(categories, menuQuery),
    [categories, menuQuery]
  );

  const resultCount = useMemo(() => countMenuItems(visibleCategories), [visibleCategories]);
  const hasMenuQuery = Boolean(menuQuery.trim());

  const handleMenuQueryChange = useCallback(
    (value) => {
      setMenuQuery(value);
      const nextVisible = filterMenuCategories(categories, value);
      if (value.trim()) {
        setOpenCategoryIds(new Set(nextVisible.map((category) => category.id)));
        setActiveCategoryId(nextVisible[0]?.id ?? null);
        return;
      }
      setOpenCategoryIds(categories[0] ? new Set([categories[0].id]) : new Set());
      setActiveCategoryId(categories[0]?.id ?? null);
    },
    [categories]
  );

  const handleToggleCategory = useCallback((categoryId) => {
    setOpenCategoryIds((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
        setActiveCategoryId(categoryId);
      }
      return next;
    });
  }, []);

  const jumpToCategory = useCallback((categoryId) => {
    pendingScrollRef.current = categoryId;
    skipObserverRef.current = true;
    setActiveCategoryId(categoryId);
    setOpenCategoryIds((current) => {
      const next = new Set(current);
      next.add(categoryId);
      return next;
    });
  }, []);

  useEffect(() => {
    const categoryId = pendingScrollRef.current;
    if (categoryId == null) return undefined;

    const timer = window.setTimeout(() => {
      document
        .getElementById(`menu-section-${categoryId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      pendingScrollRef.current = null;
      window.setTimeout(() => {
        skipObserverRef.current = false;
      }, 650);
    }, 40);

    return () => window.clearTimeout(timer);
  }, [openCategoryIds, activeCategoryId]);

  useEffect(() => {
    if (!visibleCategories.length) return undefined;

    const elements = visibleCategories
      .map((category) => document.getElementById(`menu-section-${category.id}`))
      .filter(Boolean);

    if (!elements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (skipObserverRef.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);
        const topEntry = visible[0];
        if (!topEntry) return;
        const nextId = topEntry.target.getAttribute("data-category-id");
        if (nextId != null) {
          setActiveCategoryId(Number.isNaN(Number(nextId)) ? nextId : Number(nextId));
        }
      },
      { rootMargin: "-200px 0px -55% 0px", threshold: [0.15, 0.4] }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [visibleCategories]);

  const handleAdd = useCallback(
    (food, isParcel) => {
      const key = `${food.id}-${isParcel ? "parcel" : "dinein"}`;
      const cartId = getStoredCartId(slug);

      runCartUpdate(key, food.id, async () => {
        const payload = {
          slug,
          foodId: food.id,
          quantity: 1,
          isParcel,
        };
        if (cartId) {
          payload.cartId = cartId;
        }
        const response = await addToCart(payload);
        showToast(`${food.name} added (${isParcel ? "parcel" : "dine-in"})`);
        return response;
      });
    },
    [slug, runCartUpdate, showToast]
  );

  const handleRemove = useCallback(
    (food, isParcel) => {
      const cartId = getStoredCartId(slug);
      if (!cartId || !cart) return;

      const cartItem = findCartLine(cart.items, food.id, isParcel);
      if (!cartItem || cartItem.quantity <= 0) return;

      const key = `${food.id}-${isParcel ? "parcel" : "dinein"}`;

      runCartUpdate(key, food.id, () =>
        updateCartQuantity({
          slug,
          cartId,
          foodId: food.id,
          quantity: cartItem.quantity - 1,
        })
      );
    },
    [slug, cart, runCartUpdate]
  );

  const handleAddToSession = useCallback(
    async (food) => {
      setUpdatingKey(`${food.id}-dinein`);
      try {
        const session = await addFineDineSessionItem(slug, {
          foodId: food.id,
          quantity: 1,
          course: food.course || "main",
          guestId: currentGuest?.guestId,
          guestPhone: currentGuest?.phone,
        });
        setSessionTab(session);
        showToast(`${food.name} added to cart`);
      } catch (err) {
        showToast(
          err.response?.data?.message || "Ask the captain to confirm your table first.",
          true
        );
        void refreshTableContext().catch(() => {});
      } finally {
        setUpdatingKey(null);
      }
    },
    [slug, showToast, refreshTableContext, currentGuest]
  );

  const handleRemoveFromSession = useCallback(
    async (food) => {
      const line = [...(sessionTab?.heldItems ?? [])]
        .reverse()
        .find(
          (item) =>
            item.foodId === food.id &&
            !item.fired &&
            (!currentGuest?.guestId ||
              !item.orderedByGuestId ||
              item.orderedByGuestId === currentGuest.guestId)
        );
      if (!line) {
        return;
      }
      setUpdatingKey(`${food.id}-dinein`);
      try {
        const session = await updateFineDineSessionItem(slug, line.id, line.quantity - 1, {
          guestId: currentGuest?.guestId,
          guestPhone: currentGuest?.phone,
        });
        setSessionTab(session);
      } catch (err) {
        showToast(err.response?.data?.message || "Could not update cart.", true);
        void refreshTableContext().catch(() => {});
      } finally {
        setUpdatingKey(null);
      }
    },
    [slug, sessionTab, showToast, refreshTableContext, currentGuest]
  );

  const handleRequestOtp = async () => {
    setSeatingBusy(true);
    try {
      const result = await requestFineDineOtp(slug, guestPhone || undefined);
      if (result?.capacity) {
        setTableContext((current) => ({ ...(current || {}), capacity: result.capacity }));
      }
      showToast("Ask your captain for the seating code.");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not request a seating code.", true);
    } finally {
      setSeatingBusy(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    if (!otpCode.trim() || !guestPhone.trim() || !guestName.trim()) {
      showToast("Enter your name, seating code, and phone number.", true);
      return;
    }
    const guests = parseGuestCount(guestCount);
    if (!Number.isInteger(guests) || guests < 1) {
      showToast("Enter a valid number of guests.", true);
      return;
    }
    if (maxSeatingCapacity != null && guests > maxSeatingCapacity) {
      showToast(
        `This table seats up to ${maxSeatingCapacity} guest${
          maxSeatingCapacity === 1 ? "" : "s"
        }.`,
        true
      );
      return;
    }
    setSeatingBusy(true);
    try {
      const result = await verifyFineDineOtp(slug, {
        code: otpCode.trim(),
        guestPhone: guestPhone.trim(),
        guestName: guestName.trim(),
        guestCount: guests,
      });
      const stored = toStoredFineDineGuest(null, {
        name: guestName.trim(),
        phone: guestPhone.trim(),
        role: "host",
      });
      setStoredFineDineGuest(slug, stored);
      setCurrentGuest(stored);
      setSeatingStep("pending");
      showToast(result.message || "Waiting for the captain to confirm your table.");
    } catch (err) {
      const message = String(err.response?.data?.message || "");
      showToast(
        /capacit|too many guest|exceeds/i.test(message)
          ? message
          : message || "That seating code did not work.",
        true
      );
    } finally {
      setSeatingBusy(false);
    }
  };

  const handleInviteGuest = async (event) => {
    event.preventDefault();
    if (!inviteEmail.trim()) {
      showToast("Enter the email address to invite.", true);
      return;
    }
    setInviteBusy(true);
    try {
      const hostPhone = currentGuest?.phone || sessionTab?.guestPhone || undefined;
      const result = await inviteFineDineGroupGuest(slug, {
        email: inviteEmail.trim(),
        guestPhone: hostPhone,
        ...(hostPhone
          ? {}
          : { guestId: currentGuest?.guestId || currentGuest?.id || undefined }),
      });
      const sentTo = inviteEmail.trim();
      setInviteEmail("");
      setInviteOpen(false);
      await refreshTableContext();
      showToast(result.message || `Invite sent to ${sentTo}`);
    } catch (err) {
      showToast(err.response?.data?.message || "Could not send that invite.", true);
    } finally {
      setInviteBusy(false);
    }
  };

  const handleTableRequest = async ({ type, note }) => {
    setRequestBusy(true);
    try {
      const result = await createFineDineTableRequest(slug, {
        type,
        note,
        guestId: currentGuest?.guestId || currentGuest?.id,
        guestPhone: currentGuest?.phone || sessionTab?.guestPhone,
      });
      setRequestOpen(false);
      showToast(result.message || "Request sent to the captain.");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not send that request.", true);
    } finally {
      setRequestBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="restaurant-page d-flex align-items-center justify-content-center">
        <p className="text-muted">Loading menu…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="restaurant-page restaurant-page--message">
        <section className="restaurant-unavailable" role="status">
          <p className="restaurant-unavailable__eyebrow">Table QR</p>
          <h1>{error.title}</h1>
          <p>{error.detail}</p>
          <Link to={routes.home} className="restaurant-unavailable__link">
            Back to home
          </Link>
        </section>
      </div>
    );
  }

  const { restaurant } = data;
  const sessionCartItems = (sessionTab?.heldItems ?? []).filter(
    (item) =>
      !item.fired &&
      (!currentGuest?.guestId ||
        !item.orderedByGuestId ||
        item.orderedByGuestId === currentGuest.guestId)
  );
  const sessionOrders = sessionTab?.orders ?? [];
  const cartCount = sessionCartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = sessionCartItems.reduce((sum, item) => sum + Number(item.lineFoodTotal || 0), 0);
  const hasCartItems = isFineDining ? cartCount > 0 : !!cart?.items?.length;
  const menuLocked = isFineDining && seatingStep !== "seated";
  const sessionGuests = sessionTab?.guests ?? [];
  const pendingInvites = (sessionTab?.invites ?? []).filter(
    (invite) => invite.status === "pending"
  );
  const groupStarted = Boolean(
    sessionTab?.groupStarted || pendingInvites.length || sessionGuests.some((guest) => guest.role === "guest")
  );

  return (
    <div className={`restaurant-page ${hasCartItems ? "restaurant-page--has-cart" : ""}`}>
      <RestaurantHeader restaurant={restaurant} tableNo={tableNo} />

      <div className="restaurant-page__sticky">
        <div className="restaurant-page__toolbar">
          {!menuLocked ? (
            <MenuSearch
              value={menuQuery}
              onChange={handleMenuQueryChange}
              resultCount={resultCount}
              hasQuery={hasMenuQuery}
            />
          ) : (
            <span />
          )}
          <div className="restaurant-page__toolbar-links">
            {isFineDining && seatingStep === "seated" && currentGuest ? (
              <button
                type="button"
                className="restaurant-page__orders-link"
                onClick={() => setRequestOpen(true)}
              >
                Request
              </button>
            ) : null}
            {isFineDining && seatingStep === "seated" && currentGuest?.role === "host" ? (
              <button
                type="button"
                className="restaurant-page__orders-link"
                onClick={() => setInviteOpen(true)}
              >
                Group order
              </button>
            ) : null}
            <Link to={routes.trackOrders} className="restaurant-page__orders-link">
              Track orders
            </Link>
          </div>
        </div>
        {!menuLocked ? (
          <MenuCategoryJump
            categories={visibleCategories}
            activeId={activeCategoryId}
            onSelect={jumpToCategory}
            hasCart={hasCartItems}
          />
        ) : null}
      </div>

      {isFineDining && seatingStep !== "seated" ? (
        <section className="seating-card">
          <h2>
            {seatingStep === "otp"
              ? "Confirm seating"
              : seatingStep === "occupied"
                ? "Table already seated"
                : `Table ${tableNo || data.context?.tableNo || ""}`}
          </h2>
          {seatingStep === "otp" ? (
            <p className="seating-card__eyebrow">Table {tableNo || data.context?.tableNo || ""}</p>
          ) : null}
          {seatingStep === "pending" ? (
            <p>
              Your captain is confirming the table. Keep this page open. After you are seated
              you can start a group order and invite friends by email.
            </p>
          ) : seatingStep === "occupied" ? (
            <p>
              This table is already seated. Ask the host to invite you by email, then open that
              link to join the group order.
            </p>
          ) : (
            <>
              <p>
                Ask your captain for the seating code. After they confirm your table, the menu
                opens and you can invite friends to the bill.
              </p>
              <button
                type="button"
                className="seating-card__secondary"
                onClick={() => void handleRequestOtp()}
                disabled={seatingBusy}
              >
                {seatingBusy ? "Requesting…" : "Request seating code"}
              </button>
              <form className="seating-form" onSubmit={handleVerifyOtp}>
                <label>
                  Your name
                  <input
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    autoComplete="name"
                  />
                </label>
                <label>
                  Seating code
                  <input
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </label>
                <label>
                  Phone
                  <input
                    value={guestPhone}
                    onChange={(event) => setGuestPhone(event.target.value)}
                    inputMode="tel"
                  />
                </label>
                <label>
                  Guests
                  <input
                    value={guestCount}
                    onChange={(event) => setGuestCount(event.target.value)}
                    inputMode="numeric"
                    min="1"
                    max={maxSeatingCapacity || undefined}
                  />
                  {maxSeatingCapacity ? (
                    <span className="seating-form__hint">
                      Max {maxSeatingCapacity} guest{maxSeatingCapacity === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </label>
                <button type="submit" className="seating-form__start" disabled={seatingBusy}>
                  {seatingBusy ? "Confirming…" : "Confirm seating"}
                </button>
              </form>
            </>
          )}
        </section>
      ) : null}

      {isFineDining && seatingStep === "seated" && currentGuest ? (
        <section className="group-order-banner">
          <p>
            Ordering as {currentGuest.name}
            {currentGuest.role === "host" ? " · table host" : ""}. The bill stays with{" "}
            {sessionTab?.hostName || currentGuest.name}.
          </p>
          {sessionGuests.length > 1 ? (
            <p className="group-order-banner__people">
              On this bill:{" "}
              {sessionGuests
                .map((guest) =>
                  guest.role === "host"
                    ? `${guest.name} (host)`
                    : guest.email
                      ? `${guest.email} · invited by email`
                      : guest.name
                )
                .join(", ")}
            </p>
          ) : null}
          {currentGuest.role === "guest" ? (
            <p className="seating-form__hint">
              You can add dishes and view the bill. Only the host can request the bill.
            </p>
          ) : pendingInvites.length ? (
            <p className="seating-form__hint">
              Waiting to join: {pendingInvites.map((invite) => invite.email).join(", ")}
            </p>
          ) : null}
        </section>
      ) : null}

      {inviteOpen ? (
        <div className="group-order-modal" role="presentation">
          <button
            type="button"
            className="group-order-modal__backdrop"
            aria-label="Close group order"
            onClick={() => !inviteBusy && setInviteOpen(false)}
          />
          <div
            className="group-order-modal__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="group-order-title"
          >
            <h2 id="group-order-title">Group order</h2>
            <p>
              {groupStarted
                ? "Enter a friend’s email. They join this bill after opening the invite link."
                : "Enter a friend’s email to start a group order. They can add dishes to your bill."}
            </p>
            <form className="group-order-invite" onSubmit={handleInviteGuest}>
              <label>
                Email
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="friend@email.com"
                  autoFocus
                />
              </label>
              <div className="group-order-modal__actions">
                <button
                  type="button"
                  className="group-order-modal__cancel"
                  disabled={inviteBusy}
                  onClick={() => setInviteOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" disabled={inviteBusy}>
                  {inviteBusy ? "Sending…" : "Send invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <TableRequestModal
        open={requestOpen}
        busy={requestBusy}
        onClose={() => setRequestOpen(false)}
        onSubmit={(payload) => void handleTableRequest(payload)}
      />

      {!menuLocked ? (
        <main className="menu-content">
          {categories.length ? (
            <MenuAccordion
              categories={visibleCategories}
              openIds={openCategoryIds}
              onToggle={handleToggleCategory}
              renderItems={(category) =>
                (category.foodItems ?? []).map((item) => {
                  const { dineIn, parcel } = isFineDining
                    ? {
                        dineIn: sessionCartItems
                          .filter((line) => line.foodId === item.id)
                          .reduce((sum, line) => sum + line.quantity, 0),
                        parcel: 0,
                      }
                    : getFoodCartCounts(cart?.items, item.id);
                  return (
                    <FoodItemCard
                      key={item.id}
                      item={item}
                      categoryName={category.categoryName}
                      dineInQty={dineIn}
                      parcelQty={parcel}
                      hideParcel={isFineDining}
                      dineInLabel={isFineDining ? "Add to cart" : "Dine-in"}
                      dineInSublabel={
                        isFineDining ? "Place order when you are ready" : "Served at your table"
                      }
                      onAddDineIn={(food) =>
                        isFineDining ? handleAddToSession(food) : handleAdd(food, false)
                      }
                      onAddParcel={(food) => handleAdd(food, true)}
                      onRemoveDineIn={(food) =>
                        isFineDining ? handleRemoveFromSession(food) : handleRemove(food, false)
                      }
                      onRemoveParcel={(food) => handleRemove(food, true)}
                      updatingDineIn={updatingKey === `${item.id}-dinein`}
                      updatingParcel={updatingKey === `${item.id}-parcel`}
                    />
                  );
                })
              }
            />
          ) : (
            <p className="menu-empty">No menu items available.</p>
          )}
        </main>
      ) : null}

      {isFineDining && seatingStep === "seated" && (hasCartItems || sessionOrders.length > 0) ? (
        <footer className="checkout-footer">
          <div className="checkout-footer__inner">
            <div className="checkout-footer__summary">
              <span className="checkout-footer__count">
                {hasCartItems
                  ? `${cartCount} item${cartCount === 1 ? "" : "s"} in cart`
                  : `${sessionOrders.length} order${sessionOrders.length === 1 ? "" : "s"} placed`}
              </span>
              <span className="checkout-footer__total">
                ₹{hasCartItems ? cartTotal : sessionTab?.totalAmount || 0}
              </span>
            </div>
            <button
              type="button"
              className="checkout-footer__btn"
              onClick={() => navigate(`${routes.tableCart(slug)}${location.search}`)}
            >
              {hasCartItems ? "View cart" : "View orders"}
            </button>
          </div>
        </footer>
      ) : (
        <CheckoutFooter cart={cart} slug={slug} visible={!isFineDining && hasCartItems} />
      )}

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

export default RestaurantPage;
