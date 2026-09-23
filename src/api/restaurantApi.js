import { restaurantClient } from "./baseUrl";

export { restaurantClient };

export const getRestaurantBySlug = async (slug, table) => {
  const params = {};
  if (table) params.table = table;
  const { data } = await restaurantClient.get(`/user/restaurants/${slug}`, { params });
  return data;
};

export const addToCart = async (payload) => {
  const { data } = await restaurantClient.post("/user/cart/add", payload);
  return data;
};

export const updateCartQuantity = async ({ slug, cartId, foodId, quantity }) => {
  const { data } = await restaurantClient.post("/user/cart/update-quantity", {
    slug,
    cartId,
    foodId: Number(foodId),
    quantity: Number(quantity),
  });
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

export const getFineDineTableContext = async (slug, table) => {
  const params = {};
  if (table) params.table = table;
  const { data } = await restaurantClient.get(`/fine-dine/public/tables/${slug}`, {
    params,
  });
  return data;
};

export const requestFineDineOtp = async (slug, guestPhone) => {
  const { data } = await restaurantClient.post(`/fine-dine/public/tables/${slug}/otp-request`, {
    guestPhone,
  });
  return data;
};

export const verifyFineDineOtp = async (slug, payload) => {
  const { data } = await restaurantClient.post(
    `/fine-dine/public/tables/${slug}/otp-verify`,
    payload
  );
  return data;
};

export const addFineDineSessionItem = async (slug, payload) => {
  const { data } = await restaurantClient.post(`/fine-dine/public/tables/${slug}/items`, payload);
  return data;
};

export const updateFineDineSessionItem = async (slug, itemId, quantity) => {
  const { data } = await restaurantClient.patch(
    `/fine-dine/public/tables/${slug}/items/${itemId}`,
    { quantity }
  );
  return data;
};

export const placeFineDineOrder = async (slug) => {
  const { data } = await restaurantClient.post(`/fine-dine/public/tables/${slug}/place-order`);
  return data;
};

export const requestFineDineBill = async (slug, payload = {}) => {
  const { data } = await restaurantClient.post(
    `/fine-dine/public/tables/${slug}/bill`,
    payload
  );
  return data;
};

export const getPublicReservation = async (token) => {
  const { data } = await restaurantClient.get(`/fine-dine/public/reservations/${token}`);
  return data;
};

export const savePublicPreOrder = async (token, items) => {
  const { data } = await restaurantClient.post(
    `/fine-dine/public/reservations/${token}/pre-order`,
    { items }
  );
  return data;
};
