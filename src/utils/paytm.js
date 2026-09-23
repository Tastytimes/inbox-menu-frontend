const loadPaytmScript = (scriptUrl) =>
  new Promise((resolve, reject) => {
    if (window.Paytm?.CheckoutJS) {
      resolve();
      return;
    }

    if (!scriptUrl) {
      reject(new Error("Missing Paytm checkout script"));
      return;
    }

    const existing = document.querySelector(`script[src="${scriptUrl}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Paytm checkout"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Paytm checkout"));
    document.body.appendChild(script);
  });

export const openPaytmCheckout = async (paytmCheckout) => {
  if (!paytmCheckout?.txnToken || !paytmCheckout?.orderId || !paytmCheckout?.mid) {
    throw new Error("Missing Paytm checkout details");
  }

  await loadPaytmScript(paytmCheckout.scriptUrl);

  if (!window.Paytm?.CheckoutJS) {
    throw new Error("Paytm checkout could not be loaded");
  }

  const config = {
    root: "",
    flow: "DEFAULT",
    data: {
      orderId: paytmCheckout.orderId,
      token: paytmCheckout.txnToken,
      tokenType: "TXN_TOKEN",
      amount: String(paytmCheckout.amount ?? ""),
    },
    merchant: {
      mid: paytmCheckout.mid,
      redirect: true,
    },
    handler: {
      notifyMerchant() {},
    },
  };

  const initAndInvoke = () =>
    window.Paytm.CheckoutJS.init(config).then(() => {
      window.Paytm.CheckoutJS.invoke();
    });

  if (typeof window.Paytm.CheckoutJS.onLoad === "function") {
    await new Promise((resolve, reject) => {
      window.Paytm.CheckoutJS.onLoad(() => {
        initAndInvoke().then(resolve).catch(reject);
      });
    });
    return;
  }

  await initAndInvoke();
};
