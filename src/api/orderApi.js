import { restaurantClient } from "./restaurantApi";

/**
 * POST /user/orders/checkout
 * @param {Object} params
 * @param {string} params.slug - Restaurant slug from URL
 * @param {string} params.cartId - UUID from localStorage (cart:{slug})
 * @param {string} params.customerPhone - 10-digit Indian mobile (required)
 * @param {string} [params.customerName] - Optional
 * @param {string} [params.customerEmail] - Optional
 */
export const buildCheckoutPayload = ({
  slug,
  cartId,
  customerPhone,
  customerName,
  customerEmail,
}) => {
  const payload = {
    slug,
    cartId,
    customerPhone,
  };

  const trimmedName = customerName?.trim();
  const trimmedEmail = customerEmail?.trim();

  if (trimmedName) {
    payload.customerName = trimmedName;
  }
  if (trimmedEmail) {
    payload.customerEmail = trimmedEmail;
  }

  return payload;
};

export const checkoutOrder = async (params) => {
  const { data } = await restaurantClient.post(
    "/user/orders/checkout",
    buildCheckoutPayload(params)
  );
  return data;
};

export const getOrder = async (orderId) => {
  const { data } = await restaurantClient.get(`/user/orders/${orderId}`);
  return data;
};

export const syncOrderPayment = async (orderId) => {
  const { data } = await restaurantClient.post("/user/orders/sync-payment", {
    orderId,
  });
  return data;
};

export const lookupOrdersByPhone = async (customerPhone) => {
  const { data } = await restaurantClient.post("/user/orders/lookup", {
    customerPhone,
  });
  return data;
};

export const retryOrderPayment = async (orderId) => {
  const { data } = await restaurantClient.post(
    `/user/orders/${orderId}/retry-payment`
  );
  return data;
};
