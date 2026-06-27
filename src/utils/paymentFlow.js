import { openCashfreeCheckout } from "./cashfree";
import { setLastRestaurantSlug } from "./customerStorage";
import { setPendingOrderId } from "./orderStorage";

export const RETRYABLE_STATUSES = ["failed", "expired", "pending", "in_progress"];

export const canRetryPayment = (status) =>
  RETRYABLE_STATUSES.includes(String(status || "").toLowerCase());

/**
 * Open Cashfree from checkout or retry-payment response.
 * Returns { redirected: true } if checkout opened, or { paid: true, order } if already paid.
 */
export const launchCashfreePayment = async (response) => {
  if (!response?.orderId) {
    throw new Error("Missing order id");
  }

  const slug = response.slug;
  if (slug) {
    setLastRestaurantSlug(slug);
  }
  setPendingOrderId(slug, response.orderId);

  if (response.paymentSessionId) {
    const result = await openCashfreeCheckout({
      paymentSessionId: response.paymentSessionId,
      cashfreeEnvironment: response.cashfreeEnvironment,
    });

    if (result?.error) {
      throw new Error(result.error.message || "Payment could not be started");
    }

    return { redirected: true };
  }

  if (response.paymentStatus === "paid") {
    return { paid: true, order: response };
  }

  throw new Error("No payment session available for this order");
};
