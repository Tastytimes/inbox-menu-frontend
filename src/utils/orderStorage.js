const pendingKey = (slug) => `pendingOrder:${slug}`;
const GLOBAL_ORDER_ID = "pendingOrderId";
const GLOBAL_SLUG = "pendingOrderSlug";

export const setPendingOrderId = (slug, orderId) => {
  try {
    sessionStorage.setItem(pendingKey(slug), orderId);
    sessionStorage.setItem(GLOBAL_ORDER_ID, orderId);
    sessionStorage.setItem(GLOBAL_SLUG, slug);
  } catch {
    /* ignore */
  }
};

export const getPendingOrderId = (slug) => {
  try {
    return sessionStorage.getItem(pendingKey(slug));
  } catch {
    return null;
  }
};

export const getPendingOrderContext = () => {
  try {
    return {
      orderId: sessionStorage.getItem(GLOBAL_ORDER_ID),
      slug: sessionStorage.getItem(GLOBAL_SLUG),
    };
  } catch {
    return { orderId: null, slug: null };
  }
};

export const clearPendingOrderId = (slug) => {
  try {
    sessionStorage.removeItem(pendingKey(slug));
    sessionStorage.removeItem(GLOBAL_ORDER_ID);
    sessionStorage.removeItem(GLOBAL_SLUG);
  } catch {
    /* ignore */
  }
};
