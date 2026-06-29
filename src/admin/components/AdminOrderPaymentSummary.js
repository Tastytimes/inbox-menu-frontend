import React from "react";
import { formatAdminAmount } from "../utils/adminFormatters";

const SummaryLine = ({ label, amount, muted, highlight, strong }) => (
  <div
    className={`admin-payment-summary__line${
      muted ? " admin-payment-summary__line--muted" : ""
    }${highlight ? " admin-payment-summary__line--highlight" : ""}${
      strong ? " admin-payment-summary__line--strong" : ""
    }`}
  >
    <span>{label}</span>
    <span>{formatAdminAmount(amount)}</span>
  </div>
);

const extraChargeLabel = (charge) => {
  const name = charge?.name || "Charge";
  if (charge?.chargeType === "percentage" && charge?.value != null) {
    return `${name} (${charge.value}%)`;
  }
  return name;
};

const AdminOrderPaymentSummary = ({ order }) => {
  const summary = order?.summary;
  const pricing = order?.pricing;

  const foodsSubtotal = summary?.foodsSubtotal ?? summary?.foodSubtotal;
  const parcelSubtotal = summary?.parcelSubtotal ?? 0;
  const subtotal = summary?.subtotal;
  const extraCharges = summary?.extraCharges ?? [];
  const grandTotal = summary?.grandTotal ?? pricing?.billTotal;
  const billTotal = pricing?.billTotal ?? grandTotal;
  const customerPayAmount = pricing?.customerPayAmount ?? order?.customerPayAmount;
  const platformFeeAmount = pricing?.platformFeeAmount;
  const platformFeePercent = pricing?.platformFeePercent;
  const restaurantShare = pricing?.restaurantShareAmount ?? billTotal;

  const hasBillBreakdown =
    foodsSubtotal != null ||
    parcelSubtotal > 0 ||
    extraCharges.length > 0 ||
    grandTotal != null ||
    billTotal != null;

  const hasSettlement =
    customerPayAmount != null ||
    platformFeeAmount != null ||
    restaurantShare != null;

  if (!hasBillBreakdown && !hasSettlement) {
    return (
      <p className="admin-card__hint">No payment breakdown available for this order.</p>
    );
  }

  const showSubtotalLine =
    parcelSubtotal > 0 || extraCharges.length > 0 || summary?.extraChargesTotal != null;

  return (
    <div className="admin-payment-summary">
      {hasBillBreakdown && (
        <div className="admin-payment-summary__block">
          <p className="admin-payment-summary__heading">Bill breakdown</p>
          <div className="admin-payment-summary__card">
            {foodsSubtotal != null && (
              <SummaryLine label="Food total" amount={foodsSubtotal} />
            )}
            {parcelSubtotal > 0 && (
              <SummaryLine label="Packaging (takeaway)" amount={parcelSubtotal} muted />
            )}
            {showSubtotalLine && subtotal != null && (
              <SummaryLine label="Subtotal" amount={subtotal} />
            )}
            {extraCharges.length > 0 ? (
              extraCharges.map((charge) => (
                <SummaryLine
                  key={charge.id ?? charge.name}
                  label={extraChargeLabel(charge)}
                  amount={charge.amount}
                  muted
                />
              ))
            ) : summary?.extraChargesTotal != null && summary.extraChargesTotal > 0 ? (
              <SummaryLine label="Taxes & charges" amount={summary.extraChargesTotal} muted />
            ) : null}
            {grandTotal != null && (
              <>
                <div className="admin-payment-summary__divider" />
                <SummaryLine label="Bill total" amount={grandTotal} strong />
              </>
            )}
          </div>
        </div>
      )}

      {hasSettlement && (
        <div className="admin-payment-summary__block">
          <p className="admin-payment-summary__heading">Settlement</p>
          <div className="admin-payment-summary__card">
            {restaurantShare != null && (
              <SummaryLine label="Restaurant share" amount={restaurantShare} />
            )}
            {platformFeeAmount != null && (
              <SummaryLine
                label={
                  platformFeePercent != null
                    ? `Platform fee (${platformFeePercent}%)`
                    : "Platform fee"
                }
                amount={platformFeeAmount}
                muted
              />
            )}
            {customerPayAmount != null && (
              <>
                <div className="admin-payment-summary__divider admin-payment-summary__divider--strong" />
                <SummaryLine label="Customer paid" amount={customerPayAmount} highlight />
              </>
            )}
            {billTotal != null &&
              customerPayAmount != null &&
              Number(billTotal) !== Number(customerPayAmount) && (
                <p className="admin-payment-summary__note">
                  Bill total {formatAdminAmount(billTotal)} + platform fee{" "}
                  {formatAdminAmount(platformFeeAmount)} = customer paid{" "}
                  {formatAdminAmount(customerPayAmount)}
                </p>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderPaymentSummary;
