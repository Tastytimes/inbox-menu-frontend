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

export const inviteFineDineGroupGuest = async (slug, payload) => {
  const { data } = await restaurantClient.post(
    `/fine-dine/public/tables/${slug}/group-invite`,
    payload
  );
  return data;
};

export const acceptFineDineGroupInvite = async (token) => {
  const { data } = await restaurantClient.post(
    `/fine-dine/public/group-invites/${token}/accept`
  );
  return data;
};

export const verifyFineDineOtp = async (slug, payload) => {
  try {
    const { data } = await restaurantClient.post(
      `/fine-dine/public/tables/${slug}/otp-verify`,
      payload
    );
    return data;
  } catch (err) {
    const messages = err.response?.data?.message;
    const guestNameRejected = [messages]
      .flat()
      .some((item) => /guestName should not exist/i.test(String(item || "")));
    if (err.response?.status === 400 && guestNameRejected && payload?.guestName) {
      const { guestName, ...rest } = payload;
      const { data } = await restaurantClient.post(
        `/fine-dine/public/tables/${slug}/otp-verify`,
        rest
      );
      return data;
    }
    throw err;
  }
};

export const joinFineDineSession = async (slug, payload) => {
  const { data } = await restaurantClient.post(`/fine-dine/public/tables/${slug}/join`, payload);
  return data;
};

export const addFineDineSessionItem = async (slug, payload) => {
  const { data } = await restaurantClient.post(`/fine-dine/public/tables/${slug}/items`, payload);
  return data;
};

export const updateFineDineSessionItem = async (slug, itemId, quantity, actor = {}) => {
  const { data } = await restaurantClient.patch(
    `/fine-dine/public/tables/${slug}/items/${itemId}`,
    { quantity, ...actor }
  );
  return data;
};

export const placeFineDineOrder = async (slug, actor = {}) => {
  const { data } = await restaurantClient.post(`/fine-dine/public/tables/${slug}/place-order`, actor);
  return data;
};

export const createFineDineTableRequest = async (slug, payload) => {
  const { data } = await restaurantClient.post(
    `/fine-dine/public/tables/${slug}/requests`,
    payload
  );
  return data;
};

export const requestFineDineBill = async (slug, payload = {}) => {
  const { data } = await restaurantClient.post(
    `/fine-dine/public/tables/${slug}/bill`,
    payload
  );
  return data;
};

export const getPublicReservation = async (token, { includeMenu } = {}) => {
  const { data } = await restaurantClient.get(`/fine-dine/public/reservations/${token}`, {
    params: includeMenu ? { includeMenu: true } : undefined,
  });
  return data;
};

export const confirmPublicReservation = async (token) => {
  const { data } = await restaurantClient.post(`/fine-dine/public/reservations/${token}/confirm`);
  return data;
};

export const savePublicPreOrder = async (token, items) => {
  const { data } = await restaurantClient.post(
    `/fine-dine/public/reservations/${token}/pre-order`,
    { items }
  );
  return data;
};
