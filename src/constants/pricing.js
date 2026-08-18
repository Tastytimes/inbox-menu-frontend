/** Public-facing currency and pricing — visible on marketing/legal pages for compliance. */
export const CURRENCY_CODE = "INR";
export const CURRENCY_SYMBOL = "₹";
export const CURRENCY_LABEL = "Indian Rupee (INR)";

export const formatInr = (amount) => {
  const num = Number(amount);
  if (!Number.isFinite(num)) return `${CURRENCY_SYMBOL}0`;
  const formatted = num.toLocaleString("en-IN", {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${CURRENCY_SYMBOL}${formatted}`;
};

/** Restaurant partner subscription starting price (INR/month), if configured. */
export const SUBSCRIPTION_FROM_INR =
  process.env.REACT_APP_SUBSCRIPTION_FROM_INR || "";

/** Optional platform fee description for restaurant partners. */
export const PLATFORM_FEE_DESCRIPTION =
  process.env.REACT_APP_PLATFORM_FEE_DESCRIPTION ||
  "A small platform fee may apply on customer orders as agreed with each restaurant partner.";

export const PRICING_HIGHLIGHTS = [
  {
    title: "Customer menu orders",
    description:
      "Food and beverage prices are set by each restaurant and displayed in INR (₹) on the QR menu before checkout. Applicable taxes are shown at payment.",
    example: "Example: Dosa ₹120 · Masala Dosa ₹150",
  },
  {
    title: "Takeaway packaging",
    description:
      "When takeaway is selected, packaging charges (if any) are shown in INR (₹) on the item and added to the order total at checkout.",
    example: "Example: +₹10 packaging per parcel item",
  },
  {
    title: "Online payments",
    description:
      "All payments are processed in INR through PayU. We accept UPI, debit/credit cards, and supported wallets.",
    example: "Currency: INR only",
  },
  {
    title: "Restaurant partner plans",
    description:
      SUBSCRIPTION_FROM_INR
        ? "Restaurant subscription plans for the Sambhramaa QR ordering platform are billed in INR (₹)."
        : "Restaurant partners subscribe to the platform; fees are quoted and billed in INR (₹). Contact us for current plan pricing.",
    example: SUBSCRIPTION_FROM_INR
      ? `Plans from ${formatInr(SUBSCRIPTION_FROM_INR)}/month`
      : "Contact support@sambhramaa.in for pricing",
  },
];
