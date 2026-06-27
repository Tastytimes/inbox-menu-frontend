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
import OrderTypeModal from "./restaurant/OrderTypeModal";
import RestaurantHeader from "./restaurant/RestaurantHeader";
import { getStoredCartId, setStoredCartId } from "../utils/cartStorage";
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
  const [pendingFood, setPendingFood] = useState(null);
  const [updatingFoodId, setUpdatingFoodId] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const cartQuantities = useMemo(() => {
    const map = {};
    cart?.items?.forEach((item) => {
      map[item.foodId] = item.quantity;
    });
    return map;
  }, [cart]);

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
    async (foodId, updater) => {
      setUpdatingFoodId(foodId);
      try {
        const response = await updater();
        await syncCart(response);
      } catch (err) {
        const message =
          err.response?.data?.message || "Could not update cart. Please try again.";
        showToast(message, true);
      } finally {
        setUpdatingFoodId(null);
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

  const handleAddClick = (food) => {
    setPendingFood(food);
  };

  const handleOrderTypeSelect = async (isParcel) => {
    if (!pendingFood) return;

    setCartLoading(true);
    setUpdatingFoodId(pendingFood.id);

    try {
      const payload = {
        slug,
        foodId: pendingFood.id,
        quantity: 1,
        isParcel,
      };
      const storedCartId = getStoredCartId(slug);
      if (storedCartId) {
        payload.cartId = storedCartId;
      }

      const cartResponse = await addToCart(payload);
      await syncCart(cartResponse);
      setPendingFood(null);
      showToast(`${pendingFood.name} added to cart`);
    } catch (err) {
      const message =
        err.response?.data?.message || "Could not add item. Please try again.";
      showToast(message, true);
    } finally {
      setCartLoading(false);
      setUpdatingFoodId(null);
    }
  };

  const handleIncrement = (food) => {
    const cartId = getStoredCartId(slug);
    if (!cartId || !cart) {
      handleAddClick(food);
      return;
    }

    const cartItem = cart.items.find((entry) => entry.foodId === food.id);
    runCartUpdate(food.id, () =>
      addToCart({
        slug,
        cartId,
        foodId: food.id,
        quantity: 1,
        isParcel: cartItem?.isParcel ?? false,
      })
    );
  };

  const handleDecrement = (food) => {
    const cartId = getStoredCartId(slug);
    const currentQty = cartQuantities[food.id] ?? 0;
    if (!cartId || currentQty === 0) return;

    const nextQty = currentQty - 1;

    runCartUpdate(food.id, () =>
      updateCartQuantity({
        slug,
        cartId,
        foodId: food.id,
        quantity: nextQty,
      })
    );
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
              {(activeCategory.foodItems ?? []).map((item) => (
                <FoodItemCard
                  key={item.id}
                  item={item}
                  quantity={cartQuantities[item.id] ?? 0}
                  updating={updatingFoodId === item.id}
                  onAddToCart={handleAddClick}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="menu-empty">No menu items available.</p>
        )}
      </main>

      <CheckoutFooter cart={cart} slug={slug} visible={hasCartItems} />

      <OrderTypeModal
        show={!!pendingFood}
        foodName={pendingFood?.name}
        loading={cartLoading}
        onClose={() => !cartLoading && setPendingFood(null)}
        onSelect={handleOrderTypeSelect}
      />

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
