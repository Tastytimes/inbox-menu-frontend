import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getPublicReservation,
  savePublicPreOrder,
} from "../api/restaurantApi";
import FoodItemCard from "./restaurant/FoodItemCard";
import "./restaurant/RestaurantMenu.css";

const ReservationPreOrderPage = () => {
  const { token } = useParams();
  const [reservation, setReservation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getPublicReservation(token);
        if (cancelled) return;
        setReservation(data);
        const next = {};
        (data.preOrderItems ?? []).forEach((item) => {
          next[item.foodId] = item.quantity;
        });
        setQuantities(next);
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
  }, [token]);

  const selectedItems = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, quantity]) => Number(quantity) > 0)
        .map(([foodId, quantity]) => ({ foodId: Number(foodId), quantity: Number(quantity) })),
    [quantities]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await savePublicPreOrder(token, selectedItems);
      setReservation(data);
      showToast("Pre-order saved. Your captain will see this at check-in.");
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

  return (
    <div className="restaurant-page restaurant-page--has-cart">
      <section className="seating-card">
        <h2>{reservation.restaurantName || "Reservation"}</h2>
        <p>
          {reservation.customerName} · {reservation.guestCount} guests ·{" "}
          {new Date(reservation.scheduledAt).toLocaleString()}
        </p>
        <p>Add dishes now. They will be ordered after the captain seats you.</p>
      </section>

      <main className="menu-content">
        <div className="food-list">
          {(reservation.menu ?? []).map((item) => (
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

export default ReservationPreOrderPage;
