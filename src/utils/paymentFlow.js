import { openCashfreeCheckout } from "./cashfree";
import { submitPayUCheckout } from "./payu";
import { openPaytmCheckout } from "./paytm";
import { setLastRestaurantSlug } from "./customerStorage";
import { setPendingOrderId } from "./orderStorage";

export const RETRYABLE_STATUSES = ["failed", "expired", "pending", "in_progress"];

export const canRetryPayment = (status) =>
  RETRYABLE_STATUSES.includes(String(status || "").toLowerCase());

export const getPaymentProviderLabel = (provider) => {
  switch (String(provider || "").toLowerCase()) {
    case "payu":
      return "PayU";
    case "paytm":
      return "Paytm";
    case "cashfree":
      return "Cashfree";
    default:
      return "Payment gateway";
  }
};

/**
 * Open checkout for Paytm, PayU, or Cashfree from checkout / retry-payment response.
 * Prefers the provider returned by the server so switching PAYMENT_PROVIDER stays in sync.
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
  const hasPaytmCheckout = Boolean(
    response.paytmCheckout?.txnToken &&
      response.paytmCheckout?.orderId &&
      response.paytmCheckout?.mid
  );
  const hasPayUCheckout =
    response.payuCheckout?.actionUrl && response.payuCheckout?.fields;

  if (hasPaytmCheckout || provider === "paytm") {
    if (!hasPaytmCheckout) {
      throw new Error(
        "Paytm checkout was not returned by the server. Check PAYMENT_PROVIDER=paytm and Paytm credentials on the backend."
      );
    }
    await openPaytmCheckout(response.paytmCheckout);
    return { redirected: true };
  }

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
