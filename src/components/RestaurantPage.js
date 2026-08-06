import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  addToCart,
  getCart,
  getRestaurantBySlug,
  updateCartQuantity,
} from "../api/restaurantApi";
import CheckoutFooter from "./restaurant/CheckoutFooter";
import CategoryTabs from "./restaurant/CategoryTabs";
import FoodItemCard from "./restaurant/FoodItemCard";
import RestaurantHeader from "./restaurant/RestaurantHeader";
import { getStoredCartId, setStoredCartId } from "../utils/cartStorage";
import { findCartLine, getFoodCartCounts } from "../utils/parcelHelpers";
import { setLastRestaurantSlug } from "../utils/customerStorage";
import { routes } from "../utils/routes";
import "./restaurant/RestaurantMenu.css";

const RestaurantPage = () => {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [cart, setCart] = useState(null);
  const [updatingKey, setUpdatingKey] = useState(null);
  const [toast, setToast] = useState(null);

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

  useEffect(() => {
    let cancelled = false;

    const fetchRestaurant = async () => {
      setLoading(true);
      setError("");
      setData(null);

      try {
        const response = await getRestaurantBySlug(slug);
        if (!cancelled) {
          setData(response);
          const firstCategory = response.categories?.[0];
          if (firstCategory) {
            setActiveCategoryId(firstCategory.id);
          }
        }
      } catch {
        if (!cancelled) {
          setError("Invalid URL");
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
      loadCart();
    } else {
      setError("Invalid URL");
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [slug, loadCart]);

  const categories = useMemo(
    () => data?.categories?.filter((c) => (c.foodItems ?? []).length > 0) ?? [],
    [data]
  );

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === activeCategoryId) ?? categories[0],
    [categories, activeCategoryId]
  );

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

  if (loading) {
    return (
      <div className="restaurant-page d-flex align-items-center justify-content-center">
        <p className="text-muted">Loading menu…</p>
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

  const { restaurant } = data;
  const hasCartItems = !!cart?.items?.length;

  return (
    <div className={`restaurant-page ${hasCartItems ? "restaurant-page--has-cart" : ""}`}>
      <RestaurantHeader restaurant={restaurant} />

      <div className="restaurant-page__toolbar">
        <Link to={routes.trackOrders} className="restaurant-page__orders-link">
          Track orders
        </Link>
      </div>

      <CategoryTabs
        categories={categories}
        activeId={activeCategory?.id}
        onSelect={setActiveCategoryId}
      />

      <main className="menu-content">
        {activeCategory ? (
          <>
            <h2 className="menu-section__title">{activeCategory.categoryName}</h2>
            {activeCategory.description && (
              <p className="menu-section__desc">{activeCategory.description}</p>
            )}
            <div className="food-list">
              {(activeCategory.foodItems ?? []).map((item) => {
                const { dineIn, parcel } = getFoodCartCounts(cart?.items, item.id);
                return (
                  <FoodItemCard
                    key={item.id}
                    item={item}
                    categoryName={activeCategory.categoryName}
                    dineInQty={dineIn}
                    parcelQty={parcel}
                    onAddDineIn={(food) => handleAdd(food, false)}
                    onAddParcel={(food) => handleAdd(food, true)}
                    onRemoveDineIn={(food) => handleRemove(food, false)}
                    onRemoveParcel={(food) => handleRemove(food, true)}
                    updatingDineIn={updatingKey === `${item.id}-dinein`}
                    updatingParcel={updatingKey === `${item.id}-parcel`}
                  />
                );
              })}
            </div>
          </>
        ) : (
          <p className="menu-empty">No menu items available.</p>
        )}
      </main>

      <CheckoutFooter cart={cart} slug={slug} visible={hasCartItems} />

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
