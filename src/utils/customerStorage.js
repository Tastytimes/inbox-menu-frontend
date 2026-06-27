const customerKey = (slug) => `customer:${slug}`;
const LAST_PHONE_KEY = "lastCustomerPhone";
const LAST_RESTAURANT_SLUG_KEY = "lastRestaurantSlug";

export const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone);

export const setLastCustomerPhone = (phone) => {
  try {
    if (phone) {
      sessionStorage.setItem(LAST_PHONE_KEY, phone);
    }
  } catch {
    /* ignore */
  }
};

export const getLastCustomerPhone = () => {
  try {
    return sessionStorage.getItem(LAST_PHONE_KEY);
  } catch {
    return null;
  }
};

export const setLastRestaurantSlug = (slug) => {
  try {
    if (slug) {
      sessionStorage.setItem(LAST_RESTAURANT_SLUG_KEY, slug);
    }
  } catch {
    /* ignore */
  }
};

export const getLastRestaurantSlug = () => {
  try {
    return sessionStorage.getItem(LAST_RESTAURANT_SLUG_KEY);
  } catch {
    return null;
  }
};

export const getStoredCustomer = (slug) => {
  try {
    const raw = sessionStorage.getItem(customerKey(slug));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredCustomer = (slug, customer) => {
  try {
    sessionStorage.setItem(customerKey(slug), JSON.stringify(customer));
  } catch {
    /* ignore */
  }
};

export const clearStoredCustomer = (slug) => {
  try {
    sessionStorage.removeItem(customerKey(slug));
  } catch {
    /* ignore */
  }
};

export const hasValidStoredCustomer = (slug) => {
  const customer = getStoredCustomer(slug);
  return customer && isValidPhone(customer.customerPhone);
};
