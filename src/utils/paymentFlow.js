import { openCashfreeCheckout } from "./cashfree";
import { submitPayUCheckout } from "./payu";
import { setLastRestaurantSlug } from "./customerStorage";
import { setPendingOrderId } from "./orderStorage";

export const RETRYABLE_STATUSES = ["failed", "expired", "pending", "in_progress"];

export const canRetryPayment = (status) =>
  RETRYABLE_STATUSES.includes(String(status || "").toLowerCase());

export const getPaymentProviderLabel = (provider) => {
  switch (String(provider || "").toLowerCase()) {
    case "payu":
      return "PayU";
    case "cashfree":
      return "Cashfree";
    default:
      return "Payment gateway";
  }
};

/**
 * Open checkout for PayU or Cashfree from checkout / retry-payment response.
 * Returns { redirected: true } if checkout opened, or { paid: true, order } if already paid.
 */
export const launchPayment = async (response) => {
  if (!response?.orderId) {
    throw new Error("Missing order id");
  }

  const slug = response.slug;
  if (slug) {
    setLastRestaurantSlug(slug);
  }
  setPendingOrderId(slug, response.orderId);

  const provider = String(response.paymentProvider || "").toLowerCase();
  const hasPayUCheckout =
    response.payuCheckout?.actionUrl && response.payuCheckout?.fields;

  if (hasPayUCheckout || provider === "payu") {
    if (!hasPayUCheckout) {
      throw new Error(
        "PayU checkout was not returned by the server. Check PAYMENT_PROVIDER=payu and PayU credentials on the backend."
      );
    }
    submitPayUCheckout(response.payuCheckout);
    return { redirected: true };
  }

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

export const launchCashfreePayment = launchPayment;
