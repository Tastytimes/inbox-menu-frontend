const ADMIN_AUTH_KEY = "adminAuth";

export const getStoredAdminAuth = () => {
  try {
    const raw = localStorage.getItem(ADMIN_AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredAdminAuth = (auth) => {
  localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(auth));
};

export const clearStoredAdminAuth = () => {
  localStorage.removeItem(ADMIN_AUTH_KEY);
};
