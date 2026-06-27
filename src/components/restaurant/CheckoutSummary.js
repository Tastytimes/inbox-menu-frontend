import React from "react";
import { countOrderTypes } from "../../utils/parcelHelpers";

const formatAmount = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return "0";
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
};

const chargeLabel = (charge) => {
  if (charge.chargeType === "percentage") {
    return `${charge.name} (${charge.value}%)`;
  }
  return charge.name;
};

const SummaryRow = ({ label, amount, muted, highlight }) => (
  <div
    className={`checkout-summary__row ${muted ? "checkout-summary__row--muted" : ""} ${
      highlight ? "checkout-summary__row--highlight" : ""
    }`}
  >
    <span>{label}</span>
    <span>₹{formatAmount(amount)}</span>
  </div>
);

const CheckoutSummary = ({ summary, items = [], pricing }) => {
  if (!summary) return null;

  const {
    foodSubtotal = 0,
    parcelSubtotal = 0,
    subtotal = 0,
    extraCharges = [],
    grandTotal = 0,
  } = summary;

  const { takeaway, dineIn } = countOrderTypes(items);
  const hasParcelCharges = parcelSubtotal > 0;
  const hasExtraCharges = extraCharges.length > 0;
  const showSubtotalLine = hasParcelCharges || hasExtraCharges;
  const payAmount = pricing?.customerPayAmount ?? grandTotal;

  return (
    <section className="checkout-summary" aria-label="Bill summary">
      <h2 className="checkout-summary__heading">Bill summary</h2>

      <div className="checkout-summary__card">
        <div className="checkout-summary__order-flag">
          <span>Order mix</span>
          <span className="checkout-summary__mix-tags">
            {takeaway > 0 && (
              <span className="checkout-summary__parcel-tag checkout-summary__parcel-tag--yes">
                {takeaway} takeaway
              </span>
            )}
            {dineIn > 0 && (
              <span className="checkout-summary__parcel-tag checkout-summary__parcel-tag--no">
                {dineIn} dine in
              </span>
            )}
          </span>
        </div>

        <div className="checkout-summary__divider" />

        <SummaryRow label="Food total" amount={foodSubtotal} />

        {hasParcelCharges && (
          <SummaryRow label="Packaging (takeaway items)" amount={parcelSubtotal} muted />
        )}

        {showSubtotalLine && <SummaryRow label="Subtotal" amount={subtotal} />}

        {hasExtraCharges && (
          <>
            <div className="checkout-summary__divider" />
            {extraCharges.map((charge) => (
              <SummaryRow
                key={charge.id}
                label={chargeLabel(charge)}
                amount={charge.amount}
                muted
              />
            ))}
          </>
        )}

        {pricing && (
          <>
            <div className="checkout-summary__divider" />
            <SummaryRow
              label={`Platform fee (${pricing.platformFeePercent}%)`}
              amount={pricing.platformFeeAmount}
              muted
            />
          </>
        )}

        <div className="checkout-summary__divider checkout-summary__divider--strong" />
        <SummaryRow label="To pay" amount={payAmount} highlight />
      </div>
    </section>
  );
};

export default CheckoutSummary;
