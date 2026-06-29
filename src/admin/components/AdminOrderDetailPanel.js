import React, { useCallback, useEffect, useState } from "react";
import { getSupportOrder } from "../api/adminApi";
import AdminStatusBadge from "./AdminStatusBadge";
import {
  formatAdminAmount,
  formatAdminTime,
  formatOrderLabel,
} from "../utils/adminFormatters";
import { getFulfillmentLabel } from "../../utils/fulfillmentStatus";

const AdminOrderDetailPanel = ({ orderId, onClose }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  const loadOrder = useCallback(
    async (syncPayment = false) => {
      if (!orderId) return;
      if (syncPayment) {
        setSyncing(true);
      } else {
        setLoading(true);
      }
      setError("");
      try {
        const data = await getSupportOrder(orderId);
        setOrder(data);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load order details.");
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    },
    [orderId]
  );

  useEffect(() => {
    setOrder(null);
    loadOrder(false);
  }, [loadOrder, orderId]);

  if (!orderId) return null;

  return (
    <div className="admin-detail-panel">
      <div className="admin-detail-panel__header">
        <div>
          <h2 className="admin-detail-panel__title">
            {order ? formatOrderLabel(order) : "Order detail"}
          </h2>
          <p className="admin-card__hint">Payment sync via GET /admin/platform/support/orders/:orderId</p>
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
      ) : order ? (
        <>
          <div className="admin-detail-grid">
            <div className="admin-detail-row">
              <span>Order ID</span>
              <strong className="admin-detail-mono">{order.orderId}</strong>
            </div>
            <div className="admin-detail-row">
              <span>Reference</span>
              <strong>{order.orderReference || "—"}</strong>
            </div>
            <div className="admin-detail-row">
              <span>Restaurant</span>
              <strong>{order.slug || "—"} (client {order.clientId ?? "—"})</strong>
            </div>
            <div className="admin-detail-row">
              <span>Customer</span>
              <strong>
                {order.customerName || "Guest"} · {order.customerPhone || "—"}
              </strong>
            </div>
            <div className="admin-detail-row">
              <span>Payment</span>
              <AdminStatusBadge status={order.paymentStatus} label={order.paymentStatus} />
            </div>
            <div className="admin-detail-row">
              <span>Fulfillment</span>
              <AdminStatusBadge
                status={order.fulfillmentStatus}
                label={getFulfillmentLabel(order.fulfillmentStatus)}
              />
            </div>
            <div className="admin-detail-row">
              <span>Amount paid</span>
              <strong>{formatAdminAmount(order.pricing?.customerPayAmount)}</strong>
            </div>
            <div className="admin-detail-row">
              <span>Platform fee</span>
              <strong>{formatAdminAmount(order.pricing?.platformFeeAmount)}</strong>
            </div>
            <div className="admin-detail-row">
              <span>Bill total</span>
              <strong>{formatAdminAmount(order.pricing?.billTotal)}</strong>
            </div>
            <div className="admin-detail-row">
              <span>Created</span>
              <strong>{formatAdminTime(order.createdAt)}</strong>
            </div>
            {order.tableNo && (
              <div className="admin-detail-row">
                <span>Table</span>
                <strong>{order.tableNo}</strong>
              </div>
            )}
            {order.businessType && (
              <div className="admin-detail-row">
                <span>Type</span>
                <strong>{order.businessType}</strong>
              </div>
            )}
          </div>

          {order.paymentFailureReason && (
            <div className="admin-error" style={{ marginTop: "1rem" }}>
              {order.paymentFailureReason}
            </div>
          )}

          {order.cashfreePaymentMessage && (
            <p className="admin-card__hint" style={{ marginTop: "0.75rem" }}>
              Cashfree: {order.cashfreePaymentMessage}
            </p>
          )}

          {order.items?.length > 0 && (
            <section className="admin-section">
              <h3 className="admin-section__title">Items ({order.items.length})</h3>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.foodId}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{formatAdminAmount(item.lineTotal ?? item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      ) : null}
    </div>
  );
};

export default AdminOrderDetailPanel;
