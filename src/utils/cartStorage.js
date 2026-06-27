const cartKey = (slug) => `cart:${slug}`;

export const getStoredCartId = (slug) => {
  try {
    return localStorage.getItem(cartKey(slug));
  } catch {
    return null;
  }
};

export const setStoredCartId = (slug, cartId) => {
  try {
    if (cartId) {
      localStorage.setItem(cartKey(slug), cartId);
    } else {
      localStorage.removeItem(cartKey(slug));
    }
  } catch {
    /* ignore */
  }
};
