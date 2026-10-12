import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  confirmPublicReservation,
  getPublicReservation,
  savePublicPreOrder,
} from "../api/restaurantApi";
import FoodItemCard from "./restaurant/FoodItemCard";
import "./restaurant/RestaurantMenu.css";

const formatWhen = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "";
  return date.toLocaleString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });
};

const statusCopy = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "confirmed":
      return "Confirmed. Show this page when you arrive.";
    case "checked_in":
      return "You are seated. Ask the captain for the table menu.";
    case "cancelled":
      return "This reservation was cancelled.";
    case "no_show":
      return "This reservation was marked as no-show.";
    case "completed":
      return "This reservation is complete.";
    default:
      return "Please confirm you are coming. The live menu opens only after the captain seats you.";
  }
};

const ReservationPreOrderPage = () => {
  const { token } = useParams();
  const [reservation, setReservation] = useState(null);
  const [menu, setMenu] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [step, setStep] = useState("details");
  const [quantities, setQuantities] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const applyReservation = useCallback((data) => {
    setReservation(data);
    const next = {};
    (data.preOrderItems ?? []).forEach((item) => {
      next[item.foodId] = item.quantity;
    });
    setQuantities(next);
    if (Array.isArray(data.menu)) {
      setMenu(data.menu);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getPublicReservation(token);
        if (!cancelled) applyReservation(data);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Reservation not found.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [applyReservation, token]);

  const selectedItems = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, quantity]) => Number(quantity) > 0)
        .map(([foodId, quantity]) => ({ foodId: Number(foodId), quantity: Number(quantity) })),
    [quantities]
  );

  const canAct =
    reservation &&
    !["cancelled", "no_show", "checked_in", "completed"].includes(
      String(reservation.status || "").toLowerCase()
    );
  const isBooked = String(reservation?.status || "").toLowerCase() === "booked";

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      applyReservation(await confirmPublicReservation(token));
      showToast("Reservation confirmed. See you at the table.");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not confirm reservation.", true);
    } finally {
      setConfirming(false);
    }
  };

  const openPreOrder = async () => {
    setSaving(true);
    try {
      const data = await getPublicReservation(token, { includeMenu: true });
      applyReservation(data);
      setStep("preorder");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not load pre-order menu.", true);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      applyReservation(await savePublicPreOrder(token, selectedItems));
      setStep("details");
      showToast("Pre-order saved. Kitchen will see it after check-in.");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not save pre-order.", true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="restaurant-page d-flex align-items-center justify-content-center">
        <p className="text-muted">Loading reservation…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="restaurant-page d-flex align-items-center justify-content-center">
        <h1 className="text-danger">{error}</h1>
      </div>
    );
  }

  const preOrderItems = reservation.preOrderItems ?? [];

  if (step === "preorder") {
    return (
      <div className="restaurant-page restaurant-page--has-cart">
        <section className="seating-card">
          <h2>Pre-order for arrival</h2>
          <p>
            These dishes are held until the captain checks you in. This is not the live table
            menu.
          </p>
          <button type="button" className="seating-card__secondary" onClick={() => setStep("details")}>
            Back to reservation
          </button>
        </section>

        <main className="menu-content">
          <div className="food-list">
            {menu.map((item) => (
              <FoodItemCard
                key={item.id}
                item={item}
                categoryName={item.course || "Menu"}
                dineInQty={quantities[item.id] || 0}
                parcelQty={0}
                hideParcel
                dineInLabel="Pre-order"
                dineInSublabel="Held until you arrive"
                onAddDineIn={() =>
                  setQuantities((current) => ({
                    ...current,
                    [item.id]: (current[item.id] || 0) + 1,
                  }))
                }
                onRemoveDineIn={() =>
                  setQuantities((current) => ({
                    ...current,
                    [item.id]: Math.max(0, (current[item.id] || 0) - 1),
                  }))
                }
                onAddParcel={() => {}}
                onRemoveParcel={() => {}}
              />
            ))}
          </div>
        </main>

        <footer className="checkout-footer">
          <div className="checkout-footer__inner">
            <div className="checkout-footer__summary">
              <span className="checkout-footer__count">
                {selectedItems.reduce((sum, item) => sum + item.quantity, 0)} items
              </span>
            </div>
            <button
              type="button"
              className="checkout-footer__btn"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save pre-order"}
            </button>
          </div>
        </footer>

        {toast ? (
          <div className={`toast-message ${toast.isError ? "toast-message--error" : ""}`} role="status">
            {toast.message}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="restaurant-page">
      <section className="seating-card reservation-card">
        <p className="reservation-card__kicker">Reservation</p>
        <h2>{reservation.restaurantName || "Your table"}</h2>
        <p className="reservation-card__when">{formatWhen(reservation.scheduledAt)}</p>
        <dl className="reservation-card__details">
          <div>
            <dt>Guest</dt>
            <dd>{reservation.customerName}</dd>
          </div>
          <div>
            <dt>Party</dt>
            <dd>{reservation.guestCount} guests</dd>
          </div>
          <div>
            <dt>Table</dt>
            <dd>{reservation.tableNo ? `Table ${reservation.tableNo}` : "Assigned at arrival"}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{reservation.status}</dd>
          </div>
        </dl>
        <p>{statusCopy(reservation.status)}</p>

        {preOrderItems.length ? (
          <div className="reservation-card__preorder">
            <strong>Pre-order</strong>
            <ul>
              {preOrderItems.map((item) => (
                <li key={item.id || item.foodId}>
                  {item.quantity} × {item.name}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>No dishes held yet. You can add a pre-order if you want it ready at arrival.</p>
        )}

        {canAct ? (
          <div className="reservation-card__actions">
            {isBooked ? (
              <button
                type="button"
                className="seating-card__secondary"
                disabled={confirming}
                onClick={() => void handleConfirm()}
              >
                {confirming ? "Confirming…" : "Confirm reservation"}
              </button>
            ) : null}
            <button
              type="button"
              className="reservation-card__ghost"
              disabled={saving}
              onClick={() => void openPreOrder()}
            >
              {preOrderItems.length ? "Edit pre-order" : "Optional pre-order"}
            </button>
          </div>
        ) : null}
      </section>

      {toast ? (
        <div className={`toast-message ${toast.isError ? "toast-message--error" : ""}`} role="status">
          {toast.message}
        </div>
      ) : null}
    </div>
  );
};

export default ReservationPreOrderPage;
