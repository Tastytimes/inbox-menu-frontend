export const QR_BASE = "/qr";
export const ADMIN_BASE = "/admin";

export const routes = {
  home: "/",
  about: "/about",
  contact: "/contact",
  terms: "/terms",
  privacy: "/privacy",
  refundPolicy: "/refund-policy",
  trackOrders: `${QR_BASE}/track-orders`,
  trackOrder: (token) => `/track/${token}`,
  paymentStatus: `${QR_BASE}/payment/status`,
  restaurant: (slug) => `${QR_BASE}/${slug}`,
  checkoutContact: (slug) => `${QR_BASE}/${slug}/checkout/contact`,
  checkout: (slug) => `${QR_BASE}/${slug}/checkout`,
  paymentStatusForSlug: (slug) => `${QR_BASE}/${slug}/payment/status`,
};

export const adminRoutes = {
  base: ADMIN_BASE,
  login: `${ADMIN_BASE}/login`,
  dashboard: `${ADMIN_BASE}/dashboard`,
  hotels: `${ADMIN_BASE}/hotels`,
  hotelDetail: (clientId) => `${ADMIN_BASE}/hotels/${clientId}`,
  payments: `${ADMIN_BASE}/payments`,
  support: `${ADMIN_BASE}/support`,
  subscriptionPlans: `${ADMIN_BASE}/subscription-plans`,
  subscriptions: `${ADMIN_BASE}/subscriptions`,
  refunds: `${ADMIN_BASE}/refunds`,
  orderDetail: (orderId) => `${ADMIN_BASE}/orders/${orderId}`,
  users: `${ADMIN_BASE}/users`,
};
