export const QR_BASE = "/qr";

export const routes = {
  home: "/",
  trackOrders: `${QR_BASE}/track-orders`,
  paymentStatus: `${QR_BASE}/payment/status`,
  restaurant: (slug) => `${QR_BASE}/${slug}`,
  checkoutContact: (slug) => `${QR_BASE}/${slug}/checkout/contact`,
  checkout: (slug) => `${QR_BASE}/${slug}/checkout`,
  paymentStatusForSlug: (slug) => `${QR_BASE}/${slug}/payment/status`,
};
