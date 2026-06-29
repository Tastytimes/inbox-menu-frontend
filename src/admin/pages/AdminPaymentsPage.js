import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getPlatformPaymentsOverview, listRefundCandidates } from "../api/adminApi";
import AdminStatusBadge from "../components/AdminStatusBadge";
import AdminOrderDetailModal from "../components/AdminOrderDetailModal";
import {
  PAYMENTS_SCOPES,
  getOrderPayAmount,
  getPaymentsScopeOrders,
  getPaymentsScopeSummary,
  getSummaryCount,
} from "../utils/paymentsOverviewHelpers";
import {
  buildRefundCandidateIdSet,
  getRefundCandidateAmount,
  getRefundCandidateOrderId,
  normalizeRefundCandidates,
} from "../utils/refundHelpers";
import { getRefundReasonLabel } from "../utils/subscriptionAdminHelpers";
import { formatAdminAmount, formatAdminTime, formatOrderLabel } from "../utils/adminFormatters";
import { adminRoutes } from "../../utils/routes";

const PAYMENT_FILTERS = [
  { value: "", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refund_eligible", label: "Refund eligible" },
];

const PAYMENTS_POLL_MS = 30_000;

const formatLastUpdated = (date, _tick = 0) => {
  if (!date) return "—";
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const ScopeSnapshot = ({ label, summary, ordersCount, accent }) => {
  const paid = getSummaryCount(summary, "paidOrders", "paidOrderCount");
  const total = getSummaryCount(summary, "orderCount", "totalOrders");
  const gmv = getSummaryCount(summary, "gmv", "totalGmv");
  const failed = getSummaryCount(summary, "failedPayments");

  return (
    <div className={`admin-payments-snapshot admin-payments-snapshot--${accent}`}>
      <div className="admin-payments-snapshot__head">
        <span className="admin-payments-snapshot__label">{label}</span>
        <span className="admin-payments-snapshot__count">{ordersCount} orders listed</span>
      </div>
      <div className="admin-payments-snapshot__metrics">
        <div>
          <span className="admin-payments-snapshot__value">{total}</span>
          <span className="admin-payments-snapshot__meta">Total</span>
        </div>
        <div>
          <span className="admin-payments-snapshot__value">{paid}</span>
          <span className="admin-payments-snapshot__meta">Paid</span>
        </div>
        <div>
          <span className="admin-payments-snapshot__value">{formatAdminAmount(gmv)}</span>
          <span className="admin-payments-snapshot__meta">GMV</span>
        </div>
        {failed > 0 && (
          <div>
            <span className="admin-payments-snapshot__value admin-payments-snapshot__value--warn">
              {failed}
            </span>
            <span className="admin-payments-snapshot__meta">Failed</span>
          </div>
        )}
      </div>
    </div>
  );
};

const MetricTile = ({ label, value, hint }) => (
  <div className="admin-payments-metric">
    <span className="admin-payments-metric__label">{label}</span>
    <span className="admin-payments-metric__value">{value}</span>
    {hint && <span className="admin-payments-metric__hint">{hint}</span>}
  </div>
);

const AdminPaymentsPage = () => {
  const [data, setData] = useState(null);
  const [refundCandidates, setRefundCandidates] = useState([]);
  const [scope, setScope] = useState("today");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [liveTick, setLiveTick] = useState(0);
  const [error, setError] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const loadPayments = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    if (!silent) setError("");
    try {
      const [paymentsResponse, refundsResponse] = await Promise.all([
        getPlatformPaymentsOverview(),
        listRefundCandidates(),
      ]);
      setData(paymentsResponse);
      setRefundCandidates(normalizeRefundCandidates(refundsResponse));
      setLastUpdated(new Date());
    } catch (err) {
      if (!silent) {
        setError(err.response?.data?.message || "Could not load payments overview.");
      }
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    const poll = () => {
      if (document.hidden) return;
      loadPayments({ silent: true });
    };

    const intervalId = window.setInterval(poll, PAYMENTS_POLL_MS);
    return () => window.clearInterval(intervalId);
  }, [loadPayments]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        loadPayments({ silent: true });
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [loadPayments]);

  useEffect(() => {
    const tickId = window.setInterval(() => setLiveTick((tick) => tick + 1), 10_000);
    return () => window.clearInterval(tickId);
  }, []);

  useEffect(() => {
    setSelectedOrderId(null);
  }, [scope, paymentFilter]);

  const todaySummary = getPaymentsScopeSummary(data, "today");
  const overallSummary = getPaymentsScopeSummary(data, "overall");
  const todayOrders = getPaymentsScopeOrders(data, "today");
  const overallOrders = getPaymentsScopeOrders(data, "overall");
  const activeSummary = scope === "today" ? todaySummary : overallSummary;
  const activeOrders = scope === "today" ? todayOrders : overallOrders;
  const refundEligibleIds = useMemo(
    () => buildRefundCandidateIdSet(refundCandidates),
    [refundCandidates]
  );

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return activeOrders.filter((order) => {
      if (paymentFilter === "refund_eligible") return false;
      if (paymentFilter && String(order.paymentStatus || "").toLowerCase() !== paymentFilter) {
        return false;
      }
      if (!query) return true;
      const haystack = [
        order.orderId,
        order.orderNo,
        order.orderReference,
        order.slug,
        order.clientId,
        order.customerName,
        order.customerPhone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [activeOrders, paymentFilter, search]);

  const filteredRefundCandidates = useMemo(() => {
    if (paymentFilter !== "refund_eligible") return refundCandidates;
    const query = search.trim().toLowerCase();
    if (!query) return refundCandidates;
    return refundCandidates.filter((item) => {
      const order = item.order || item;
      const orderId = getRefundCandidateOrderId(item);
      const haystack = [
        orderId,
        order.orderNo,
        order.orderReference,
        order.slug,
        order.clientId,
        item.refundReason,
        item.reason,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [paymentFilter, refundCandidates, search]);

  const showingRefundEligible = paymentFilter === "refund_eligible";
  const listCount = showingRefundEligible ? filteredRefundCandidates.length : filteredOrders.length;

  const scopeLabel = PAYMENTS_SCOPES.find((item) => item.value === scope)?.label || scope;

  return (
    <div className="admin-payments-page">
      <header className="admin-header admin-payments-header">
        <div>
          <h1>Orders & payments</h1>
          <p>Track platform transactions, GMV, and payment health.</p>
        </div>
        <div className="admin-payments-header__actions">
          {data?.date && <span className="admin-payments-date">{data.date}</span>}
          <span
            className={`admin-payments-live${refreshing ? " admin-payments-live--syncing" : ""}`}
            title={`Auto-refreshes every ${PAYMENTS_POLL_MS / 1000}s while this tab is open`}
          >
            <span className="admin-payments-live__dot" aria-hidden="true" />
            Live · {formatLastUpdated(lastUpdated, liveTick)}
          </span>
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => loadPayments({ silent: Boolean(data) })}
            disabled={refreshing || loading}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-payments-loading">
          <div className="admin-payments-loading__bar" />
          <p>Loading payments overview…</p>
        </div>
      ) : (
        <>
          <div className="admin-payments-compare">
            <ScopeSnapshot
              label="Today"
              summary={todaySummary}
              ordersCount={todayOrders.length}
              accent="today"
            />
            <ScopeSnapshot
              label="All time"
              summary={overallSummary}
              ordersCount={overallOrders.length}
              accent="overall"
            />
          </div>

          <div className="admin-payments-toolbar">
            <div className="admin-payments-tabs">
              {PAYMENTS_SCOPES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`admin-payments-tab${
                    scope === item.value ? " admin-payments-tab--active" : ""
                  }`}
                  onClick={() => setScope(item.value)}
                >
                  {item.label}
                  <span className="admin-payments-tab__count">
                    {item.value === "today" ? todayOrders.length : overallOrders.length}
                  </span>
                </button>
              ))}
            </div>

            <div className="admin-payments-filters">
              <input
                type="search"
                className="admin-payments-search"
                placeholder="Search order, client, phone…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <div className="admin-payments-chips">
                {PAYMENT_FILTERS.map((filter) => (
                  <button
                    key={filter.value || "all"}
                    type="button"
                    className={`admin-payments-chip${
                      paymentFilter === filter.value ? " admin-payments-chip--active" : ""
                    }${filter.value === "refund_eligible" ? " admin-payments-chip--warn" : ""}`}
                    onClick={() => setPaymentFilter(filter.value)}
                  >
                    {filter.label}
                    {filter.value === "refund_eligible" && refundCandidates.length > 0 && (
                      <span className="admin-payments-chip__count">{refundCandidates.length}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="admin-payments-metrics">
            <MetricTile
              label="Platform fees"
              value={formatAdminAmount(
                getSummaryCount(activeSummary, "platformFees", "totalPlatformFees")
              )}
            />
            <MetricTile
              label="Refund eligible"
              value={refundCandidates.length}
              hint={
                refundCandidates.length > 0 ? (
                  <Link to={adminRoutes.refunds}>Review all →</Link>
                ) : (
                  "None pending"
                )
              }
            />
            <MetricTile
              label="Pending"
              value={getSummaryCount(activeSummary, "pendingPayments", "pendingOrders")}
              hint="Awaiting payment"
            />
            <MetricTile
              label="Failed"
              value={getSummaryCount(activeSummary, "failedPayments")}
              hint="Needs attention"
            />
          </div>

          {refundCandidates.length > 0 && paymentFilter !== "refund_eligible" && (
            <div className="admin-refund-alert">
              <div>
                <strong>{refundCandidates.length} refund-eligible order(s)</strong>
                <p>Paid orders that need a refund — payment mismatch or cancelled without refund.</p>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--primary admin-btn--small"
                onClick={() => setPaymentFilter("refund_eligible")}
              >
                View eligible
              </button>
            </div>
          )}

          <div className="admin-payments-orders-only">
            <section className="admin-card admin-payments-orders">
              <div className="admin-payments-orders__head">
                <h2>{showingRefundEligible ? "Refund eligible orders" : `${scopeLabel} orders`}</h2>
                <span>{listCount} shown</span>
              </div>

              {!listCount ? (
                <div className="admin-payments-empty">
                  <strong>No orders match</strong>
                  <p>
                    {showingRefundEligible
                      ? "No refund-eligible orders from the candidates API."
                      : "Try another filter or switch between Today and All time."}
                  </p>
                </div>
              ) : showingRefundEligible ? (
                <div className="admin-payments-order-list">
                  {filteredRefundCandidates.map((item) => {
                    const orderId = getRefundCandidateOrderId(item);
                    const order = item.order || item;
                    const isSelected = selectedOrderId === orderId;
                    return (
                      <button
                        key={orderId}
                        type="button"
                        className={`admin-payments-order admin-payments-order--refund${
                          isSelected ? " admin-payments-order--selected" : ""
                        }`}
                        onClick={() => setSelectedOrderId(orderId)}
                      >
                        <div className="admin-payments-order__main">
                          <div className="admin-payments-order__title">
                            <strong>{formatOrderLabel(order)}</strong>
                            <span className="admin-refund-badge">Refund eligible</span>
                            <AdminStatusBadge
                              status={order.paymentStatus ?? item.paymentStatus}
                              label={order.paymentStatus ?? item.paymentStatus ?? "—"}
                            />
                          </div>
                          <div className="admin-payments-order__meta">
                            {order.clientId ?? item.clientId ? (
                              <Link
                                to={adminRoutes.hotelDetail(order.clientId ?? item.clientId)}
                                onClick={(event) => event.stopPropagation()}
                              >
                                Client {order.clientId ?? item.clientId}
                              </Link>
                            ) : (
                              <span>—</span>
                            )}
                            <span>{order.slug ?? item.slug ?? "—"}</span>
                            <span>
                              {getRefundReasonLabel(item.refundReason || item.reason)}
                            </span>
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
                    );
                  })}
                </div>
              ) : (
                <div className="admin-payments-order-list">
                  {filteredOrders.map((order) => {
                    const isSelected = selectedOrderId === order.orderId;
                    const isRefundEligible = refundEligibleIds.has(order.orderId);
                    return (
                      <button
                        key={order.orderId}
                        type="button"
                        className={`admin-payments-order${
                          isSelected ? " admin-payments-order--selected" : ""
                        }${isRefundEligible ? " admin-payments-order--refund" : ""}`}
                        onClick={() => setSelectedOrderId(order.orderId)}
                      >
                        <div className="admin-payments-order__main">
                          <div className="admin-payments-order__title">
                            <strong>{formatOrderLabel(order)}</strong>
                            {isRefundEligible && (
                              <span className="admin-refund-badge">Refund eligible</span>
                            )}
                            <AdminStatusBadge
                              status={order.paymentStatus}
                              label={order.paymentStatus || "—"}
                            />
                          </div>
                          <div className="admin-payments-order__meta">
                            {order.clientId ? (
                              <Link
                                to={adminRoutes.hotelDetail(order.clientId)}
                                onClick={(event) => event.stopPropagation()}
                              >
                                Client {order.clientId}
                              </Link>
                            ) : (
                              <span>—</span>
                            )}
                            <span>{order.slug || "—"}</span>
                            <span>{order.customerName || "Guest"}</span>
                            {order.customerPhone && <span>{order.customerPhone}</span>}
                          </div>
                        </div>
                        <div className="admin-payments-order__side">
                          <span className="admin-payments-order__amount">
                            {formatAdminAmount(getOrderPayAmount(order))}
                          </span>
                          <span className="admin-payments-order__time">
                            {formatAdminTime(order.createdAt)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {selectedOrderId && (
            <AdminOrderDetailModal
              orderId={selectedOrderId}
              onClose={() => setSelectedOrderId(null)}
              onRefunded={() => loadPayments({ silent: true })}
            />
          )}
        </>
      )}
    </div>
  );
};

export default AdminPaymentsPage;
