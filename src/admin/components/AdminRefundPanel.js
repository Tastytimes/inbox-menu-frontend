import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  getRefundCandidate,
  getRefundStatus,
  processRefund,
} from "../api/adminApi";
import AdminStatusBadge from "./AdminStatusBadge";
import { formatAdminAmount, formatAdminTime, formatOrderLabel } from "../utils/adminFormatters";
import { getRefundReasonLabel } from "../utils/subscriptionAdminHelpers";
import {
  getDefaultRefundAmount,
  getPaymentProviderLabel,
  getRefundStatusLabel,
  hasRefundStarted,
  isRefundComplete,
  isRefundFailed,
  isRefundFailedStatus,
  mergeRefundSnapshot,
  normalizeRefundStatusResponse,
  resolveGatewayRefundStatus,
  resolveRefundProvider,
} from "../utils/refundHelpers";

const REFUND_STEPS = [
  { id: "list", label: "List eligible", step: 1 },
  { id: "detail", label: "View detail", step: 2 },
  { id: "initiate", label: "Initiate refund", step: 3 },
  { id: "status", label: "Check status", step: 4 },
];

const DetailRow = ({ label, value, children }) => (
  <div className="admin-detail-row">
    <span>{label}</span>
    {children ?? <strong>{value ?? "—"}</strong>}
  </div>
);

const AdminRefundPanel = ({
  orderId,
  order,
  initialRefundInfo = null,
  compact = false,
  autoCheckOnMount = false,
  onRefunded,
  onOrderRefresh,
  onRefundInfoUpdate,
}) => {
  const [refundInfo, setRefundInfo] = useState(initialRefundInfo);
  const [refundStatusData, setRefundStatusData] = useState(null);
  const [refundForm, setRefundForm] = useState({ refundNote: "", refundAmount: "" });
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [statusCheckedAt, setStatusCheckedAt] = useState(null);

  useEffect(() => {
    setRefundInfo(initialRefundInfo);
    setRefundStatusData(null);
    setShowRefundForm(false);
    setError("");
    setSuccessMessage("");
    setStatusCheckedAt(null);
    setRefundForm({
      refundNote: "",
      refundAmount: getDefaultRefundAmount(order, initialRefundInfo),
    });
  }, [orderId, initialRefundInfo, order]);

  const refundSnapshot = useMemo(
    () => mergeRefundSnapshot(refundInfo, order, refundStatusData),
    [refundInfo, refundStatusData, order]
  );

  const paymentProvider = resolveRefundProvider(refundSnapshot) ?? resolveRefundProvider(order);
  const gatewayLabel = getPaymentProviderLabel(paymentProvider);

  const displayStatus =
    refundSnapshot.currentStatus ??
    refundSnapshot.payuRefundStatus ??
    refundSnapshot.cashfreeRefundStatus ??
    refundSnapshot.refundStatus;

  const gatewayRefundStatus = resolveGatewayRefundStatus(refundSnapshot);

  const isRefunded = isRefundComplete(displayStatus);
  const refundFailed =
    isRefundFailed(refundSnapshot) ||
    isRefundFailedStatus(displayStatus) ||
    isRefundFailedStatus(gatewayRefundStatus);
  const refundStarted = hasRefundStarted(refundSnapshot);

  const canRefund =
    !isRefunded &&
    (!refundStarted || refundFailed) &&
    (refundInfo ||
      ["paid", "PAID", "success", "SUCCESS"].includes(String(order?.paymentStatus || "")));

  const openRefundForm = useCallback(() => {
    setRefundForm({
      refundNote: refundSnapshot.refundNote || "",
      refundAmount:
        refundSnapshot.refundAmount != null
          ? String(refundSnapshot.refundAmount)
          : getDefaultRefundAmount(order, refundInfo),
    });
    setShowRefundForm(true);
    setError("");
    setSuccessMessage("");
  }, [refundSnapshot.refundNote, refundSnapshot.refundAmount, order, refundInfo]);

  const activeStep = useMemo(() => {
    if (isRefunded || refundStarted) return "status";
    if (showRefundForm) return "initiate";
    if (refundInfo) return "detail";
    return "list";
  }, [isRefunded, refundStarted, showRefundForm, refundInfo]);

  const loadRefundDetail = useCallback(async () => {
    if (!orderId) return;
    setLoadingDetail(true);
    setError("");
    try {
      const data = await getRefundCandidate(orderId);
      setRefundInfo(data);
      setRefundForm((current) => ({
        ...current,
        refundAmount: getDefaultRefundAmount(order, data) || current.refundAmount,
      }));
      setSuccessMessage(`Refund detail refreshed from ${gatewayLabel}.`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load refund detail.");
    } finally {
      setLoadingDetail(false);
    }
  }, [orderId, order, gatewayLabel]);

  const handleCheckStatus = useCallback(async () => {
    if (!orderId) return;
    setCheckingStatus(true);
    setError("");
    setSuccessMessage("");
    try {
      const data = await getRefundStatus(orderId);
      const normalized = normalizeRefundStatusResponse(data);
      setRefundStatusData(normalized);
      setStatusCheckedAt(new Date().toISOString());
      setSuccessMessage(data.message || `Refund status synced from ${gatewayLabel}.`);
      onRefundInfoUpdate?.(
        normalized?.order
          ? { ...normalized, ...normalized.order }
          : normalized
      );
      if (isRefundComplete(normalized?.refundStatus)) {
        onRefunded?.();
      }
      onOrderRefresh?.(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not check refund status.");
    } finally {
      setCheckingStatus(false);
    }
  }, [orderId, onOrderRefresh, onRefunded, onRefundInfoUpdate, gatewayLabel]);

  useEffect(() => {
    if (!autoCheckOnMount || !orderId) return;
    handleCheckStatus();
  }, [autoCheckOnMount, orderId, handleCheckStatus]);

  const handleRefund = async (event) => {
    event.preventDefault();
    setRefunding(true);
    setError("");
    setSuccessMessage("");
    try {
      await processRefund(orderId, {
        refundNote: refundForm.refundNote.trim(),
        refundAmount: Number(refundForm.refundAmount),
      });
      setSuccessMessage(
        refundFailed
          ? `Refund retry initiated. Checking status with ${gatewayLabel}…`
          : `Refund initiated. Checking status with ${gatewayLabel}…`
      );
      setShowRefundForm(false);
      await loadRefundDetail();
      await handleCheckStatus();
      onRefunded?.();
    } catch (err) {
      setError(err.response?.data?.message || "Could not process refund.");
    } finally {
      setRefunding(false);
    }
  };

  const showStatusPanel = refundStarted || refundStatusData || isRefunded || statusCheckedAt;

  return (
    <section className={`admin-card admin-section admin-order-detail__refund${compact ? " admin-refund-panel--compact" : ""}`}>
      <div className="admin-section-header">
        <h3 className="admin-section__title">
          Refund lifecycle
          {paymentProvider && (
            <span className="admin-card__hint" style={{ marginLeft: "0.5rem" }}>
              via {gatewayLabel}
            </span>
          )}
        </h3>
        <div className="admin-action-row">
          {!compact && refundInfo && (
            <button
              type="button"
              className="admin-btn admin-btn--ghost admin-btn--small"
              onClick={loadRefundDetail}
              disabled={loadingDetail}
            >
              {loadingDetail ? "Refreshing…" : "Refresh detail"}
            </button>
          )}
          <button
            type="button"
            className="admin-btn admin-btn--ghost admin-btn--small"
            onClick={handleCheckStatus}
            disabled={checkingStatus}
          >
            {checkingStatus ? "Checking…" : "Check refund status"}
          </button>
          {canRefund && !showRefundForm && (
            <button
              type="button"
              className="admin-btn admin-btn--primary admin-btn--small"
              onClick={openRefundForm}
            >
              {refundFailed ? "Initiate refund again" : "Initiate refund"}
            </button>
          )}
        </div>
      </div>

      <ol className="admin-refund-lifecycle">
        {REFUND_STEPS.map((step) => {
          const stepIndex = REFUND_STEPS.findIndex((item) => item.id === activeStep);
          const currentIndex = REFUND_STEPS.findIndex((item) => item.id === step.id);
          const isDone = currentIndex < stepIndex || (step.id === "status" && isRefunded);
          const isActive = step.id === activeStep;
          return (
            <li
              key={step.id}
              className={`admin-refund-lifecycle__step${
                isDone ? " admin-refund-lifecycle__step--done" : ""
              }${isActive ? " admin-refund-lifecycle__step--active" : ""}`}
            >
              <span className="admin-refund-lifecycle__num">{step.step}</span>
              <span>{step.label}</span>
            </li>
          );
        })}
      </ol>

      {error && <div className="admin-error">{error}</div>}
      {successMessage && <div className="admin-success">{successMessage}</div>}

      {refundInfo?.refundReason && (
        <p className="admin-card__hint">
          Eligible reason: {getRefundReasonLabel(refundInfo.refundReason || refundInfo.reason)}
        </p>
      )}

      {isRefunded && (
        <p className="admin-success" style={{ marginBottom: "0.75rem" }}>
          Refund completed for {formatOrderLabel(order)}.
        </p>
      )}

      {showRefundForm && canRefund && (
        <form onSubmit={handleRefund} className="admin-refund-form">
          {refundFailed && (
            <p className="admin-card__hint" style={{ marginBottom: "0.75rem" }}>
              Previous refund attempt failed
              {refundSnapshot.payuRefundMessage
                ? `: ${refundSnapshot.payuRefundMessage}`
                : "."}{" "}
              Submit again to retry with {gatewayLabel}.
            </p>
          )}
          <div className="admin-field">
            <label htmlFor={`refundAmount-${orderId}`}>Refund amount (₹)</label>
            <input
              id={`refundAmount-${orderId}`}
              type="number"
              min="0"
              step="0.01"
              value={refundForm.refundAmount}
              onChange={(event) =>
                setRefundForm({ ...refundForm, refundAmount: event.target.value })
              }
              required
            />
          </div>
          <div className="admin-field">
            <label htmlFor={`refundNote-${orderId}`}>Refund note</label>
            <textarea
              id={`refundNote-${orderId}`}
              rows={3}
              value={refundForm.refundNote}
              onChange={(event) =>
                setRefundForm({ ...refundForm, refundNote: event.target.value })
              }
              placeholder="Network disconnect — payment taken but order not confirmed"
              required
            />
          </div>
          <div className="admin-action-row">
            <button type="submit" className="admin-btn admin-btn--primary" disabled={refunding}>
              {refunding
                ? "Initiating…"
                : refundFailed
                  ? "Retry refund"
                  : "Confirm refund"}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={() => setShowRefundForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {showStatusPanel && (
        <div className="admin-refund-status-panel">
          <p className="admin-payment-summary__heading">Refund status</p>
          {refundSnapshot.message && (
            <p className="admin-success" style={{ marginBottom: "0.75rem" }}>
              {refundSnapshot.message}
            </p>
          )}
          <div className="admin-detail-grid">
            <DetailRow label="Current status">
              <AdminStatusBadge
                status={displayStatus}
                label={getRefundStatusLabel(displayStatus)}
              />
            </DetailRow>
            {refundSnapshot.previousStatus && (
              <DetailRow
                label="Previous status"
                value={getRefundStatusLabel(refundSnapshot.previousStatus)}
              />
            )}
            {gatewayRefundStatus && (
              <DetailRow label={`${gatewayLabel} status`}>
                <AdminStatusBadge
                  status={gatewayRefundStatus}
                  label={getRefundStatusLabel(gatewayRefundStatus)}
                />
              </DetailRow>
            )}
            {refundSnapshot.syncedFromGateway != null && (
              <DetailRow
                label={`Synced from ${gatewayLabel}`}
                value={refundSnapshot.syncedFromGateway ? "Yes" : "No"}
              />
            )}
            {refundSnapshot.refundAmount != null && (
              <DetailRow
                label="Refund amount"
                value={formatAdminAmount(refundSnapshot.refundAmount)}
              />
            )}
            {refundSnapshot.payuRefundMessage && (
              <DetailRow label="PayU refund message">
                {refundSnapshot.payuRefundMessage}
              </DetailRow>
            )}
            {refundSnapshot.payuRefundId && (
              <DetailRow label="PayU refund request ID">
                <strong className="admin-detail-mono">{refundSnapshot.payuRefundId}</strong>
              </DetailRow>
            )}
            {refundSnapshot.cashfreeRefundId && (
              <DetailRow label="Cashfree refund ID">
                <strong className="admin-detail-mono">{refundSnapshot.cashfreeRefundId}</strong>
              </DetailRow>
            )}
            {refundSnapshot.payuPaymentId && (
              <DetailRow label="PayU payment ID">
                <strong className="admin-detail-mono">{refundSnapshot.payuPaymentId}</strong>
              </DetailRow>
            )}
            {refundSnapshot.cashfreePaymentId && (
              <DetailRow label="Cashfree payment ID">
                <strong className="admin-detail-mono">{refundSnapshot.cashfreePaymentId}</strong>
              </DetailRow>
            )}
            {refundSnapshot.refundedAt && (
              <DetailRow label="Refunded at" value={formatAdminTime(refundSnapshot.refundedAt)} />
            )}
            {refundSnapshot.refundNote && (
              <DetailRow label="Refund note" value={refundSnapshot.refundNote} />
            )}
            {statusCheckedAt && (
              <DetailRow label="Last checked" value={formatAdminTime(statusCheckedAt)} />
            )}
          </div>
          {refundFailed && !showRefundForm && canRefund && (
            <div className="admin-action-row" style={{ marginTop: "0.75rem" }}>
              <button
                type="button"
                className="admin-btn admin-btn--primary admin-btn--small"
                onClick={openRefundForm}
              >
                Initiate refund again
              </button>
            </div>
          )}
        </div>
      )}

      {!canRefund && !isRefunded && !refundStarted && !showRefundForm && (
        <p className="admin-card__hint">
          Refund is available for paid orders or orders flagged in the refund queue.
        </p>
      )}
    </section>
  );
};

export default AdminRefundPanel;
