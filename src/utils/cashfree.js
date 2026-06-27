const SDK_URL = "https://sdk.cashfree.com/js/v3/cashfree.js";

let sdkPromise = null;

const loadCashfreeSdk = () => {
  if (window.Cashfree) {
    return Promise.resolve();
  }
  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SDK_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Cashfree SDK"));
    document.body.appendChild(script);
  });

  return sdkPromise;
};

export const openCashfreeCheckout = async ({
  paymentSessionId,
  cashfreeEnvironment,
}) => {
  if (!paymentSessionId) {
    throw new Error("Missing payment session");
  }

  await loadCashfreeSdk();

  const mode =
    cashfreeEnvironment === "production" ? "production" : "sandbox";
  const cashfree = window.Cashfree({ mode });

  return cashfree.checkout({
    paymentSessionId,
    redirectTarget: "_self",
  });
};
