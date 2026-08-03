import { restaurantClient } from "./baseUrl";

export { restaurantClient };

export const getRestaurantBySlug = async (slug) => {
  const { data } = await restaurantClient.get(`/user/restaurants/${slug}`);
  return data;
};

export const addToCart = async (payload) => {
  const { data } = await restaurantClient.post("/user/cart/add", payload);
  return data;
};

export const updateCartQuantity = async (payload) => {
  const { data } = await restaurantClient.post("/user/cart/update-quantity", payload);
  return data;
};

export const getCart = async (cartId, slug, isParcel) => {
  const params = { slug };
  if (isParcel !== undefined) {
    params.isParcel = isParcel;
  }
  const { data } = await restaurantClient.get(`/user/cart/${cartId}`, {
    params,
  });
  return data;
};
