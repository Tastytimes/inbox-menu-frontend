import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listRefundCandidates } from "../api/adminApi";
import AdminStatusBadge from "../components/AdminStatusBadge";
import AdminOrderDetailModal from "../components/AdminOrderDetailModal";
import AdminRefundPanel from "../components/AdminRefundPanel";
import { getRefundReasonLabel } from "../utils/subscriptionAdminHelpers";
import {
  getRefundCandidateAmount,
  getRefundCandidateOrderId,
  getRefundStatusLabel,
  hasRefundStarted,
  normalizeRefundCandidates,
  resolveRefundStatus,
} from "../utils/refundHelpers";
import { formatAdminAmount, formatAdminTime, formatOrderLabel } from "../utils/adminFormatters";
import { adminRoutes } from "../../utils/routes";

const AdminRefundsPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [includeManual, setIncludeManual] = useState(false);
  const [includeRefunded, setIncludeRefunded] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [statusOrderId, setStatusOrderId] = useState(null);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listRefundCandidates({ includeManual, includeRefunded });
      setCandidates(normalizeRefundCandidates(response));
    } catch (err) {
      setError(err.response?.data?.message || "Could not load refund candidates.");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [includeManual, includeRefunded]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const statusCandidate = useMemo(
    () =>
      candidates.find((item) => getRefundCandidateOrderId(item) === statusOrderId) || null,
    [candidates, statusOrderId]
  );

  const statusOrder = statusCandidate?.order || statusCandidate;

  return (
    <>
      <header className="admin-header">
        <div>
          <h1>Refunds</h1>
          <p>
            Full refund lifecycle: list eligible → view detail → initiate refund → check status
            with Cashfree.
          </p>
        </div>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={loadCandidates}>
          Refresh
        </button>
      </header>

      <div className="admin-refund-flow-guide admin-card">
        <div className="admin-refund-flow-guide__step">
          <strong>1</strong> GET /candidates
        </div>
        <div className="admin-refund-flow-guide__step">
          <strong>2</strong> GET /candidates/:orderId
        </div>
        <div className="admin-refund-flow-guide__step">
          <strong>3</strong> POST /candidates/:orderId/refund
        </div>
        <div className="admin-refund-flow-guide__step">
          <strong>4</strong> GET /candidates/:orderId/status
        </div>
      </div>

      <div className="admin-filters">
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={includeManual}
            onChange={(event) => setIncludeManual(event.target.checked)}
          />
          Include manual admin
        </label>
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={includeRefunded}
            onChange={(event) => setIncludeRefunded(event.target.checked)}
          />
          Include already refunded
        </label>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <section className="admin-card admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section__title">Refund eligible ({candidates.length})</h2>
          <Link to={adminRoutes.payments} className="admin-btn admin-btn--ghost admin-btn--small">
            All orders
          </Link>
        </div>

        {loading ? (
          <p className="admin-empty">Loading refund candidates…</p>
        ) : !candidates.length ? (
          <p className="admin-empty">No refund-eligible orders right now.</p>
        ) : (
          <div className="admin-payments-order-list">
            {candidates.map((item) => {
              const orderId = getRefundCandidateOrderId(item);
              const order = item.order || item;
              const refundStarted = hasRefundStarted(item) || hasRefundStarted(order);
              return (
                <div
                  key={orderId}
                  className={`admin-refund-row${
                    selectedOrderId === orderId ? " admin-refund-row--selected" : ""
                  }${statusOrderId === orderId ? " admin-refund-row--status-open" : ""}`}
                >
                  <button
                    type="button"
                    className="admin-payments-order admin-payments-order--refund admin-refund-row__main"
                    onClick={() => setSelectedOrderId(orderId)}
                  >
                    <div className="admin-payments-order__main">
                      <div className="admin-payments-order__title">
                        <strong>{formatOrderLabel(order)}</strong>
                        <span className="admin-refund-badge">Refund eligible</span>
                        {refundStarted && (
                          <AdminStatusBadge
                            status={resolveRefundStatus(item) ?? resolveRefundStatus(order)}
                            label={getRefundStatusLabel(
                              resolveRefundStatus(item) ?? resolveRefundStatus(order)
                            )}
                          />
                        )}
                        <AdminStatusBadge
                          status={order.paymentStatus ?? item.paymentStatus}
                          label={order.paymentStatus ?? item.paymentStatus ?? "—"}
                        />
                      </div>
                      <div className="admin-payments-order__meta">
                        <span>{order.clientId ?? item.clientId ?? "—"}</span>
                        <span>{order.slug ?? item.slug ?? "—"}</span>
                        <span>{getRefundReasonLabel(item.refundReason || item.reason)}</span>
                      </div>
                    </div>
                    <div className="admin-payments-order__side">
                      <span className="admin-payments-order__amount">
                        {formatAdminAmount(getRefundCandidateAmount(item))}
                      </span>
                      <span className="admin-payments-order__time">
                        {formatAdminTime(order.createdAt ?? item.createdAt)}
                      </span>
                    </div>
                  </button>
                  <div className="admin-refund-row__actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost admin-btn--small"
                      onClick={() => {
                        setStatusOrderId(orderId);
                        setSelectedOrderId(null);
                      }}
                    >
                      Check status
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary admin-btn--small"
                      onClick={() => setSelectedOrderId(orderId)}
                    >
                      Open detail
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {statusOrderId && (
        <AdminRefundPanel
          key={statusOrderId}
          orderId={statusOrderId}
          order={statusOrder}
          initialRefundInfo={statusCandidate}
          compact
          autoCheckOnMount
          onRefunded={loadCandidates}
        />
      )}

      {selectedOrderId && (
        <AdminOrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onRefunded={loadCandidates}
        />
      )}
    </>
  );
};

export default AdminRefundsPage;
