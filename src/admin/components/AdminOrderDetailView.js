import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  downloadOrderInvoice,
  getRefundCandidate,
  getSupportOrder,
} from "../api/adminApi";
import AdminStatusBadge from "./AdminStatusBadge";
import AdminOrderPaymentSummary from "./AdminOrderPaymentSummary";
import AdminRefundPanel from "./AdminRefundPanel";
import {
  formatAdminAmount,
  formatAdminTime,
  formatOrderLabel,
} from "../utils/adminFormatters";
import { getFulfillmentLabel } from "../../utils/fulfillmentStatus";
import {
  getOrderGatewayDetails,
  getPaymentStatusLabel,
  mergeOrderPaymentDetails,
  resolvePaymentStatus,
} from "../utils/orderPaymentHelpers";
import { adminRoutes } from "../../utils/routes";

const DetailRow = ({ label, value, children }) => (
  <div className="admin-detail-row">
    <span>{label}</span>
    {children ?? <strong>{value ?? "—"}</strong>}
  </div>
);

const isRequestCancelled = (err) =>
  axios.isCancel(err) || err?.code === "ERR_CANCELED" || err?.name === "CanceledError";

const AdminOrderDetailView = ({
  orderId,
  onClose,
  onRefunded,
  layout = "modal",
}) => {
  const [order, setOrder] = useState(null);
  const [refundInfo, setRefundInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [error, setError] = useState("");

  const loadOrder = useCallback(
    async (syncPayment = false, { signal } = {}) => {
      if (!orderId) return;
      if (syncPayment) setSyncing(true);
      else setLoading(true);
      setError("");
      try {
        const data = await getSupportOrder(orderId, { signal });
        setOrder(data);
        return data;
      } catch (err) {
        if (isRequestCancelled(err)) return;
        setError(err.response?.data?.message || "Could not load order details.");
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setSyncing(false);
        }
      }
    },
    [orderId]
  );

  const applyRefundData = useCallback((data) => {
    setRefundInfo(data);
  }, []);

  useEffect(() => {
    if (!orderId) return;

    const controller = new AbortController();
    let cancelled = false;

    setOrder(null);
    setRefundInfo(null);
    setLoading(true);
    setError("");

    const load = async () => {
      const signal = controller.signal;
      const [orderResult, refundResult] = await Promise.allSettled([
        getSupportOrder(orderId, { signal }),
        getRefundCandidate(orderId, { signal }),
      ]);

      if (cancelled || signal.aborted) return;

      if (orderResult.status === "fulfilled") {
        setOrder(orderResult.value);
      } else if (refundResult.status === "fulfilled") {
        const refund = refundResult.value;
        setOrder(refund?.order ?? refund);
      } else if (!isRequestCancelled(orderResult.reason)) {
        const err = orderResult.reason;
        setError(err.response?.data?.message || "Could not load order details.");
      }

      if (refundResult.status === "fulfilled") {
        applyRefundData(refundResult.value);
      } else if (!isRequestCancelled(refundResult.reason)) {
        setRefundInfo(null);
      }

      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [orderId, applyRefundData]);

  const refreshOrder = useCallback(
    async (syncPayment = false) => {
      await loadOrder(syncPayment);
      try {
        const refund = await getRefundCandidate(orderId);
        applyRefundData(refund);
      } catch {
        // Refund detail may not exist for every order.
      }
    },
    [loadOrder, orderId, applyRefundData]
  );

  const displayOrder = useMemo(
    () => mergeOrderPaymentDetails(order, refundInfo),
    [order, refundInfo]
  );

  const gatewayDetails = useMemo(
    () => getOrderGatewayDetails(displayOrder),
    [displayOrder]
  );

  const isPaid = displayOrder ? resolvePaymentStatus(displayOrder) === "paid" : false;

  const handleDownloadInvoice = async () => {
    if (!orderId || !isPaid) return;
    setInvoiceLoading(true);
    setError("");
    try {
      const { blob, filename } = await downloadOrderInvoice(orderId);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Could not download invoice.");
    } finally {
      setInvoiceLoading(false);
    }
  };

  if (!orderId) return null;

  const wrapperClass =
    layout === "page" ? "admin-order-detail-page" : "admin-order-detail-modal__body";

  return (
    <div className={wrapperClass}>
      <div className="admin-order-detail__header">
        <div>
          <p className="admin-card__hint">Order detail</p>
          <h2 className="admin-order-detail__title">
            {displayOrder ? formatOrderLabel(displayOrder) : "Loading…"}
          </h2>
          {displayOrder && (
            <div className="admin-order-detail__badges">
              <AdminStatusBadge
                status={resolvePaymentStatus(displayOrder)}
                label={getPaymentStatusLabel(displayOrder)}
              />
              <AdminStatusBadge
                status={displayOrder.fulfillmentStatus}
                label={getFulfillmentLabel(displayOrder.fulfillmentStatus)}
              />
            </div>
          )}
        </div>
        <div className="admin-action-row">
          <button
            type="button"
            className="admin-btn admin-btn--ghost admin-btn--small"
            onClick={() => loadOrder(true)}
            disabled={syncing || loading}
          >
            {syncing ? "Syncing…" : "Sync payment"}
          </button>
          {isPaid && (
            <button
              type="button"
              className="admin-btn admin-btn--ghost admin-btn--small"
              onClick={handleDownloadInvoice}
              disabled={invoiceLoading || loading}
            >
              {invoiceLoading ? "Downloading…" : "Download invoice"}
            </button>
          )}
          {layout === "modal" && (
            <Link
              to={adminRoutes.orderDetail(orderId)}
              className="admin-btn admin-btn--ghost admin-btn--small"
            >
              Full page
            </Link>
          )}
          {onClose && (
            <button type="button" className="admin-btn admin-btn--ghost admin-btn--small" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading && !order ? (
        <p className="admin-empty">Loading order…</p>
      ) : displayOrder ? (
        <>
          <div className="admin-order-detail__stats">
            <div className="admin-payments-metric">
              <span className="admin-payments-metric__label">Customer paid</span>
              <span className="admin-payments-metric__value">
                {formatAdminAmount(
                  displayOrder.pricing?.customerPayAmount ?? displayOrder.customerPayAmount
                )}
              </span>
            </div>
            <div className="admin-payments-metric">
              <span className="admin-payments-metric__label">Restaurant share</span>
              <span className="admin-payments-metric__value">
                {formatAdminAmount(
                  displayOrder.pricing?.restaurantShareAmount ??
                    displayOrder.pricing?.billTotal ??
                    displayOrder.summary?.grandTotal
                )}
              </span>
            </div>
            <div className="admin-payments-metric">
              <span className="admin-payments-metric__label">Platform fee</span>
              <span className="admin-payments-metric__value">
                {displayOrder.pricing?.platformFeePercent != null
                  ? `${formatAdminAmount(displayOrder.pricing.platformFeeAmount)} (${displayOrder.pricing.platformFeePercent}%)`
                  : formatAdminAmount(displayOrder.pricing?.platformFeeAmount)}
              </span>
            </div>
          </div>

          <section className="admin-card admin-section">
            <h3 className="admin-section__title">Order info</h3>
            <div className="admin-detail-grid">
              <DetailRow label="Order ID">
                <strong className="admin-detail-mono">{displayOrder.orderId}</strong>
              </DetailRow>
              <DetailRow label="Reference" value={displayOrder.orderReference} />
              <DetailRow label="Order no" value={displayOrder.orderNo} />
              <DetailRow
                label="Restaurant"
                value={`${displayOrder.slug || "—"} · client ${displayOrder.clientId ?? "—"}`}
              />
              <DetailRow label="Customer name" value={displayOrder.customerName || "Guest"} />
              <DetailRow label="Customer phone" value={displayOrder.customerPhone} />
              <DetailRow label="Table" value={displayOrder.tableNo} />
              <DetailRow label="Business type" value={displayOrder.businessType} />
              <DetailRow label="Created" value={formatAdminTime(displayOrder.createdAt)} />
              <DetailRow label="Updated" value={formatAdminTime(displayOrder.updatedAt)} />
            </div>
          </section>

          <section className="admin-card admin-section">
            <h3 className="admin-section__title">Payment</h3>

            <AdminOrderPaymentSummary order={displayOrder} />

            <div className="admin-payment-summary__gateway">
              <p className="admin-payment-summary__heading">Gateway & status</p>
              {gatewayDetails.length ? (
                <div className="admin-detail-grid">
                  {gatewayDetails.map((row) => (
                    <DetailRow key={row.label} label={row.label}>
                      {row.type === "badge" ? (
                        <AdminStatusBadge status={row.value} label={row.labelText || row.value} />
                      ) : row.type === "mono" ? (
                        <strong className="admin-detail-mono">{row.value}</strong>
                      ) : (
                        <strong>{row.value}</strong>
                      )}
                    </DetailRow>
                  ))}
                  {displayOrder.refundAmount != null && (
                    <DetailRow
                      label="Refunded amount"
                      value={formatAdminAmount(displayOrder.refundAmount)}
                    />
                  )}
                  {displayOrder.refundedAt && (
                    <DetailRow
                      label="Refunded at"
                      value={formatAdminTime(displayOrder.refundedAt)}
                    />
                  )}
                  {displayOrder.refundNote && (
                    <DetailRow label="Refund note" value={displayOrder.refundNote} />
                  )}
                </div>
              ) : (
                <p className="admin-card__hint">No gateway payment details available.</p>
              )}
            </div>

            {displayOrder.paymentFailureReason && (
              <div className="admin-error" style={{ marginTop: "0.75rem" }}>
                {displayOrder.paymentFailureReason}
              </div>
            )}
            {displayOrder.payuPaymentMessage && (
              <p className="admin-card__hint" style={{ marginTop: "0.75rem" }}>
                PayU: {displayOrder.payuPaymentMessage}
              </p>
            )}
            {displayOrder.cashfreePaymentMessage && (
              <p className="admin-card__hint" style={{ marginTop: "0.75rem" }}>
                Cashfree: {displayOrder.cashfreePaymentMessage}
              </p>
            )}
          </section>

          {displayOrder.items?.length > 0 && (
            <section className="admin-card admin-section">
              <h3 className="admin-section__title">Items ({displayOrder.items.length})</h3>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayOrder.items.map((item, index) => (
                      <tr key={item.foodId ?? item.id ?? index}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{formatAdminAmount(item.price ?? item.unitPrice)}</td>
                        <td>{formatAdminAmount(item.lineTotal ?? item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <AdminRefundPanel
            orderId={orderId}
            order={displayOrder}
            initialRefundInfo={refundInfo}
            onRefunded={onRefunded}
            onOrderRefresh={refreshOrder}
            onRefundInfoUpdate={applyRefundData}
          />
        </>
      ) : null}
    </div>
  );
};

export default AdminOrderDetailView;
